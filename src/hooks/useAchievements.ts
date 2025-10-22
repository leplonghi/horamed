import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay } from "date-fns";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: "bronze" | "silver" | "gold" | "diamond";
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    calculateAchievements();
  }, []);

  const calculateAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all doses
      const { data: allDoses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id);

      if (!allDoses) return;

      const takenDoses = allDoses.filter((d) => d.status === "taken");
      const totalDoses = allDoses.length;

      // Calculate streak for achievements
      const last30Days = startOfDay(subDays(new Date(), 30));
      const recentDoses = allDoses.filter(
        (d) => new Date(d.due_at) >= last30Days
      );

      const dayMap = new Map<string, { total: number; taken: number }>();
      recentDoses.forEach((dose) => {
        const day = startOfDay(new Date(dose.due_at)).toISOString();
        const current = dayMap.get(day) || { total: 0, taken: 0 };
        current.total++;
        if (dose.status === "taken") current.taken++;
        dayMap.set(day, current);
      });

      let currentStreak = 0;
      let checkDate = startOfDay(new Date());
      while (currentStreak < 30) {
        const dayKey = checkDate.toISOString();
        const dayData = dayMap.get(dayKey);
        if (!dayData || dayData.taken / dayData.total < 0.8) break;
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      // Calculate adherence rate
      const adherenceRate = totalDoses > 0 ? (takenDoses.length / totalDoses) * 100 : 0;

      // Get active medications count
      const { data: medications } = await supabase
        .from("items")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const medsCount = medications?.length || 0;

      // Define achievements
      const achievementsList: Achievement[] = [
        {
          id: "first_dose",
          title: "Primeira Dose",
          description: "Registre sua primeira dose",
          icon: "🌟",
          level: "bronze",
          unlocked: takenDoses.length >= 1,
        },
        {
          id: "week_streak",
          title: "Semana Perfeita",
          description: "Complete 7 dias seguidos",
          icon: "🔥",
          level: "bronze",
          unlocked: currentStreak >= 7,
          progress: Math.min(currentStreak, 7),
          maxProgress: 7,
        },
        {
          id: "month_streak",
          title: "Mês Dedicado",
          description: "Complete 30 dias seguidos",
          icon: "💪",
          level: "silver",
          unlocked: currentStreak >= 30,
          progress: Math.min(currentStreak, 30),
          maxProgress: 30,
        },
        {
          id: "hundred_doses",
          title: "Centena de Ouro",
          description: "Tome 100 doses",
          icon: "🎯",
          level: "gold",
          unlocked: takenDoses.length >= 100,
          progress: Math.min(takenDoses.length, 100),
          maxProgress: 100,
        },
        {
          id: "perfect_adherence",
          title: "Perfeição Total",
          description: "Atinja 95% de adesão",
          icon: "💎",
          level: "diamond",
          unlocked: adherenceRate >= 95,
          progress: Math.min(Math.round(adherenceRate), 95),
          maxProgress: 95,
        },
        {
          id: "organized",
          title: "Super Organizado",
          description: "Cadastre 5 medicamentos",
          icon: "📋",
          level: "silver",
          unlocked: medsCount >= 5,
          progress: Math.min(medsCount, 5),
          maxProgress: 5,
        },
        {
          id: "five_hundred_doses",
          title: "Veterano da Saúde",
          description: "Tome 500 doses",
          icon: "🏆",
          level: "diamond",
          unlocked: takenDoses.length >= 500,
          progress: Math.min(takenDoses.length, 500),
          maxProgress: 500,
        },
      ];

      const unlockedAchievements = achievementsList.filter((a) => a.unlocked).length;

      setAchievements(achievementsList);
      setUnlockedCount(unlockedAchievements);
    } catch (error) {
      console.error("Error calculating achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  return { achievements, loading, unlockedCount, refresh: calculateAchievements };
}
