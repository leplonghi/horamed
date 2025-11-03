import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import StreakBadge from "@/components/StreakBadge";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useNavigate } from "react-router-dom";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import DoseActionButton from "@/components/DoseActionButton";
import FloatingActionButton from "@/components/FloatingActionButton";
import HelpTooltip from "@/components/HelpTooltip";
import ProgressDashboard from "@/components/ProgressDashboard";
import { TrendingUp, Activity, Calendar } from "lucide-react";

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

export default function Today() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { scheduleNotificationsForNextDay } = useMedicationAlarm();
  usePushNotifications();
  const streakData = useStreakCalculator();
  const criticalAlerts = useCriticalAlerts();
  
  const [upcomingDoses, setUpcomingDoses] = useState<DoseInstance[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0 });
  const [weekStats, setWeekStats] = useState({ thisWeek: 0, lastWeek: 0 });
  const [monthStats, setMonthStats] = useState({ current: 0, goal: 90 });

  const loadData = useCallback(async () => {

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setUserName(profileData.nickname || profileData.full_name || "");
      }

      // Load today's doses
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items (name, dose_text, with_food)
        `)
        .gte("due_at", now.toISOString())
        .lte("due_at", endOfDay.toISOString())
        .order("due_at", { ascending: true })
        .limit(10);

      setUpcomingDoses(doses || []);

      // Calculate today stats
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const { data: todayDoses } = await supabase
        .from("dose_instances")
        .select(`*, items!inner(user_id)`)
        .eq("items.user_id", user.id)
        .gte("due_at", startOfDay.toISOString())
        .lte("due_at", endOfDay.toISOString());

      const total = todayDoses?.length || 0;
      const completed = todayDoses?.filter(d => d.status === "taken").length || 0;
      setTodayStats({ total, completed });

      // Calculate weekly stats
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      startOfThisWeek.setHours(0, 0, 0, 0);
      
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const { data: thisWeekDoses } = await supabase
        .from("dose_instances")
        .select(`*, items!inner(user_id)`)
        .eq("items.user_id", user.id)
        .gte("due_at", startOfThisWeek.toISOString())
        .lte("due_at", now.toISOString());

      const { data: lastWeekDoses } = await supabase
        .from("dose_instances")
        .select(`*, items!inner(user_id)`)
        .eq("items.user_id", user.id)
        .gte("due_at", startOfLastWeek.toISOString())
        .lt("due_at", startOfThisWeek.toISOString());

      const thisWeekTotal = thisWeekDoses?.length || 0;
      const thisWeekCompleted = thisWeekDoses?.filter(d => d.status === "taken").length || 0;
      const thisWeekAverage = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;

      const lastWeekTotal = lastWeekDoses?.length || 0;
      const lastWeekCompleted = lastWeekDoses?.filter(d => d.status === "taken").length || 0;
      const lastWeekAverage = lastWeekTotal > 0 ? Math.round((lastWeekCompleted / lastWeekTotal) * 100) : 0;

      setWeekStats({ thisWeek: thisWeekAverage, lastWeek: lastWeekAverage });

      // Calculate monthly stats
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: monthDoses } = await supabase
        .from("dose_instances")
        .select(`*, items!inner(user_id)`)
        .eq("items.user_id", user.id)
        .gte("due_at", startOfMonth.toISOString())
        .lte("due_at", now.toISOString());

      const monthTotal = monthDoses?.length || 0;
      const monthCompleted = monthDoses?.filter(d => d.status === "taken").length || 0;
      const monthAverage = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

      setMonthStats({ current: monthAverage, goal: 90 });

      // Load low stock items
      const { data: items } = await supabase
        .from("items")
        .select(`
          id,
          name,
          stock (units_left, unit_label, projected_end_at)
        `)
        .eq("is_active", true);

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
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bom dia");
    else if (hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    loadData();
    scheduleNotificationsForNextDay();

    // Set up realtime subscription for dose updates
    const channel = supabase
      .channel('dose-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dose_instances'
        },
        () => {
          console.log('Dose instance changed, reloading data');
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        () => {
          console.log('Item changed, reloading data');
          loadData();
        }
      )
      .subscribe();

    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadData, scheduleNotificationsForNextDay]);

  const markAsTaken = async (doseId: string, itemId: string, itemName: string) => {
    try {
      // Check stock
      const { data: stockData } = await supabase
        .from("stock")
        .select("units_left")
        .eq("item_id", itemId)
        .single();

      if (stockData && stockData.units_left === 0) {
        toast.error("Estoque zerado! Reabasteça antes de registrar dose.");
        return;
      }

      // Update dose
      await supabase
        .from("dose_instances")
        .update({
          status: "taken",
          taken_at: new Date().toISOString(),
        })
        .eq("id", doseId);

      // Decrement stock
      if (stockData && stockData.units_left > 0) {
        await supabase
          .from("stock")
          .update({ units_left: stockData.units_left - 1 })
          .eq("item_id", itemId);
      }

      toast.success(`✓ ${itemName} confirmado!`);
      loadData();
      streakData.refresh();
      criticalAlerts.refresh();
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error("Erro ao confirmar dose");
    }
  };

  const snoozeDose = async (doseId: string, itemName: string) => {
    try {
      const { data: dose } = await supabase
        .from("dose_instances")
        .select("due_at")
        .eq("id", doseId)
        .single();

      if (dose) {
        const newTime = new Date(dose.due_at);
        newTime.setMinutes(newTime.getMinutes() + 15);

        await supabase
          .from("dose_instances")
          .update({
            due_at: newTime.toISOString(),
          })
          .eq("id", doseId);

        toast.success(`⏰ ${itemName} adiado por 15 minutos`);
        loadData();
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error("Erro ao adiar dose");
    }
  };

  const skipDose = async (doseId: string, itemName: string) => {
    try {
      await supabase
        .from("dose_instances")
        .update({ status: "skipped" })
        .eq("id", doseId);

      toast.success(`→ ${itemName} pulado`);
      loadData();
    } catch (error) {
      console.error("Error skipping dose:", error);
      toast.error("Erro ao pular dose");
    }
  };

  const adherencePercentage = todayStats.total > 0 
    ? Math.round((todayStats.completed / todayStats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <>
        <Header />
        <PageSkeleton />
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {greeting}{userName && `, ${userName}`}!
              </h1>
              <p className="text-muted-foreground mt-1">
                {upcomingDoses.length > 0 
                  ? `Você tem ${upcomingDoses.length} dose${upcomingDoses.length > 1 ? 's' : ''} para tomar hoje`
                  : "Nenhuma dose programada para hoje"}
              </p>
            </div>
            {streakData.currentStreak > 0 && (
              <StreakBadge streak={streakData.currentStreak} type="current" />
            )}
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.alerts.length > 0 && (
            <CriticalAlertBanner 
              alerts={criticalAlerts.alerts}
              onDismiss={criticalAlerts.dismissAlert}
            />
          )}

          {/* Today Summary with more info */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hoje</p>
                    <p className="text-3xl font-bold">
                      {todayStats.completed}/{todayStats.total}
                    </p>
                    <p className="text-sm mt-1">
                      {adherencePercentage >= 80 && "🎉 Excelente!"}
                      {adherencePercentage >= 50 && adherencePercentage < 80 && "💪 Bom trabalho!"}
                      {adherencePercentage < 50 && todayStats.total > 0 && "Vamos lá!"}
                      {todayStats.total === 0 && "Nenhuma dose hoje"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">{adherencePercentage}%</div>
                    <p className="text-xs text-muted-foreground">de adesão</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-muted-foreground">Esta Semana</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{weekStats.thisWeek}%</p>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {weekStats.thisWeek > weekStats.lastWeek ? "↑" : "↓"} 
                      {" "}vs semana passada
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-muted-foreground">Este Mês</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{monthStats.current}%</p>
                    <p className="text-sm mt-1 text-muted-foreground">
                      Meta: {monthStats.goal}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Dashboard */}
          {todayStats.total > 0 && (
            <ProgressDashboard
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              thisWeekAverage={weekStats.thisWeek}
              lastWeekAverage={weekStats.lastWeek}
              monthlyGoal={monthStats.goal}
              monthlyProgress={monthStats.current}
            />
          )}

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      Estoque Baixo
                    </h3>
                    {lowStockItems.map((item) => (
                      <p key={item.id} className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>{item.name}</strong>: {item.units_left} {item.unit_label} 
                        ({item.projected_days_left} dias restantes)
                      </p>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/estoque')}
                    className="shrink-0"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Gerenciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Doses */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Próximas Doses</h2>
              <HelpTooltip 
                content="Aqui aparecem os medicamentos que você deve tomar hoje. Confirme quando tomar, adie por 15 minutos ou pule a dose."
                side="right"
              />
            </div>

            {upcomingDoses.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <div className="mb-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-semibold mb-2">Adicione seu primeiro medicamento</p>
                  <p className="text-muted-foreground mb-4">
                    Clique no botão + para começar a organizar sua rotina de medicamentos
                  </p>
                  <Button 
                    onClick={() => navigate('/adicionar')}
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar Medicamento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingDoses
                .filter(dose => dose.status === 'scheduled')
                .map((dose) => (
                  <Card key={dose.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {format(parseISO(dose.due_at), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg mb-1">
                            {dose.items.name}
                          </h3>
                          {dose.items.dose_text && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {dose.items.dose_text}
                            </p>
                          )}
                          {dose.items.with_food && (
                            <Badge variant="secondary" className="text-xs">
                              🍽️ Com alimento
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <DoseActionButton
                            variant="taken"
                            onClick={() => markAsTaken(dose.id, dose.item_id, dose.items.name)}
                          />
                          <DoseActionButton
                            variant="snooze"
                            onClick={() => snoozeDose(dose.id, dose.items.name)}
                          />
                          <DoseActionButton
                            variant="more"
                            onClick={() => skipDose(dose.id, dose.items.name)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/historico')}
              className="h-auto py-4"
            >
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm">Ver Histórico</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/medicamentos')}
              className="h-auto py-4"
            >
              <div className="flex flex-col items-center gap-2">
                <Plus className="h-5 w-5" />
                <span className="text-sm">Medicamentos</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
      <FloatingActionButton />
      <Navigation />
    </>
  );
}
