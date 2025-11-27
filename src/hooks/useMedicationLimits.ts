import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "./useSubscription";
import { useUserProfiles } from "./useUserProfiles";

interface MedicationLimitsStats {
  activeCount: number;
  maxActive: number;
  canAddMedication: boolean;
  isPremium: boolean;
  remaining: number;
}

/**
 * Hook to manage medication limits
 * 
 * FREE users: Max 1 active medication
 * PREMIUM users: Unlimited medications
 * 
 * Enforces limits on items table where is_active = true
 */
export function useMedicationLimits() {
  const { subscription, loading: subLoading } = useSubscription();
  const { activeProfile } = useUserProfiles();
  const [stats, setStats] = useState<MedicationLimitsStats>({
    activeCount: 0,
    maxActive: 1,
    canAddMedication: false,
    isPremium: false,
    remaining: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMedicationStats();
  }, [subscription, activeProfile]);

  const loadMedicationStats = async () => {
    if (subLoading) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const planType = subscription?.plan_type || 'free';
      const status = subscription?.status || 'active';
      const isPremium = planType === 'premium' && status === 'active';

      // Premium users have unlimited medications
      if (isPremium) {
        setStats({
          activeCount: 0,
          maxActive: Infinity,
          canAddMedication: true,
          isPremium: true,
          remaining: Infinity,
        });
        setIsLoading(false);
        return;
      }

      // Free users: count active medications for current profile
      let query = supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (activeProfile) {
        query = query.eq('profile_id', activeProfile.id);
      }

      const { count, error } = await query;

      if (error) throw error;

      const activeCount = count || 0;
      const maxActive = 1;
      const remaining = Math.max(0, maxActive - activeCount);

      setStats({
        activeCount,
        maxActive,
        canAddMedication: activeCount < maxActive,
        isPremium: false,
        remaining,
      });
    } catch (error) {
      console.error('Error loading medication limits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = loadMedicationStats;

  return {
    ...stats,
    isLoading,
    refresh,
  };
}
