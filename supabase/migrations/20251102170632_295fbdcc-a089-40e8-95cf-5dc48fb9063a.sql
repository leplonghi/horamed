-- Create premium emails whitelist table
CREATE TABLE IF NOT EXISTS public.premium_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage premium emails (we'll set this up properly later)
CREATE POLICY "Only authenticated users can view premium emails"
ON public.premium_emails
FOR SELECT
TO authenticated
USING (true);

-- Insert the premium emails
INSERT INTO public.premium_emails (email) VALUES
  ('glendagrota2@gmail.com'),
  ('luanamuiella@gmail.com'),
  ('julianafrotaac@gmail.com'),
  ('arllencordeiro@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Update the create_free_subscription function to check premium emails
CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  is_premium_email boolean;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Check if email is in premium list
  SELECT EXISTS (
    SELECT 1 FROM public.premium_emails 
    WHERE lower(email) = lower(user_email)
  ) INTO is_premium_email;

  -- Create subscription based on email status
  IF is_premium_email THEN
    INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, expires_at)
    VALUES (
      NEW.id,
      'premium',
      'active',
      now(),
      now() + INTERVAL '10 years' -- Essentially lifetime premium
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
$function$;

-- Update existing users if they exist
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    INNER JOIN public.premium_emails pe ON lower(au.email) = lower(pe.email)
  LOOP
    -- Update or insert premium subscription
    INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, expires_at)
    VALUES (
      user_record.id,
      'premium',
      'active',
      now(),
      now() + INTERVAL '10 years'
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      plan_type = 'premium',
      status = 'active',
      expires_at = now() + INTERVAL '10 years',
      updated_at = now();
  END LOOP;
END $$;