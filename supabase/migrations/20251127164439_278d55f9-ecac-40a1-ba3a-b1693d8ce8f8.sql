-- Enhance referral system with separate rewards tracking and better audit trail

-- Create referral_rewards table to track individual rewards
CREATE TABLE referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  reward_type text NOT NULL, -- 'discount_monthly', 'discount_annual', 'extra_slot_free'
  reward_value numeric, -- percentage or number value (20, 40, 1, etc)
  granted_at timestamp with time zone DEFAULT now(),
  redeemed_at timestamp with time zone,
  expires_at timestamp with time zone,
  status text NOT NULL CHECK (status IN ('pending','redeemed','expired','revoked')) DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_referral_rewards_referral ON referral_rewards(referral_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_granted_at ON referral_rewards(granted_at);

-- Enable RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view rewards for referrals they made
CREATE POLICY "Users can view rewards for their referrals"
  ON referral_rewards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referrals
      WHERE referrals.id = referral_rewards.referral_id
      AND referrals.referrer_user_id = auth.uid()
    )
  );

-- System (backend) can insert rewards
CREATE POLICY "System can insert rewards"
  ON referral_rewards
  FOR INSERT
  WITH CHECK (true);

-- System (backend) can update rewards
CREATE POLICY "System can update rewards"
  ON referral_rewards
  FOR UPDATE
  USING (true);

-- Add trigger for automatic updated_at
CREATE TRIGGER update_referral_rewards_updated_at
  BEFORE UPDATE ON referral_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enhance referrals table with metadata for audit trail
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add trigger for referrals updated_at
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();