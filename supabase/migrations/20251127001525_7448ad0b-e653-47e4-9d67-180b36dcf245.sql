-- Fix search_path for security on all custom functions
ALTER FUNCTION generate_referral_code() SET search_path = public;
ALTER FUNCTION auto_generate_referral_code() SET search_path = public;