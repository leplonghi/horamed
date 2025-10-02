-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to create free subscription when user signs up
CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, expires_at)
  VALUES (
    NEW.id,
    'free',
    'active',
    now(),
    now() + INTERVAL '3 days'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription();

-- Function to check medication limit before insert
CREATE OR REPLACE FUNCTION public.check_medication_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_plan TEXT;
  subscription_status TEXT;
  item_count INT;
BEGIN
  -- Get user's subscription plan and status
  SELECT plan_type, status INTO subscription_plan, subscription_status
  FROM subscriptions
  WHERE user_id = NEW.user_id;
  
  -- If free plan and active, check limit
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
$$;

CREATE TRIGGER enforce_medication_limit
  BEFORE INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_medication_limit();

-- Trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();