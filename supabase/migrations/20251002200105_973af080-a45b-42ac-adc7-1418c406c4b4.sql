-- Security Fix: Protect notification_preferences table
-- Remove any permissive policies and ensure only authenticated users can access their own data

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;

-- Ensure RLS is enabled
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (prevents bypassing RLS)
ALTER TABLE public.notification_preferences FORCE ROW LEVEL SECURITY;

-- Create strict policies that require authentication and user ownership
CREATE POLICY "authenticated_users_select_own_preferences"
ON public.notification_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_preferences"
ON public.notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_preferences"
ON public.notification_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_preferences"
ON public.notification_preferences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revoke all public access
REVOKE ALL ON public.notification_preferences FROM anon;
REVOKE ALL ON public.notification_preferences FROM public;

-- Grant only necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;