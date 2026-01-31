import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DockNavigation from "@/components/ui/dock-navigation";
import ModernHeader from "@/components/ui/modern-header";
import {
  BentoGrid,
  BentoCard,
  BentoHeader,
  BentoValue,
  BentoProgress,
} from "@/components/ui/bento-grid";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";
import {
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Zap,
  Sparkles,
  ChevronRight,
  Flame,
  FileDown,
  Scale,
} from "lucide-react";
import { subDays } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import WeightBMICard from "@/components/WeightBMICard";
import StreakAnimation from "@/components/celebrations/StreakAnimation";

export default function ProgressBento() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { getProfileCache } = useProfileCacheContext();
  const currentProfile = getProfileCache("current");
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">(
    "week"
  );

  // Get streak data
  const { data: streakData } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_adherence_streaks")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get doses statistics
  const { data: doseStats } = useQuery({
    queryKey: ["dose-stats", user?.id, currentProfile?.id, selectedPeriod],
    queryFn: async () => {
      const now = new Date();
      const startDate =
        selectedPeriod === "week"
          ? subDays(now, 7)
          : selectedPeriod === "month"
          ? subDays(now, 30)
          : subDays(now, 365);

      const { data: doses, error } = await supabase
        .from("dose_instances")
        .select("*, items!inner(*)")
        .eq("items.user_id", user?.id)
        .gte("due_at", startDate.toISOString())
        .lte("due_at", now.toISOString());

      if (error) throw error;

      const total = doses?.length || 0;
      const taken = doses?.filter((d) => d.status === "taken").length || 0;
      const skipped = doses?.filter((d) => d.status === "skipped").length || 0;
      const onTime =
        doses?.filter(
          (d) => d.status === "taken" && (d.delay_minutes || 0) <= 15
        ).length || 0;

      return {
        total,
        taken,
        skipped,
        onTime,
        adherence: total > 0 ? Math.round((taken / total) * 100) : 0,
        onTimeRate: taken > 0 ? Math.round((onTime / taken) * 100) : 0,
      };
    },
    enabled: !!user?.id,
  });

  // Milestones
  const STREAK_MILESTONES = [
    { days: 3, badge: "🌱", title: language === "pt" ? "Iniciante" : "Beginner" },
    { days: 7, badge: "⭐", title: language === "pt" ? "Consistente" : "Consistent" },
    { days: 14, badge: "🔥", title: language === "pt" ? "Em chamas!" : "On fire!" },
    { days: 30, badge: "💎", title: language === "pt" ? "Lendário" : "Legendary" },
    { days: 100, badge: "🏆", title: language === "pt" ? "Mestre" : "Master" },
  ];

  const currentMilestone = STREAK_MILESTONES.filter(
    (m) => (streakData?.current_streak || 0) >= m.days
  ).pop();

  const nextMilestone = STREAK_MILESTONES.find(
    (m) => (streakData?.current_streak || 0) < m.days
  );

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />

      <main className="pt-20 pb-24 px-4 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {language === "pt" ? "Seu Progresso" : "Your Progress"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "pt"
                ? "Acompanhe sua evolução"
                : "Track your evolution"}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </motion.div>

        {/* Period Selector */}
        <Tabs
          value={selectedPeriod}
          onValueChange={(v) => setSelectedPeriod(v as any)}
        >
          <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 rounded-2xl bg-muted/50">
            <TabsTrigger value="week" className="rounded-xl py-2.5">
              <Calendar className="h-4 w-4 mr-2" />
              {language === "pt" ? "7 dias" : "7 days"}
            </TabsTrigger>
            <TabsTrigger value="month" className="rounded-xl py-2.5">
              <Calendar className="h-4 w-4 mr-2" />
              {language === "pt" ? "30 dias" : "30 days"}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl py-2.5">
              <Calendar className="h-4 w-4 mr-2" />
              {language === "pt" ? "Tudo" : "All"}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bento Grid Stats */}
        <BentoGrid>
          {/* Streak Card - Large */}
          <BentoCard variant="highlight" size={2} delay={0}>
            <BentoHeader
              icon={<Flame className="h-5 w-5 text-orange-500" />}
              title={language === "pt" ? "Sequência" : "Streak"}
              subtitle={
                currentMilestone
                  ? `${currentMilestone.badge} ${currentMilestone.title}`
                  : undefined
              }
            />
            <div className="flex items-center justify-center py-4">
              <StreakAnimation streak={streakData?.current_streak || 0} />
            </div>
            {nextMilestone && (
              <p className="text-xs text-muted-foreground text-center">
                {nextMilestone.days - (streakData?.current_streak || 0)}{" "}
                {language === "pt" ? "dias para" : "days to"}{" "}
                {nextMilestone.badge}
              </p>
            )}
          </BentoCard>

          {/* Adherence Rate */}
          <BentoCard variant="gradient" size={1} delay={1}>
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-success/20">
                  <Target className="h-4 w-4 text-success" />
                </div>
              </div>
              <div className="mt-auto">
                <span className="text-4xl font-bold text-foreground">
                  {doseStats?.adherence || 0}%
                </span>
                <p className="text-xs text-muted-foreground">
                  {language === "pt" ? "Adesão" : "Adherence"}
                </p>
              </div>
            </div>
          </BentoCard>

          {/* On Time Rate */}
          <BentoCard variant="default" size={1} delay={2}>
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-warning/20">
                  <Zap className="h-4 w-4 text-warning" />
                </div>
              </div>
              <div className="mt-auto">
                <span className="text-4xl font-bold text-foreground">
                  {doseStats?.onTimeRate || 0}%
                </span>
                <p className="text-xs text-muted-foreground">
                  {language === "pt" ? "No horário" : "On time"}
                </p>
              </div>
            </div>
          </BentoCard>

          {/* Total Doses */}
          <BentoCard variant="glass" size={2} delay={3}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {doseStats?.total || 0}
                </span>
                <p className="text-xs text-muted-foreground">
                  {language === "pt" ? "Total" : "Total"}
                </p>
              </div>
              <div>
                <span className="text-2xl font-bold text-success">
                  {doseStats?.taken || 0}
                </span>
                <p className="text-xs text-muted-foreground">
                  {language === "pt" ? "Tomadas" : "Taken"}
                </p>
              </div>
              <div>
                <span className="text-2xl font-bold text-muted-foreground">
                  {doseStats?.skipped || 0}
                </span>
                <p className="text-xs text-muted-foreground">
                  {language === "pt" ? "Puladas" : "Skipped"}
                </p>
              </div>
            </div>
            <BentoProgress
              value={doseStats?.taken || 0}
              max={doseStats?.total || 1}
              variant="gradient"
              className="mt-4"
            />
          </BentoCard>

          {/* Achievements */}
          <BentoCard
            variant="gradient"
            size={2}
            delay={4}
            onClick={() => navigate("/conquistas")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                >
                  <Trophy className="h-6 w-6 text-purple-500" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {language === "pt" ? "Conquistas & XP" : "Achievements & XP"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "pt"
                      ? "Veja suas medalhas"
                      : "See your badges"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </BentoCard>

          {/* Export Data */}
          <BentoCard
            variant="outline"
            size={2}
            delay={5}
            onClick={() => navigate("/exportar")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-muted">
                  <FileDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {language === "pt" ? "Exportar dados" : "Export data"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "pt" ? "Baixar relatório PDF" : "Download PDF report"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </BentoCard>
        </BentoGrid>

        {/* Weight Card */}
        {user?.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <WeightBMICard userId={user.id} profileId={currentProfile?.id} />
          </motion.div>
        )}
      </main>

      <DockNavigation />
    </div>
  );
}
