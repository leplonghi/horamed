import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, differenceInDays } from "date-fns";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isImproving: boolean;
  lastWeekAverage: number;
  thisWeekAverage: number;
}

export function useStreakCalculator() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    isImproving: false,
    lastWeekAverage: 0,
    thisWeekAverage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStreaks();
  }, []);

  const calculateStreaks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all doses for the last 90 days
      const startDate = startOfDay(subDays(new Date(), 90));
      
      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", startDate.toISOString())
        .order("due_at", { ascending: true });

      if (!doses || doses.length === 0) {
        setLoading(false);
        return;
      }

      // Group doses by day and calculate adherence
      const dayMap = new Map<string, { total: number; taken: number }>();
      
      doses.forEach((dose) => {
        const day = startOfDay(new Date(dose.due_at)).toISOString();
        const current = dayMap.get(day) || { total: 0, taken: 0 };
        current.total++;
        if (dose.status === "taken") current.taken++;
        dayMap.set(day, current);
      });

      // Calculate current streak (working backwards from today)
      let currentStreak = 0;
      let checkDate = startOfDay(new Date());
      
      while (true) {
        const dayKey = checkDate.toISOString();
        const dayData = dayMap.get(dayKey);
        
        if (!dayData) break;
        
        const adherence = dayData.taken / dayData.total;
        if (adherence >= 0.8) { // 80% adherence counts as a streak day
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDays = Array.from(dayMap.entries()).sort();
      
      sortedDays.forEach(([, data]) => {
        const adherence = data.taken / data.total;
        if (adherence >= 0.8) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });

      // Calculate last week vs this week average
      const thisWeekStart = startOfDay(subDays(new Date(), 6));
      const lastWeekStart = startOfDay(subDays(new Date(), 13));
      const lastWeekEnd = startOfDay(subDays(new Date(), 7));

      let thisWeekTaken = 0, thisWeekTotal = 0;
      let lastWeekTaken = 0, lastWeekTotal = 0;

      doses.forEach((dose) => {
        const doseDate = new Date(dose.due_at);
        
        if (doseDate >= thisWeekStart) {
          thisWeekTotal++;
          if (dose.status === "taken") thisWeekTaken++;
        } else if (doseDate >= lastWeekStart && doseDate < lastWeekEnd) {
          lastWeekTotal++;
          if (dose.status === "taken") lastWeekTaken++;
        }
      });

      const thisWeekAverage = thisWeekTotal > 0 ? (thisWeekTaken / thisWeekTotal) * 100 : 0;
      const lastWeekAverage = lastWeekTotal > 0 ? (lastWeekTaken / lastWeekTotal) * 100 : 0;

      setStreakData({
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        isImproving: thisWeekAverage > lastWeekAverage,
        lastWeekAverage: Math.round(lastWeekAverage),
        thisWeekAverage: Math.round(thisWeekAverage),
      });
    } catch (error) {
      console.error("Error calculating streaks:", error);
    } finally {
      setLoading(false);
    }
  };

  return { ...streakData, loading, refresh: calculateStreaks };
}
