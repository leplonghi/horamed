import { supabase } from "@/integrations/supabase/client";

/**
 * Get cumulative discount percentage from all active referrals for premium users
 */
export async function getReferralDiscountForUser(userId: string): Promise<number> {
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('plan_type')
    .eq('referrer_user_id', userId)
    .eq('status', 'active');

  if (error || !referrals) return 0;

  let totalDiscount = 0;
  for (const referral of referrals) {
    if (referral.plan_type === 'premium_monthly') {
      totalDiscount += 20;
    } else if (referral.plan_type === 'premium_annual') {
      totalDiscount += 40;
    }
  }

  // Cap at 100%
  return Math.min(totalDiscount, 100);
}

/**
 * Get number of extra active item slots earned via referrals (free users only)
 * Max 3 slots per month
 */
export async function getFreeExtraSlotsForUser(userId: string, currentMonth: Date): Promise<number> {
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_user_id', userId)
    .eq('status', 'active')
    .gte('activated_at', monthStart.toISOString())
    .lte('activated_at', monthEnd.toISOString());

  if (error || !referrals) return 0;

  // Each active referral = +1 slot, max 3 per month
  return Math.min(referrals.length, 3);
}

/**
 * Get user's effective max active items based on plan and referrals
 * Free: 1 + extra slots (from referrals)
 * Premium: Infinity (unlimited)
 */
export async function getUserEffectiveMaxActiveItems(userId: string): Promise<number> {
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', userId)
    .single();

  // Premium users have unlimited
  if (subscription?.plan_type === 'premium' && subscription?.status === 'active') {
    return Infinity;
  }

  // Free users: 1 base + extra slots from referrals
  const extraSlots = await getFreeExtraSlotsForUser(userId, new Date());
  return 1 + extraSlots;
}

/**
 * Check if user can activate another item
 */
export async function canUserActivateAnotherItem(userId: string): Promise<{
  allowed: boolean;
  currentActive: number;
  maxAllowed: number;
  isPremium: boolean;
}> {
  // Get current active items count
  const { count: currentActive } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  const maxAllowed = await getUserEffectiveMaxActiveItems(userId);
  const isPremium = maxAllowed === Infinity;

  return {
    allowed: (currentActive || 0) < maxAllowed,
    currentActive: currentActive || 0,
    maxAllowed: isPremium ? Infinity : maxAllowed,
    isPremium
  };
}

/**
 * Process referral on signup
 */
export async function processReferralOnSignup(referredUserId: string, referralCode: string): Promise<void> {
  // Find referrer by code
  const { data: referrerProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('referral_code', referralCode)
    .single();

  if (!referrerProfile) return;

  // Create pending referral
  await supabase
    .from('referrals')
    .insert({
      referrer_user_id: referrerProfile.user_id,
      referred_user_id: referredUserId,
      referral_code_used: referralCode,
      plan_type: 'free',
      status: 'pending'
    });
}

/**
 * Activate referral when user upgrades to premium
 */
export async function activateReferralOnUpgrade(userId: string, planType: 'premium_monthly' | 'premium_annual'): Promise<void> {
  // Find pending referral for this user
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_user_id', userId)
    .eq('status', 'pending')
    .single();

  if (!referral) return;

  // Activate referral
  await supabase
    .from('referrals')
    .update({
      status: 'active',
      plan_type: planType,
      activated_at: new Date().toISOString()
    })
    .eq('id', referral.id);
}
