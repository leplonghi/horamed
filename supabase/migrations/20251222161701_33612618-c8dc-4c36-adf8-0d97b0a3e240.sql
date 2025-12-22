-- ==========================================
-- SISTEMA DE REFERRAL COMPLETO - HORAMED
-- ==========================================

-- 1. Adicionar campos de anti-fraude na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS cpf_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. Criar tabela de referral rewards (recompensas)
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'extra_report', 'extra_document', 'extra_notification', 'extra_profile', 'premium_month', 'premium_year', 'trial_7_days')),
  reward_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'claimed', 'expired', 'revoked')),
  granted_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Criar tabela de metas de indicação
CREATE TABLE IF NOT EXISTS public.referral_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('signups_10', 'monthly_subs_5', 'annual_subs_3')),
  current_count INTEGER DEFAULT 0,
  target_count INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, goal_type)
);

-- 4. Criar tabela de logs de anti-fraude
CREATE TABLE IF NOT EXISTS public.referral_fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  referrer_id UUID,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  fraud_type TEXT NOT NULL CHECK (fraud_type IN ('duplicate_device', 'duplicate_ip', 'rapid_signups', 'early_cancellation', 'suspicious_pattern')),
  details JSONB DEFAULT '{}',
  ip_address INET,
  device_fingerprint TEXT,
  action_taken TEXT DEFAULT 'flagged' CHECK (action_taken IN ('flagged', 'blocked', 'rewards_revoked', 'user_blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Criar tabela de descontos acumulados
CREATE TABLE IF NOT EXISTS public.referral_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discount_percent NUMERIC NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 90),
  cycles_used INTEGER DEFAULT 0,
  max_cycles INTEGER DEFAULT 6,
  stripe_coupon_id TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 6. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral ON public.referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON public.referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_goals_user ON public.referral_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_fraud_user ON public.referral_fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_fraud_device ON public.referral_fraud_logs(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_profiles_device ON public.profiles(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- 7. Enable RLS em todas as tabelas novas
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_discounts ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies para referral_rewards
CREATE POLICY "Users can view their referral rewards" ON public.referral_rewards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.referrals r 
    WHERE r.id = referral_rewards.referral_id 
    AND r.referrer_user_id = auth.uid()
  )
);

-- 9. RLS Policies para referral_goals
CREATE POLICY "Users can view their own goals" ON public.referral_goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.referral_goals
FOR UPDATE USING (auth.uid() = user_id);

-- 10. RLS Policies para referral_fraud_logs (somente leitura para o próprio usuário)
CREATE POLICY "Users can view their own fraud logs" ON public.referral_fraud_logs
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = referrer_id);

-- 11. RLS Policies para referral_discounts
CREATE POLICY "Users can view their own discounts" ON public.referral_discounts
FOR SELECT USING (auth.uid() = user_id);

