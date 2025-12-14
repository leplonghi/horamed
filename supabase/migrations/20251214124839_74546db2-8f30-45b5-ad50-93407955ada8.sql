
-- Create trigger to automatically create subscription for new users
-- This handles both email/password and Google OAuth signups
CREATE OR REPLACE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription();
