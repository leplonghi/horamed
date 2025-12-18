import { useState, useEffect } from "react";
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
import WeightBMICard from "@/components/WeightBMICard";
import WeightInsightsCard from "@/components/WeightInsightsCard";
import FitnessProgressWidgets from "@/components/fitness/FitnessProgressWidgets";
import { useFitnessPreferences } from "@/hooks/useFitnessPreferences";
import { microcopy } from "@/lib/microcopy";

export default function Progress() {
  const { user } = useAuth();
  const { getProfileCache } = useProfileCacheContext();
  const currentProfile = getProfileCache("current");
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");
  const [hasSupplements, setHasSupplements] = useState(false);
  const { preferences } = useFitnessPreferences();

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

  // Check if user has supplements
  const { data: supplementsData } = useQuery({
    queryKey: ["supplements-check", user?.id, currentProfile?.id],
    queryFn: async () => {
      if (!user?.id) return { hasSupplements: false };

      let query = supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .in("category", ["suplemento", "vitamina"])
        .eq("is_active", true)
        .eq("user_id", user.id);

      if (currentProfile?.id) {
        query = query.eq("profile_id", currentProfile.id);
      }

      const { count } = await query;
      return { hasSupplements: (count || 0) > 0 };
    },
    enabled: !!user?.id,
  });

  // Update hasSupplements state
  useEffect(() => {
    if (supplementsData) {
      setHasSupplements(supplementsData.hasSupplements);
    }
  }, [supplementsData]);

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
    <div className="min-h-screen flex flex-col pb-20 bg-gradient-subtle">
      <Header />

      <main className="flex-1 container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Seu Progresso"
            description="Acompanhe seu compromisso e conquistas"
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
          />
          <HelpTooltip 
            content="Aqui você acompanha sua evolução. Veja quantas doses tomou, sua sequência de dias seguidos e suas conquistas." 
            iconSize="lg"
          />
        </div>

        {/* Explicação didática */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Como funciona?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cada dose tomada conta para sua <strong>sequência de dias</strong> e aumenta seu <strong>XP</strong>. 
                Quanto mais consistente você for, mais conquistas vai desbloquear!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tutorial Hint */}
        <TutorialHint
          id={microcopy.tutorials.progress.id}
          title={microcopy.tutorials.progress.title}
          message={microcopy.tutorials.progress.message}
        />

        {/* Weight & BMI Card */}
        {user?.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-4"
          >
            <WeightBMICard 
              userId={user.id}
              profileId={currentProfile?.id}
            />
            {/* Weight Insights - GLP-1/Bariatric correlation */}
            <WeightInsightsCard profileId={currentProfile?.id} />
          </motion.div>
        )}

        {/* Conquistas Card - Promocional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div 
            className="relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm p-6 cursor-pointer group hover-lift"
            style={{ 
              boxShadow: 'var(--shadow-md)',
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--accent) / 0.1))'
            }}
            onClick={() => navigate("/conquistas")}
          >
            {/* Sparkle decoration */}
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

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(270 60% 60%), hsl(330 60% 60%))' }}>
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Conquistas & XP</h3>
                  <p className="text-sm text-muted-foreground">
                    Veja todos os seus badges e progresso
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center flex-1 p-3 rounded-xl bg-background/50">
                <p className="text-2xl font-bold" style={{ color: 'hsl(270 60% 60%)' }}>?</p>
                <p className="text-xs text-muted-foreground">Desbloqueadas</p>
              </div>
              <div className="text-center flex-1 p-3 rounded-xl bg-background/50">
                <p className="text-2xl font-bold" style={{ color: 'hsl(330 60% 60%)' }}>?</p>
                <p className="text-xs text-muted-foreground">Nível</p>
              </div>
              <div className="text-center flex-1 p-3 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-yellow-500">?</p>
                <p className="text-xs text-muted-foreground">XP Total</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div 
            className="overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm p-6"
            style={{ 
              boxShadow: 'var(--shadow-lg)',
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Award className="h-5 w-5 text-primary" />
                Sequência Atual
              </h3>
              {currentMilestone && (
                <span className="text-2xl">{currentMilestone.badge.split(" ")[0]}</span>
              )}
            </div>
            
            <div className="flex items-center justify-center py-4">
              <StreakAnimation streak={streakData?.current_streak || 0} />
            </div>
            
            {currentMilestone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 rounded-xl mt-4"
                style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
              >
                <p className="font-semibold text-primary">{currentMilestone.badge}</p>
                <p className="text-sm text-muted-foreground">{currentMilestone.reward}</p>
              </motion.div>
            )}
            
            {nextMilestone && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>
                  Faltam apenas <span className="font-bold text-foreground">{nextMilestone.days - (streakData?.current_streak || 0)} dias</span> para{" "}
                  <span className="font-semibold">{nextMilestone.badge}</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 rounded-2xl bg-muted/50">
              <TabsTrigger value="week" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Calendar className="h-4 w-4 mr-2" />
                7 dias
              </TabsTrigger>
              <TabsTrigger value="month" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Calendar className="h-4 w-4 mr-2" />
                30 dias
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Calendar className="h-4 w-4 mr-2" />
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 hover-lift"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className="text-3xl font-bold">{doseStats?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">doses programadas</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-4 hover-lift"
            style={{ 
              boxShadow: 'var(--shadow-sm)',
              backgroundColor: 'hsl(var(--success) / 0.1)'
            }}
          >
            <div className="flex items-center gap-2 mb-2 text-success">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Tomadas</span>
            </div>
            <p className="text-3xl font-bold text-success">{doseStats?.taken || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">doses completadas</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 hover-lift"
            style={{ 
              boxShadow: 'var(--shadow-sm)',
              backgroundColor: 'hsl(var(--primary) / 0.1)'
            }}
          >
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Compromisso</span>
              <HelpTooltip content={microcopy.help.progress.adherence} />
            </div>
            <p className="text-3xl font-bold text-primary">{doseStats?.adherence || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">taxa de sucesso</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl p-4 hover-lift"
            style={{ 
              boxShadow: 'var(--shadow-sm)',
              backgroundColor: 'hsl(var(--warning) / 0.1)'
            }}
          >
            <div className="flex items-center gap-2 mb-2 text-warning">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">No Horário</span>
              <HelpTooltip content={microcopy.help.progress.onTime} />
            </div>
            <p className="text-3xl font-bold text-warning">{doseStats?.onTimeRate || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">pontualidade</p>
          </motion.div>
        </div>

        {/* Export Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div 
            className="rounded-2xl bg-card/80 backdrop-blur-sm p-5 cursor-pointer group hover-lift"
            style={{ boxShadow: 'var(--shadow-sm)' }}
            onClick={() => navigate('/exportar')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                  <FileDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h4 className="font-medium">Exportar Dados</h4>
                  <p className="text-xs text-muted-foreground">
                    Baixe relatório completo em PDF
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </motion.div>

        {/* Fitness Progress Widgets */}
        {(hasSupplements || preferences.showFitnessWidgets) && user?.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <FitnessProgressWidgets 
              supplementAdherence7Days={doseStats?.adherence || 0}
              consistencyRate={doseStats?.onTimeRate || 0}
              hasPreWorkoutSupplements={hasSupplements}
            />
          </motion.div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
