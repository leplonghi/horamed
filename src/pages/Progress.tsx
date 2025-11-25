import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";
import StreakAnimation from "@/components/celebrations/StreakAnimation";
import { Trophy, TrendingUp, Calendar, Target, Award, Zap, Sparkles, ArrowRight, FileDown } from "lucide-react";
import { subDays } from "date-fns";
import { motion } from "framer-motion";
import TutorialHint from "@/components/TutorialHint";
import HelpTooltip from "@/components/HelpTooltip";

export default function Progress() {
  const { user } = useAuth();
  const { getProfileCache } = useProfileCacheContext();
  const currentProfile = getProfileCache("current");
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");

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
      const onTime = doses?.filter((d) => d.status === "taken" && (d.delay_minutes || 0) <= 15).length || 0;

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
    { days: 3, badge: "🌱 Iniciante", reward: "Primeiro passo dado!" },
    { days: 7, badge: "⭐ Consistente", reward: "Uma semana perfeita" },
    { days: 14, badge: "🔥 Em Chamas", reward: "Duas semanas seguidas" },
    { days: 30, badge: "💎 Lendário", reward: "Um mês de dedicação" },
    { days: 100, badge: "🏆 Mestre", reward: "Você é inspirador!" },
  ];

  const currentMilestone = STREAK_MILESTONES.filter(
    (m) => (streakData?.current_streak || 0) >= m.days
  ).pop();

  const nextMilestone = STREAK_MILESTONES.find(
    (m) => (streakData?.current_streak || 0) < m.days
  );

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto p-6 space-y-6">
        <PageHeader
          title="Seu Progresso"
          description="Acompanhe seu compromisso e conquistas"
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
        />

        {/* Tutorial Hint */}
        <TutorialHint
          id="progress_page"
          title="Acompanhe sua evolução 📈"
          message="Aqui você vê sua sequência de dias, taxa de compromisso, e conquistas. Cada dia tomando suas doses aumenta seu streak. Acima de 80% de compromisso é excelente! Ganhe XP e desbloqueie medalhas."
        />

        {/* Conquistas Card - Promocional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card 
            className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-background border-2 border-purple-500/20 cursor-pointer group hover:border-purple-500/40 transition-all"
            onClick={() => navigate("/conquistas")}
          >
            {/* Sparkle decorations */}
            <motion.div
              className="absolute top-4 right-4"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </motion.div>

            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Conquistas & XP</CardTitle>
                    <CardDescription>
                      Veja todos os seus badges e progresso
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {/* This will be populated from the achievements hook */}
                    ?
                  </p>
                  <p className="text-xs text-muted-foreground">Desbloqueadas</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    ?
                  </p>
                  <p className="text-xs text-muted-foreground">Nível</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    ?
                  </p>
                  <p className="text-xs text-muted-foreground">XP Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Card - Destaque */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Sequência Atual
                </CardTitle>
                {currentMilestone && (
                  <span className="text-2xl">{currentMilestone.badge.split(" ")[0]}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <StreakAnimation streak={streakData?.current_streak || 0} />
              </div>
              {currentMilestone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-1 p-4 bg-primary/10 rounded-lg"
                >
                  <p className="font-semibold text-primary">{currentMilestone.badge}</p>
                  <p className="text-sm text-muted-foreground">{currentMilestone.reward}</p>
                </motion.div>
              )}
              {nextMilestone && (
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Faltam apenas <span className="font-bold text-foreground">{nextMilestone.days - (streakData?.current_streak || 0)} dias</span> para{" "}
                    <span className="font-semibold">{nextMilestone.badge}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="week" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                7 dias
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                30 dias
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{doseStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">doses programadas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Zap className="h-4 w-4" />
                  Tomadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">{doseStats?.taken || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">doses completadas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Trophy className="h-4 w-4" />
                  Compromisso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{doseStats?.adherence || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">taxa de sucesso</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                  No Horário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{doseStats?.onTimeRate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">pontualidade</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Export Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card 
            className="border-muted hover:border-primary/30 transition-all cursor-pointer group hover:shadow-lg"
            onClick={() => navigate('/exportar')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                    <FileDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Exportar Dados</CardTitle>
                    <CardDescription className="text-xs">
                      Baixe relatório completo em PDF
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      </main>

      <Navigation />
    </div>
  );
}
