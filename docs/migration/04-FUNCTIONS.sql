-- ============================================
-- HoraMed Database Functions & Triggers
-- Generated: 2026-01-30
-- ============================================

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Generic set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update medication interactions timestamp
CREATE OR REPLACE FUNCTION public.update_medication_interactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- REFERRAL CODE FUNCTIONS
-- ============================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'HR-' || upper(substring(md5(random()::text) from 1 for 6));
    
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE referral_code = new_code
    ) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-generate referral code trigger
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Set referral code trigger
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- USER CREATION FUNCTIONS
-- ============================================

-- Create primary user profile on signup
CREATE OR REPLACE FUNCTION public.create_primary_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    name,
    relationship,
    is_primary
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuário'),
    'self',
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create free subscription on signup
CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  is_premium_email boolean;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  SELECT EXISTS (
    SELECT 1 FROM public.premium_emails 
    WHERE lower(email) = lower(user_email)
  ) INTO is_premium_email;

  IF is_premium_email THEN
    INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, expires_at)
    VALUES (
      NEW.id,
      'premium',
      'active',
      now(),
      now() + INTERVAL '10 years'
    );
  ELSE
    INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, expires_at)
    VALUES (
      NEW.id,
      'free',
      'active',
      now(),
      now() + INTERVAL '3 days'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- SUBSCRIPTION FUNCTIONS
-- ============================================

-- Check if user is on trial
CREATE OR REPLACE FUNCTION public.is_on_trial(p_user_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND trial_ends_at > now()
      AND status = 'active'
      AND trial_used = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Get user referral discount
CREATE OR REPLACE FUNCTION public.get_user_referral_discount(p_user_id uuid)
RETURNS NUMERIC AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Check medication limit for free users
CREATE OR REPLACE FUNCTION public.check_medication_limit()
RETURNS TRIGGER AS $$
DECLARE
  subscription_plan TEXT;
  subscription_status TEXT;
  item_count INT;
BEGIN
  SELECT plan_type, status INTO subscription_plan, subscription_status
  FROM subscriptions
  WHERE user_id = NEW.user_id;
  
  IF subscription_plan = 'free' AND subscription_status = 'active' THEN
    SELECT COUNT(*) INTO item_count
    FROM items
    WHERE user_id = NEW.user_id AND is_active = true;
    
    IF item_count >= 1 THEN
      RAISE EXCEPTION 'Limite de medicamentos atingido. Faça upgrade para o plano Premium!';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- CONSENT FUNCTIONS
-- ============================================

-- Check if user has consent
CREATE OR REPLACE FUNCTION public.has_consent(p_user_id uuid, p_purpose consent_purpose)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.consents
    WHERE user_id = p_user_id
      AND purpose = p_purpose
      AND granted = true
      AND revoked_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- FRAUD DETECTION FUNCTIONS
-- ============================================

-- Check for device fingerprint duplicate
CREATE OR REPLACE FUNCTION public.check_device_duplicate(p_fingerprint text, p_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE device_fingerprint = p_fingerprint
    AND user_id != p_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- REFERRAL SYSTEM FUNCTIONS
-- ============================================

-- Validate referral signup
CREATE OR REPLACE FUNCTION public.validate_referral_signup(
  p_referred_user_id uuid, 
  p_referral_code text, 
  p_device_fingerprint text, 
  p_ip_address inet
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_fraud_detected BOOLEAN := false;
  v_fraud_reasons JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;
  
  IF public.check_device_duplicate(p_device_fingerprint, p_referred_user_id) THEN
    v_fraud_detected := true;
    v_fraud_reasons := v_fraud_reasons || jsonb_build_array('duplicate_device');
    
    INSERT INTO public.referral_fraud_logs (user_id, referrer_id, fraud_type, device_fingerprint, ip_address, details)
    VALUES (p_referred_user_id, v_referrer_id, 'duplicate_device', p_device_fingerprint, p_ip_address, 
      jsonb_build_object('message', 'Device already used by another account'));
  END IF;
  
  IF (SELECT COUNT(*) FROM public.referral_fraud_logs 
      WHERE ip_address = p_ip_address 
      AND created_at > now() - interval '24 hours') > 3 THEN
    v_fraud_detected := true;
    v_fraud_reasons := v_fraud_reasons || jsonb_build_array('rapid_signups');
    
    INSERT INTO public.referral_fraud_logs (user_id, referrer_id, fraud_type, device_fingerprint, ip_address, details)
    VALUES (p_referred_user_id, v_referrer_id, 'rapid_signups', p_device_fingerprint, p_ip_address,
      jsonb_build_object('message', 'Too many signups from same IP'));
  END IF;
  
  IF v_fraud_detected THEN
    RETURN jsonb_build_object(
      'success', false, 
      'fraud_detected', true,
      'reasons', v_fraud_reasons
    );
  END IF;
  
  INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code_used, plan_type, status)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 'free', 'pending')
  RETURNING id INTO v_referral_id;
  
  UPDATE public.profiles
  SET device_fingerprint = p_device_fingerprint
  WHERE user_id = p_referred_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Complete referral onboarding
CREATE OR REPLACE FUNCTION public.complete_referral_onboarding(p_user_id uuid)
RETURNS JSONB AS $$
DECLARE
  v_referral RECORD;
  v_referrer_goals RECORD;
BEGIN
  UPDATE public.profiles
  SET onboarding_completed_at = now()
  WHERE user_id = p_user_id;
  
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = p_user_id
  AND status = 'pending'
  LIMIT 1;
  
  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'has_referral', false);
  END IF;
  
  UPDATE public.referrals
  SET status = 'signup_completed',
      updated_at = now()
  WHERE id = v_referral.id;
  
  INSERT INTO public.referral_rewards (referral_id, reward_type, reward_value, status, granted_at, expires_at)
  VALUES (v_referral.id, 'trial_7_days', 7, 'granted', now(), now() + interval '7 days');
  
  UPDATE public.subscriptions
  SET trial_ends_at = now() + interval '7 days',
      trial_used = true
  WHERE user_id = p_user_id;
  
  INSERT INTO public.referral_rewards (referral_id, reward_type, status, granted_at, expires_at)
  VALUES (v_referral.id, 'extra_report', 'pending', now(), now() + interval '30 days');
  
  INSERT INTO public.referral_goals (user_id, goal_type, current_count, target_count)
  VALUES (v_referral.referrer_user_id, 'signups_10', 1, 10)
  ON CONFLICT (user_id, goal_type) 
  DO UPDATE SET 
    current_count = referral_goals.current_count + 1,
    updated_at = now();
  
  SELECT * INTO v_referrer_goals
  FROM public.referral_goals
  WHERE user_id = v_referral.referrer_user_id
  AND goal_type = 'signups_10';
  
  IF v_referrer_goals.current_count >= 10 AND NOT v_referrer_goals.reward_granted THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Process referral subscription
CREATE OR REPLACE FUNCTION public.process_referral_subscription(
  p_referred_user_id uuid, 
  p_plan_type text, 
  p_subscription_days integer DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_referral RECORD;
  v_discount_value NUMERIC;
  v_current_discount RECORD;
  v_goal_type TEXT;
  v_target_count INTEGER;
BEGIN
  IF p_subscription_days < 7 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription too new');
  END IF;
  
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = p_referred_user_id
  AND status IN ('pending', 'signup_completed')
  LIMIT 1;
  
  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'has_referral', false);
  END IF;
  
  IF p_plan_type = 'annual' THEN
    v_discount_value := 15;
    v_goal_type := 'annual_subs_3';
    v_target_count := 3;
  ELSE
    v_discount_value := 15;
    v_goal_type := 'monthly_subs_5';
    v_target_count := 5;
  END IF;
  
  UPDATE public.referrals
  SET status = 'active',
      plan_type = CASE WHEN p_plan_type = 'annual' THEN 'premium_annual' ELSE 'premium_monthly' END,
      activated_at = now(),
      updated_at = now()
  WHERE id = v_referral.id;
  
  INSERT INTO public.referral_discounts (user_id, discount_percent, valid_until)
  VALUES (v_referral.referrer_user_id, v_discount_value, now() + interval '1 year')
  ON CONFLICT (user_id) DO UPDATE SET
    discount_percent = LEAST(referral_discounts.discount_percent + v_discount_value, 90),
    cycles_used = 0,
    updated_at = now();
  
  INSERT INTO public.referral_rewards (referral_id, reward_type, reward_value, status, granted_at)
  VALUES (v_referral.id, 'discount', v_discount_value, 'granted', now());
  
  INSERT INTO public.referral_goals (user_id, goal_type, current_count, target_count)
  VALUES (v_referral.referrer_user_id, v_goal_type, 1, v_target_count)
  ON CONFLICT (user_id, goal_type) 
  DO UPDATE SET 
    current_count = referral_goals.current_count + 1,
    updated_at = now();
  
  PERFORM check_and_grant_referral_goals(v_referral.referrer_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral.id,
    'discount_granted', v_discount_value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check and grant referral goals
CREATE OR REPLACE FUNCTION public.check_and_grant_referral_goals(p_user_id uuid)
RETURNS VOID AS $$
DECLARE
  v_goal RECORD;
BEGIN
  FOR v_goal IN 
    SELECT * FROM public.referral_goals 
    WHERE user_id = p_user_id 
    AND completed_at IS NULL
  LOOP
    IF v_goal.current_count >= v_goal.target_count AND NOT v_goal.reward_granted THEN
      IF v_goal.goal_type = 'signups_10' THEN
        UPDATE public.subscriptions
        SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '1 month'
        WHERE user_id = p_user_id;
        
      ELSIF v_goal.goal_type = 'monthly_subs_5' THEN
        UPDATE public.subscriptions
        SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '1 month'
        WHERE user_id = p_user_id;
        
      ELSIF v_goal.goal_type = 'annual_subs_3' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- STOCK FUNCTIONS
-- ============================================

-- Calculate projected end date for stock
CREATE OR REPLACE FUNCTION public.calculate_projected_end_at(p_stock_id uuid)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_units_left numeric;
  v_item_id uuid;
  v_daily_consumption numeric;
  v_days_remaining numeric;
BEGIN
  SELECT units_left, item_id INTO v_units_left, v_item_id
  FROM stock WHERE id = p_stock_id;
  
  IF v_units_left <= 0 THEN
    RETURN now();
  END IF;
  
  SELECT COALESCE(
    COUNT(*)::numeric / 7.0, 
    0
  ) INTO v_daily_consumption
  FROM dose_instances
  WHERE item_id = v_item_id
    AND status = 'taken'
    AND taken_at >= now() - interval '7 days';
  
  IF v_daily_consumption = 0 THEN
    SELECT COALESCE(
      SUM(array_length(times::text[], 1)),
      1
    ) INTO v_daily_consumption
    FROM schedules
    WHERE item_id = v_item_id
      AND is_active = true;
  END IF;
  
  v_days_remaining := v_units_left / NULLIF(v_daily_consumption, 0);
  
  IF v_days_remaining IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN now() + (v_days_remaining || ' days')::interval;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUDIT FUNCTIONS
-- ============================================

-- Log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.cpf IS DISTINCT FROM NEW.cpf OR OLD.birth_date IS DISTINCT FROM NEW.birth_date) THEN
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, metadata)
    VALUES (
      auth.uid(),
      'profile_sensitive_update',
      'profiles',
      NEW.id::text,
      jsonb_build_object(
        'fields_changed', CASE 
          WHEN OLD.cpf IS DISTINCT FROM NEW.cpf AND OLD.birth_date IS DISTINCT FROM NEW.birth_date THEN 'cpf,birth_date'
          WHEN OLD.cpf IS DISTINCT FROM NEW.cpf THEN 'cpf'
          ELSE 'birth_date'
        END,
        'timestamp', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- TRIGGERS (apply after tables are created)
-- ============================================

-- Updated_at triggers
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_items
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_notification_preferences
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_medication_interactions
  BEFORE UPDATE ON public.medication_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_medication_interactions_timestamp();

-- Referral code trigger
CREATE TRIGGER auto_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_referral_code();

-- Audit trigger
CREATE TRIGGER log_profile_access_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- NOTE: Triggers for auth.users are NOT included here because:
-- 1. create_primary_user_profile - triggers on auth.users insert
-- 2. create_free_subscription - triggers on auth.users insert
-- These must be created separately with proper permissions in Supabase Dashboard