-- 12. Função para calcular desconto atual do usuário
CREATE OR REPLACE FUNCTION public.get_user_referral_discount(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount NUMERIC;
BEGIN
  SELECT COALESCE(discount_percent, 0) INTO v_discount
  FROM public.referral_discounts
  WHERE user_id = p_user_id
    AND (valid_until IS NULL OR valid_until > now())
    AND cycles_used < max_cycles;
  
  RETURN COALESCE(v_discount, 0);
END;
$$;

-- 13. Função para verificar dispositivo duplicado
CREATE OR REPLACE FUNCTION public.check_device_duplicate(p_fingerprint TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE device_fingerprint = p_fingerprint
    AND user_id != p_user_id
  );
END;
$$;

-- 14. Função para validar indicação com anti-fraude
CREATE OR REPLACE FUNCTION public.validate_referral_signup(
  p_referred_user_id UUID,
  p_referral_code TEXT,
  p_device_fingerprint TEXT,
  p_ip_address INET
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_fraud_detected BOOLEAN := false;
  v_fraud_reasons JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- Buscar referrer pelo código
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;
  
  -- Check 1: Device fingerprint duplicado
  IF public.check_device_duplicate(p_device_fingerprint, p_referred_user_id) THEN
    v_fraud_detected := true;
    v_fraud_reasons := v_fraud_reasons || jsonb_build_array('duplicate_device');
    
    INSERT INTO public.referral_fraud_logs (user_id, referrer_id, fraud_type, device_fingerprint, ip_address, details)
    VALUES (p_referred_user_id, v_referrer_id, 'duplicate_device', p_device_fingerprint, p_ip_address, 
      jsonb_build_object('message', 'Device already used by another account'));
  END IF;
  
  -- Check 2: Muitos cadastros do mesmo IP nas últimas 24h
  IF (SELECT COUNT(*) FROM public.referral_fraud_logs 
      WHERE ip_address = p_ip_address 
      AND created_at > now() - interval '24 hours') > 3 THEN
    v_fraud_detected := true;
    v_fraud_reasons := v_fraud_reasons || jsonb_build_array('rapid_signups');
    
    INSERT INTO public.referral_fraud_logs (user_id, referrer_id, fraud_type, device_fingerprint, ip_address, details)
    VALUES (p_referred_user_id, v_referrer_id, 'rapid_signups', p_device_fingerprint, p_ip_address,
      jsonb_build_object('message', 'Too many signups from same IP'));
  END IF;
  
  -- Se fraude detectada, não criar referral
  IF v_fraud_detected THEN
    RETURN jsonb_build_object(
      'success', false, 
      'fraud_detected', true,
      'reasons', v_fraud_reasons
    );
  END IF;
  
  -- Criar referral pendente
  INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code_used, plan_type, status)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 'free', 'pending')
  RETURNING id INTO v_referral_id;
  
  -- Salvar fingerprint no profile do usuário
  UPDATE public.profiles
  SET device_fingerprint = p_device_fingerprint
  WHERE user_id = p_referred_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_id
  );
END;
$$;

-- 15. Função para completar onboarding e ativar benefícios
CREATE OR REPLACE FUNCTION public.complete_referral_onboarding(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_goals RECORD;
BEGIN
  -- Marcar onboarding como completo
  UPDATE public.profiles
  SET onboarding_completed_at = now()
  WHERE user_id = p_user_id;
  
  -- Buscar referral pendente
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = p_user_id
  AND status = 'pending'
  LIMIT 1;
  
  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'has_referral', false);
  END IF;
  
  -- Atualizar status do referral
  UPDATE public.referrals
  SET status = 'signup_completed',
      updated_at = now()
  WHERE id = v_referral.id;
  
  -- Dar 7 dias de trial Premium para o indicado
  INSERT INTO public.referral_rewards (referral_id, reward_type, reward_value, status, granted_at, expires_at)
  VALUES (v_referral.id, 'trial_7_days', 7, 'granted', now(), now() + interval '7 days');
  
  -- Atualizar subscription do indicado com trial
  UPDATE public.subscriptions
  SET trial_ends_at = now() + interval '7 days',
      trial_used = true
  WHERE user_id = p_user_id;
  
  -- Dar benefício escolhível ao indicador (extra_report por padrão)
  INSERT INTO public.referral_rewards (referral_id, reward_type, status, granted_at, expires_at)
  VALUES (v_referral.id, 'extra_report', 'pending', now(), now() + interval '30 days');
  
  -- Atualizar contadores de metas do indicador
  INSERT INTO public.referral_goals (user_id, goal_type, current_count, target_count)
  VALUES (v_referral.referrer_user_id, 'signups_10', 1, 10)
  ON CONFLICT (user_id, goal_type) 
  DO UPDATE SET 
    current_count = referral_goals.current_count + 1,
    updated_at = now();
  
  -- Verificar se atingiu meta de 10 cadastros
  SELECT * INTO v_referrer_goals
  FROM public.referral_goals
  WHERE user_id = v_referral.referrer_user_id
  AND goal_type = 'signups_10';
  
  IF v_referrer_goals.current_count >= 10 AND NOT v_referrer_goals.reward_granted THEN
    -- Dar 1 mês Premium grátis
    INSERT INTO public.referral_rewards (referral_id, reward_type, reward_value, status, granted_at)
    VALUES (v_referral.id, 'premium_month', 1, 'granted', now());
    
    UPDATE public.referral_goals
    SET completed_at = now(), reward_granted = true
    WHERE id = v_referrer_goals.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'has_referral', true,
    'referral_id', v_referral.id,
    'trial_days', 7
  );
END;
$$;

