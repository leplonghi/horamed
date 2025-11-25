import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, subDays } from "date-fns";

interface XPData {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
}

export function useXPSystem() {
  const [xpData, setXPData] = useState<XPData>({
    currentXP: 0,
    level: 1,
    xpToNextLevel: 100,
    totalXP: 0,
    weeklyXP: 0,
    monthlyXP: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateXP();
  }, []);

  const calculateXP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all taken doses
      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .eq("status", "taken");

      if (!doses) {
        setLoading(false);
        return;
      }

      // Calculate XP
      let totalXP = 0;
      let weeklyXP = 0;
      let monthlyXP = 0;

      const weekStart = startOfWeek(new Date());
      const monthStart = startOfMonth(new Date());

      doses.forEach((dose) => {
        const doseDate = new Date(dose.taken_at || dose.due_at);
        let xpEarned = 10; // Base XP for taking medication

        // Bonus for on-time doses (within 30 minutes of scheduled time)
        if (dose.delay_minutes !== null && dose.delay_minutes <= 30) {
          xpEarned += 5;
        }

        totalXP += xpEarned;

        if (doseDate >= weekStart) {
          weeklyXP += xpEarned;
        }

        if (doseDate >= monthStart) {
          monthlyXP += xpEarned;
        }
      });

      // Calculate perfect days bonus (all doses taken in a day)
      const dayMap = new Map<string, { total: number; taken: number }>();
      const { data: allDoses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", subDays(new Date(), 30).toISOString());

      if (allDoses) {
        allDoses.forEach((dose) => {
          const day = new Date(dose.due_at).toDateString();
          const current = dayMap.get(day) || { total: 0, taken: 0 };
          current.total++;
          if (dose.status === "taken") current.taken++;
          dayMap.set(day, current);
        });

        // Add bonus XP for perfect days
        dayMap.forEach(({ total, taken }) => {
          if (total === taken && total > 0) {
            totalXP += 50;
            const day = new Date();
            if (day >= weekStart) weeklyXP += 50;
            if (day >= monthStart) monthlyXP += 50;
          }
        });
      }

      // Calculate level (100 XP per level, exponentially increasing)
      let level = 1;
      let xpNeeded = 100;
      let xpUsed = 0;

      while (totalXP >= xpUsed + xpNeeded) {
        xpUsed += xpNeeded;
        level++;
        xpNeeded = Math.floor(100 * Math.pow(1.1, level - 1)); // 10% increase per level
      }

      const currentXP = totalXP - xpUsed;
      const xpToNextLevel = xpNeeded;

      setXPData({
        currentXP,
        level,
        xpToNextLevel,
        totalXP,
        weeklyXP,
        monthlyXP,
      });
    } catch (error) {
      console.error("Error calculating XP:", error);
    } finally {
      setLoading(false);
    }
  };

  return { ...xpData, loading, refresh: calculateXP };
}
