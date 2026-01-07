import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, differenceInDays, startOfWeek } from "date-fns";

interface StreakProtectionData {
  freezesAvailable: number;
  freezesUsedThisWeek: number;
  maxFreezesPerWeek: number;
  lastFreezeDate: string | null;
  streakAtRisk: boolean;
  recoveryMissionsCompleted: number;
  recoveryMissionsNeeded: number;
  canRecover: boolean;
}

interface StreakProtectionActions {
  useFreeze: () => Promise<boolean>;
  checkStreakRisk: () => Promise<boolean>;
  completeRecoveryMission: () => Promise<boolean>;
}

export function useStreakProtection() {
  const [data, setData] = useState<StreakProtectionData>({
    freezesAvailable: 1,
    freezesUsedThisWeek: 0,
    maxFreezesPerWeek: 1,
    lastFreezeDate: null,
    streakAtRisk: false,
    recoveryMissionsCompleted: 0,
    recoveryMissionsNeeded: 3,
    canRecover: false,
  });
  const [loading, setLoading] = useState(true);

  const loadProtectionData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for streak protection data
      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const streakData = (profile?.tutorial_flags as any)?.streak_protection || {};
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();
      
      // Reset weekly freeze if new week
      const freezesUsedThisWeek = streakData.week_start === weekStart 
        ? (streakData.freezes_used_this_week || 0) 
        : 0;

      // Check if streak is at risk (yesterday was missed)
      const yesterday = startOfDay(subDays(new Date(), 1));
      
      const { data: yesterdayDoses } = await supabase
        .from("dose_instances")
        .select(`*, items!inner(user_id)`)
        .eq("items.user_id", user.id)
        .gte("due_at", yesterday.toISOString())
        .lt("due_at", startOfDay(new Date()).toISOString());

      let streakAtRisk = false;
      if (yesterdayDoses && yesterdayDoses.length > 0) {
        const taken = yesterdayDoses.filter(d => d.status === "taken").length;
        const adherence = taken / yesterdayDoses.length;
        streakAtRisk = adherence < 0.8;
      }

      // Check recovery progress
      const recoveryData = streakData.recovery || {};
      const recoveryMissionsCompleted = recoveryData.missions_completed || 0;

      setData({
        freezesAvailable: 1 - freezesUsedThisWeek,
        freezesUsedThisWeek,
        maxFreezesPerWeek: 1,
        lastFreezeDate: streakData.last_freeze_date || null,
        streakAtRisk,
        recoveryMissionsCompleted,
        recoveryMissionsNeeded: 3,
        canRecover: streakAtRisk && recoveryMissionsCompleted < 3,
      });
    } catch (error) {
      console.error("Error loading streak protection:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProtectionData();
  }, [loadProtectionData]);

  const useFreeze = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || data.freezesAvailable <= 0) return false;

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();
      
      // Update profile with freeze used
      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const currentFlags = (profile?.tutorial_flags as any) || {};
      const updatedFlags = {
        ...currentFlags,
        streak_protection: {
          ...currentFlags.streak_protection,
          week_start: weekStart,
          freezes_used_this_week: (data.freezesUsedThisWeek || 0) + 1,
          last_freeze_date: new Date().toISOString(),
        }
      };

      await supabase
        .from("profiles")
        .update({ tutorial_flags: updatedFlags })
        .eq("user_id", user.id);

      await loadProtectionData();
      return true;
    } catch (error) {
      console.error("Error using freeze:", error);
      return false;
    }
  };

  const checkStreakRisk = async (): Promise<boolean> => {
    await loadProtectionData();
    return data.streakAtRisk;
  };

  const completeRecoveryMission = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const currentFlags = (profile?.tutorial_flags as any) || {};
      const newMissionsCompleted = (data.recoveryMissionsCompleted || 0) + 1;
      
      const updatedFlags = {
        ...currentFlags,
        streak_protection: {
          ...currentFlags.streak_protection,
          recovery: {
            missions_completed: newMissionsCompleted,
            last_mission_date: new Date().toISOString(),
          }
        }
      };

      // If all missions completed, recover the streak
      if (newMissionsCompleted >= data.recoveryMissionsNeeded) {
        updatedFlags.streak_protection.recovery.recovered_at = new Date().toISOString();
        updatedFlags.streak_protection.recovery.missions_completed = 0;
      }

      await supabase
        .from("profiles")
        .update({ tutorial_flags: updatedFlags })
        .eq("user_id", user.id);

      await loadProtectionData();
      return newMissionsCompleted >= data.recoveryMissionsNeeded;
    } catch (error) {
      console.error("Error completing recovery mission:", error);
      return false;
    }
  };

  return {
    ...data,
    loading,
    actions: {
      useFreeze,
      checkStreakRisk,
      completeRecoveryMission,
    } as StreakProtectionActions,
    refresh: loadProtectionData,
  };
}
