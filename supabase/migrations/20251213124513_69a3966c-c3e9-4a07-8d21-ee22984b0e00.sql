-- Fix 1: Drop permissive premium_emails SELECT policy and block client access
DROP POLICY IF EXISTS "Only authenticated users can view premium emails" ON premium_emails;

CREATE POLICY "Only service role can view premium emails"
ON premium_emails FOR SELECT
USING (false);

-- Fix 2: Drop permissive referrals UPDATE policy and block client access
DROP POLICY IF EXISTS "System can update referrals" ON referrals;

CREATE POLICY "Only service role can update referrals"
ON referrals FOR UPDATE
USING (false);