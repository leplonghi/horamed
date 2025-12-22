import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  signupReferrals: number;
  activeReferrals: number;
  discountPercent: number;
  cyclesRemaining: number;
  goals: {
    signups_10: { current: number; target: number; completed: boolean };
    monthly_subs_5: { current: number; target: number; completed: boolean };
    annual_subs_3: { current: number; target: number; completed: boolean };
  };
  availableRewards: Array<{
    id: string;
    type: string;
    status: string;
    expiresAt: string | null;
  }>;
  recentReferrals: Array<{
    id: string;
    status: string;
    planType: string;
    createdAt: string;
    activatedAt: string | null;
  }>;
}

const defaultStats: ReferralStats = {
  referralCode: '',
  totalReferrals: 0,
  signupReferrals: 0,
  activeReferrals: 0,
  discountPercent: 0,
  cyclesRemaining: 6,
  goals: {
    signups_10: { current: 0, target: 10, completed: false },
    monthly_subs_5: { current: 0, target: 5, completed: false },
    annual_subs_3: { current: 0, target: 3, completed: false },
  },
  availableRewards: [],
  recentReferrals: [],
};

export function useReferralSystem() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [stats, setStats] = useState<ReferralStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [headerState, setHeaderState] = useState<'default' | 'new_referral' | 'discount_earned' | 'goal_close'>('default');

  const loadReferralData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      // Load referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      // Load goals
      const { data: goals } = await supabase
        .from('referral_goals')
        .select('*')
        .eq('user_id', user.id);

      // Load discount
      const { data: discount } = await supabase
        .from('referral_discounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Load available rewards
      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('*')
        .in('referral_id', (referrals || []).map(r => r.id))
        .in('status', ['pending', 'granted']);

      // Calculate stats
      const signupCount = (referrals || []).filter(r => r.status === 'signup_completed' || r.status === 'active').length;
      const activeCount = (referrals || []).filter(r => r.status === 'active').length;

      const goalsMap = (goals || []).reduce((acc, g) => {
        acc[g.goal_type] = {
          current: g.current_count,
          target: g.target_count,
          completed: !!g.completed_at,
        };
        return acc;
      }, {} as Record<string, { current: number; target: number; completed: boolean }>);

      setStats({
        referralCode: profile?.referral_code || '',
        totalReferrals: (referrals || []).length,
        signupReferrals: signupCount,
        activeReferrals: activeCount,
        discountPercent: discount?.discount_percent || 0,
        cyclesRemaining: discount ? discount.max_cycles - discount.cycles_used : 6,
        goals: {
          signups_10: goalsMap['signups_10'] || { current: 0, target: 10, completed: false },
          monthly_subs_5: goalsMap['monthly_subs_5'] || { current: 0, target: 5, completed: false },
          annual_subs_3: goalsMap['annual_subs_3'] || { current: 0, target: 3, completed: false },
        },
        availableRewards: (rewards || []).map(r => ({
          id: r.id,
          type: r.reward_type,
          status: r.status,
          expiresAt: r.expires_at,
        })),
        recentReferrals: (referrals || []).slice(0, 10).map(r => ({
          id: r.id,
          status: r.status,
          planType: r.plan_type,
          createdAt: r.created_at,
          activatedAt: r.activated_at,
        })),
      });

      // Determine header state
      const hasNewReferral = (referrals || []).some(r => {
        const createdAt = new Date(r.created_at);
        const now = new Date();
        return now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000; // Last 24h
      });

      const hasNewDiscount = (referrals || []).some(r => {
        if (!r.activated_at) return false;
        const activatedAt = new Date(r.activated_at);
        const now = new Date();
        return now.getTime() - activatedAt.getTime() < 24 * 60 * 60 * 1000;
      });

      const isCloseToGoal = Object.values(goalsMap).some(g => 
        !g.completed && g.current >= g.target - 2 && g.current < g.target
      );

      if (hasNewDiscount) {
        setHeaderState('discount_earned');
      } else if (hasNewReferral) {
        setHeaderState('new_referral');
      } else if (isCloseToGoal) {
        setHeaderState('goal_close');
      } else {
        setHeaderState('default');
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const generateReferralLink = useCallback(() => {
    if (!stats.referralCode) return '';
    return `${window.location.origin}/auth?ref=${stats.referralCode}`;
  }, [stats.referralCode]);

  const claimReward = useCallback(async (rewardId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('referral_rewards')
        .update({ 
          status: 'claimed',
          claimed_at: new Date().toISOString()
        })
        .eq('id', rewardId);

      if (error) throw error;
      
      await loadReferralData();
      return true;
    } catch (error) {
      console.error('Error claiming reward:', error);
      return false;
    }
  }, [user, loadReferralData]);

  return {
    stats,
    loading,
    headerState,
    generateReferralLink,
    claimReward,
    refresh: loadReferralData,
    isPremium,
  };
}
