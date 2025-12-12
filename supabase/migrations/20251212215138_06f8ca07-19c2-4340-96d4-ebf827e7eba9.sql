-- Fix overly permissive RLS policies on referrals and referral_rewards tables
-- These policies allowed any authenticated user to insert/update records, enabling fraud

-- Drop the overly permissive referrals INSERT policy
DROP POLICY IF EXISTS "System can insert referrals" ON referrals;

-- Create restrictive policy - only service role can insert (edge functions use SERVICE_ROLE_KEY)
CREATE POLICY "Only service role can insert referrals"
ON referrals FOR INSERT
WITH CHECK (false);

-- Drop the overly permissive referral_rewards policies
DROP POLICY IF EXISTS "System can insert rewards" ON referral_rewards;
DROP POLICY IF EXISTS "System can update rewards" ON referral_rewards;

-- Create restrictive policies for referral_rewards
CREATE POLICY "Only service role can insert rewards"
ON referral_rewards FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only service role can update rewards"
ON referral_rewards FOR UPDATE
USING (false);