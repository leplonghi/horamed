import { useState, useEffect, useMemo } from "react";
import HealthInsights from "@/components/HealthInsights";
import ProfileSelector from "@/components/ProfileSelector";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Pill, TrendingUp, Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInYears, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import AdBanner from "@/components/AdBanner";
import AdherenceChart from "@/components/AdherenceChart";
import Header from "@/components/Header";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import StreakBadge from "@/components/StreakBadge";
import AchievementsSection from "@/components/AchievementsSection";
import ProgressDashboard from "@/components/ProgressDashboard";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import HealthAssistantChat from "@/components/HealthAssistantChat";
import MonthlyReportCard from "@/components/MonthlyReportCard";
import SmartInsightsCard from "@/components/SmartInsightsCard";
import HealthHistoryLinks from "@/components/HealthHistoryLinks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageSkeleton } from "@/components/LoadingSkeleton";

interface DoseInstance {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  items: {
    name: string;
    dose_text: string | null;
    with_food: boolean;
  };
}

interface LowStock {
  id: string;
  name: string;
  units_left: number;
  unit_label: string;
  projected_days_left: number;
}

interface UserProfile {
  full_name: string | null;
  nickname: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
}

export default function Today() {
  const { stopAlarm, scheduleNotificationsForNextDay } = useMedicationAlarm();
  usePushNotifications();
  const streakData = useStreakCalculator();
  const criticalAlerts = useCriticalAlerts();
  
  const [upcomingDoses, setUpcomingDoses] = useState<DoseInstance[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weeklyAdherence, setWeeklyAdherence] = useState<{ day: string; taken: number; total: number }[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    completed: 0,
    pending: 0,
    lowStock: 0,
    weeklyAdherence: 0,
  });
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [showHealthStats, setShowHealthStats] = useState(false);

  useMedicationAlarm();

  // Schedule notifications for next 24 hours on app open
  useEffect(() => {
    const scheduleNotifications = async () => {
      try {
        await scheduleNotificationsForNextDay();
        console.log('Notifications scheduled for next 24 hours');
      } catch (error) {
        console.error('Error scheduling notifications:', error);
      }
    };

    scheduleNotifications();
  }, [scheduleNotificationsForNextDay]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bom dia");
    else if (hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    fetchTodayData();
    fetchProfile();
    loadStats();
    loadWeeklyAdherence();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, nickname, birth_date, weight_kg, height_cm")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchTodayData = async () => {
    try {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch upcoming doses for today
      const { data: doses, error: dosesError } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items (name, dose_text, with_food)
        `)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .lte("due_at", endOfDay.toISOString())
        .order("due_at", { ascending: true })
        .limit(5);

      if (dosesError) throw dosesError;
      setUpcomingDoses(doses || []);

      // Fetch low stock items
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select(`
          id,
          name,
          stock (units_left, unit_label, projected_end_at)
        `)
        .eq("is_active", true);

      if (itemsError) throw itemsError;

      const lowStock = items
        ?.filter((item: any) => {
          if (!item.stock?.[0]) return false;
          const stock = item.stock[0];
          if (!stock.projected_end_at) return false;
          const daysLeft = Math.ceil(
            (new Date(stock.projected_end_at).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return daysLeft <= 7 && daysLeft > 0;
        })
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          units_left: item.stock[0].units_left,
          unit_label: item.stock[0].unit_label,
          projected_days_left: Math.ceil(
            (new Date(item.stock[0].projected_end_at).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }))
        .sort((a: LowStock, b: LowStock) => a.projected_days_left - b.projected_days_left);

      setLowStockItems(lowStock || []);
    } catch (error) {
      console.error("Error fetching today data:", error);
      toast.error("Erro ao carregar dados de hoje");
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyAdherence = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);

        const { data: doses } = await supabase
          .from("dose_instances")
          .select(`
            *,
            items!inner(user_id)
          `)
          .eq("items.user_id", user.id)
          .gte("due_at", day.toISOString())
          .lt("due_at", nextDay.toISOString());

        const total = doses?.length || 0;
        const taken = doses?.filter((d) => d.status === "taken").length || 0;

        weekData.push({
          day: format(day, "EEE", { locale: ptBR }),
          taken,
          total,
        });
      }

      setWeeklyAdherence(weekData);
    } catch (error) {
      console.error("Error loading weekly adherence:", error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayDoses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", today.toISOString())
        .lt("due_at", tomorrow.toISOString());

      const completed = todayDoses?.filter((d) => d.status === "taken").length || 0;
      const pending = todayDoses?.filter((d) => d.status === "scheduled").length || 0;

      // Calculate weekly adherence
      const last7Days = subDays(new Date(), 7);
      const { data: weekDoses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", last7Days.toISOString());

      const weekTotal = weekDoses?.length || 0;
      const weekTaken = weekDoses?.filter((d) => d.status === "taken").length || 0;
      const weeklyAdherence = weekTotal > 0 ? Math.round((weekTaken / weekTotal) * 100) : 0;

      const { data: stockData } = await supabase
        .from("stock")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id);

      const lowStock = stockData?.filter((s) => s.units_left < s.units_total * 0.2).length || 0;

      setStats({
        totalToday: todayDoses?.length || 0,
        completed,
        pending,
        lowStock,
        weeklyAdherence,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const markAsTaken = async (doseId: string, itemId: string) => {
    try {
      // Check if item has stock
      const { data: stockData } = await supabase
        .from("stock")
        .select("units_left")
        .eq("item_id", itemId)
        .single();

      if (stockData && stockData.units_left === 0) {
        toast.error("❌ Estoque zerado! Reabasteça antes de registrar dose.");
        return;
      }

      // Check for recent duplicate (within 4 hours)
      const fourHoursAgo = new Date();
      fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

      const { data: recentDoses } = await supabase
        .from("dose_instances")
        .select("taken_at")
        .eq("item_id", itemId)
        .eq("status", "taken")
        .gte("taken_at", fourHoursAgo.toISOString());

      if (recentDoses && recentDoses.length > 0) {
        const confirmed = window.confirm(
          "Você já registrou essa medicação nas últimas 4 horas. Tem certeza que deseja registrar novamente?"
        );
        if (!confirmed) return;
      }

      const takenAt = new Date();
      const { error } = await supabase
        .from("dose_instances")
        .update({
          status: "taken",
          taken_at: takenAt.toISOString(),
        })
        .eq("id", doseId);

      if (error) throw error;

      // Decrement stock
      if (stockData && stockData.units_left > 0) {
        await supabase
          .from("stock")
          .update({ units_left: stockData.units_left - 1 })
          .eq("item_id", itemId);
      }

      showMotivationalMessage();
      fetchTodayData();
      streakData.refresh();
      criticalAlerts.refresh();
    } catch (error) {
      console.error("Error marking dose as taken:", error);
      toast.error("Erro ao confirmar dose");
    }
  };

  const showMotivationalMessage = () => {
    const messages = [
      "✓ Dose confirmada! Você está no controle!",
      "✓ Ótimo trabalho! Continue assim!",
      "✓ Parabéns! Sua saúde agradece!",
      "✓ Excelente! Mais um passo rumo à sua meta!",
      "✓ Mandou bem! Sua dedicação faz a diferença!",
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    toast.success(randomMessage, {
      duration: 2500,
    });
  };

  const snoozeDose = async (doseId: string, minutes: number) => {
    try {
      const { data: dose } = await supabase
        .from("dose_instances")
        .select("due_at")
        .eq("id", doseId)
        .single();

      if (dose) {
        const newTime = new Date(dose.due_at);
        newTime.setMinutes(newTime.getMinutes() + minutes);

        await supabase
          .from("dose_instances")
          .update({
            due_at: newTime.toISOString(),
            status: "snoozed",
          })
          .eq("id", doseId);

        toast.success(`Lembrete adiado por ${minutes} minutos`);
        fetchTodayData();
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error("Erro ao adiar lembrete");
    }
  };

  const skipDose = async (doseId: string) => {
    try {
      await supabase
        .from("dose_instances")
        .update({ status: "skipped" })
        .eq("id", doseId);

      toast("Dose pulada");
      fetchTodayData();
    } catch (error) {
      console.error("Error skipping dose:", error);
      toast.error("Erro ao pular dose");
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20 p-4 sm:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <AdBanner />

          {/* Header with greeting - Enhanced */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {greeting}{profile?.nickname ? `, ${profile.nickname}` : ""}!
                </h2>
                <p className="text-base text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!streakData.loading && streakData.currentStreak > 0 && (
                  <StreakBadge streak={streakData.currentStreak} type="current" />
                )}
              </div>
            </div>
            <ProfileSelector />
          </div>

          {/* Critical Alerts Section */}
          <CriticalAlertBanner 
            alerts={criticalAlerts.alerts} 
            onDismiss={criticalAlerts.dismissAlert}
          />

          {/* Next 3 Doses - Enhanced View */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Próximas Doses</h2>
                <p className="text-xs text-muted-foreground">
                  {upcomingDoses.length === 0 ? 'Nenhuma dose agendada' : `${upcomingDoses.length} dose(s) hoje`}
                </p>
              </div>
            </div>

            {upcomingDoses.length === 0 ? (
              <Card className="relative overflow-hidden p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed animate-fade-in">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="relative space-y-2">
                  <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                    <Pill className="h-10 w-10 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">
                    Tudo em dia por agora
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma dose programada para este momento
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingDoses.slice(0, 3).map((dose, index) => {
                  const hasZeroStock = criticalAlerts.alerts.some(
                    alert => alert.type === "zero_stock" && alert.itemId === dose.item_id
                  );

                  return (
                    <Card
                      key={dose.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className="relative overflow-hidden p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] animate-scale-in border-l-4 border-l-primary bg-gradient-to-r from-background to-muted/20"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                      <div className="relative space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-2 flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-foreground">
                              {dose.items.name}
                            </h3>
                            {dose.items.dose_text && (
                              <p className="text-sm text-muted-foreground">
                                💊 {dose.items.dose_text}
                              </p>
                            )}
                            {dose.items.with_food && (
                              <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                                🍽️ Tomar com alimento
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:text-right">
                            <Clock className="h-5 w-5 text-primary sm:hidden" />
                            <div>
                              <p className="text-3xl sm:text-4xl font-bold text-primary">
                                {format(parseISO(dose.due_at), "HH:mm")}
                              </p>
                              <p className="text-xs text-muted-foreground hidden sm:block">
                                horário
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => markAsTaken(dose.id, dose.item_id)}
                            disabled={hasZeroStock}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all hover:scale-105 min-w-[140px]"
                          >
                            ✓ Tomei Agora
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => snoozeDose(dose.id, 15)}
                            className="border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all"
                          >
                            ⏰ +15 min
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => skipDose(dose.id)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                          >
                            Pular
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Low Stock Alerts - Enhanced */}
          {lowStockItems.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 animate-pulse">
                  <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    Estoque Baixo
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {lowStockItems.length} {lowStockItems.length === 1 ? 'medicamento precisa' : 'medicamentos precisam'} de reposição
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {lowStockItems.slice(0, 3).map((item, index) => (
                  <Card
                    key={item.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="p-4 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-500/5 to-background hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-scale-in"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.units_left} {item.unit_label} restantes
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {item.projected_days_left}
                        </p>
                        <p className="text-xs text-muted-foreground">dias</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Weekly Summary - Enhanced */}
          <Collapsible open={showWeeklySummary} onOpenChange={setShowWeeklySummary}>
            <Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
              <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-foreground">
                      Resumo Semanal
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Seu desempenho nos últimos 7 dias
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-bold">
                    {stats.weeklyAdherence}%
                  </Badge>
                  {showWeeklySummary ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-5 pt-0 space-y-4 animate-fade-in bg-gradient-to-b from-muted/20 to-background">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <p className="text-3xl font-bold text-primary">{stats.weeklyAdherence}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Adesão Semanal</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-muted to-muted/50">
                    <p className="text-3xl font-bold text-foreground">{upcomingDoses.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Doses Hoje</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{lowStockItems.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Acabando</p>
                  </div>
                </div>
                {weeklyAdherence.length > 0 && (
                  <div className="pt-2">
                    <AdherenceChart weeklyData={weeklyAdherence} />
                  </div>
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Smart Insights */}
          <SmartInsightsCard />

          {/* Collapsible Health Stats */}
          {profile && (profile.birth_date || profile.weight_kg || profile.height_cm) && (
            <Collapsible open={showHealthStats} onOpenChange={setShowHealthStats}>
              <Card className="p-4">
                <CollapsibleTrigger className="w-full flex items-center justify-between">
                  <h3 className="text-lg font-semibold">📊 Dados de Saúde</h3>
                  {showHealthStats ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    {profile.birth_date && (
                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <p className="text-2xl">🎂</p>
                        <p className="text-sm font-bold text-foreground">
                          {differenceInYears(new Date(), new Date(profile.birth_date))}
                        </p>
                        <p className="text-xs text-muted-foreground">anos</p>
                      </div>
                    )}
                    {profile.weight_kg && (
                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <p className="text-2xl">⚖️</p>
                        <p className="text-sm font-bold text-foreground">{profile.weight_kg}</p>
                        <p className="text-xs text-muted-foreground">kg</p>
                      </div>
                    )}
                    {profile.height_cm && (
                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <p className="text-2xl">📏</p>
                        <p className="text-sm font-bold text-foreground">
                          {(profile.height_cm / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">m</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Progress Dashboard - Compact */}
          {!streakData.loading && streakData.currentStreak >= 3 && (
            <ProgressDashboard
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              thisWeekAverage={streakData.thisWeekAverage}
              lastWeekAverage={streakData.lastWeekAverage}
              monthlyGoal={90}
              monthlyProgress={stats.weeklyAdherence}
            />
          )}

          <HealthHistoryLinks />
          <MonthlyReportCard />
          <AchievementsSection />
          <HealthInsights />
        </div>
      </div>
      <Navigation />
      <HealthAssistantChat />
    </>
  );
}