-- 16. Função para processar pagamento de assinatura
CREATE OR REPLACE FUNCTION public.process_referral_subscription(
  p_referred_user_id UUID,
  p_plan_type TEXT, -- 'monthly' ou 'annual'
  p_subscription_days INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_discount_value NUMERIC;
  v_current_discount RECORD;
  v_goal_type TEXT;
  v_target_count INTEGER;
BEGIN
  -- Verificar se assinatura tem pelo menos 7 dias (anti-fraude)
  IF p_subscription_days < 7 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription too new');
  END IF;
  
  -- Buscar referral
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = p_referred_user_id
  AND status IN ('pending', 'signup_completed')
  LIMIT 1;
  
  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'has_referral', false);
  END IF;
  
  -- Definir valores baseado no plano
  IF p_plan_type = 'annual' THEN
    v_discount_value := 15; -- 15% por indicação
    v_goal_type := 'annual_subs_3';
    v_target_count := 3;
  ELSE
    v_discount_value := 15;
    v_goal_type := 'monthly_subs_5';
    v_target_count := 5;
  END IF;
  
  -- Atualizar referral para ativo
  UPDATE public.referrals
  SET status = 'active',
      plan_type = CASE WHEN p_plan_type = 'annual' THEN 'premium_annual' ELSE 'premium_monthly' END,
      activated_at = now(),
      updated_at = now()
  WHERE id = v_referral.id;
  
  -- Adicionar desconto para o indicador
  INSERT INTO public.referral_discounts (user_id, discount_percent, valid_until)
  VALUES (v_referral.referrer_user_id, v_discount_value, now() + interval '1 year')
  ON CONFLICT (user_id) DO UPDATE SET
    discount_percent = LEAST(referral_discounts.discount_percent + v_discount_value, 90),
    cycles_used = 0, -- Reset cycles when new discount added
    updated_at = now();
  
  -- Criar reward de desconto
  INSERT INTO public.referral_rewards (referral_id, reward_type, reward_value, status, granted_at)
  VALUES (v_referral.id, 'discount', v_discount_value, 'granted', now());
  
  -- Atualizar metas de assinatura
  INSERT INTO public.referral_goals (user_id, goal_type, current_count, target_count)
  VALUES (v_referral.referrer_user_id, v_goal_type, 1, v_target_count)
  ON CONFLICT (user_id, goal_type) 
  DO UPDATE SET 
    current_count = referral_goals.current_count + 1,
    updated_at = now();
  
  -- Verificar metas atingidas
  PERFORM check_and_grant_referral_goals(v_referral.referrer_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral.id,
    'discount_granted', v_discount_value
  );
END;
$$;

-- 17. Função para verificar e conceder metas
CREATE OR REPLACE FUNCTION public.check_and_grant_referral_goals(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal RECORD;
BEGIN
  FOR v_goal IN 
    SELECT * FROM public.referral_goals 
    WHERE user_id = p_user_id 
    AND completed_at IS NULL
  LOOP
    IF v_goal.current_count >= v_goal.target_count AND NOT v_goal.reward_granted THEN
      -- Conceder recompensa baseada no tipo de meta
      IF v_goal.goal_type = 'signups_10' THEN
        -- 10 cadastros = 1 mês Premium
        UPDATE public.subscriptions
        SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '1 month'
        WHERE user_id = p_user_id;
        
      ELSIF v_goal.goal_type = 'monthly_subs_5' THEN
        -- 5 assinaturas mensais = 1 mês Premium
        UPDATE public.subscriptions
        SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '1 month'
        WHERE user_id = p_user_id;
        
      ELSIF v_goal.goal_type = 'annual_subs_3' THEN
        -- 3 assinaturas anuais = 1 ano Premium
        UPDATE public.subscriptions
        SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '1 year'
        WHERE user_id = p_user_id;
      END IF;
      
      UPDATE public.referral_goals
      SET completed_at = now(), reward_granted = true
      WHERE id = v_goal.id;
    END IF;
  END LOOP;
END;
$$;

-- 18. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_rewards_updated_at
  BEFORE UPDATE ON public.referral_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_referral_goals_updated_at
  BEFORE UPDATE ON public.referral_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_referral_discounts_updated_at
  BEFORE UPDATE ON public.referral_discounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();