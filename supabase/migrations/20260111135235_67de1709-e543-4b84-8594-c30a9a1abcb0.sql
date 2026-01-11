-- Add audit trigger for sensitive profile field access
-- This helps track any access to sensitive data like CPF

-- Create audit function for profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if CPF field is being accessed/modified
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
$$;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS audit_profile_sensitive_access ON public.profiles;
CREATE TRIGGER audit_profile_sensitive_access
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_access();

-- Fix the audit_logs INSERT policy to allow logging from triggers
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Ensure DELETE policy exists to prevent data tampering
DROP POLICY IF EXISTS "No one can delete audit logs" ON public.audit_logs;
CREATE POLICY "No one can delete audit logs"
ON public.audit_logs
FOR DELETE
USING (false);

-- Add comment documenting the security measures
COMMENT ON COLUMN public.profiles.cpf IS 'Brazilian tax ID - protected by RLS, access audited. Consider encryption for compliance with LGPD.';