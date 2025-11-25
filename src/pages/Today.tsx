import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useMilestoneDetector } from "@/hooks/useMilestoneDetector";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import DayTimeline from "@/components/DayTimeline";
import ImprovedCalendar from "@/components/ImprovedCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StreakBadge from "@/components/StreakBadge";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import InfoDialog from "@/components/InfoDialog";
import HealthInsightsCard from "@/components/HealthInsightsCard";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import QuickDoseWidget from "@/components/QuickDoseWidget";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { useAdaptiveSuggestions } from "@/hooks/useAdaptiveSuggestions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideEffectQuickLog } from "@/components/SideEffectQuickLog";
import { VaccineRemindersWidget } from "@/components/VaccineRemindersWidget";
import { CaregiverVaccineReminders } from "@/components/CaregiverVaccineReminders";
import { ExpiredPrescriptionsAlert } from "@/components/ExpiredPrescriptionsAlert";
import { SmartActionCards } from "@/components/SmartActionCards";

interface TimelineItem {
  id: string;
  time: string;
  type: "medication" | "appointment" | "exam";
  title: string;
  subtitle?: string;
  status: "pending" | "done" | "missed";
  onMarkDone?: () => void;
  onSnooze?: () => void;
  itemId?: string;
}

export default function Today() {
  const navigate = useNavigate();
  const { scheduleNotificationsForNextDay } = useMedicationAlarm();
  usePushNotifications();
  const streakData = useStreakCalculator();
  const { milestone, isNewMilestone, markAsSeen } = useMilestoneDetector();
  const { achievements } = useAchievements();
  const criticalAlerts = useCriticalAlerts();
  const { showFeedback } = useFeedbackToast();
  const { activeProfile } = useUserProfiles();
  useSmartRedirect();
  const { suggestions } = useAdaptiveSuggestions();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [motivationalQuote, setMotivationalQuote] = useState("");
  const [userName, setUserName] = useState("");
  const [todayStats, setTodayStats] = useState({ total: 0, taken: 0 });
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [hasAnyItems, setHasAnyItems] = useState(true);
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  
  // Side Effects Log states
  const [sideEffectLogOpen, setSideEffectLogOpen] = useState(false);
  const [loggedDoseId, setLoggedDoseId] = useState<string>("");
  const [loggedItemId, setLoggedItemId] = useState<string>("");
  const [loggedItemName, setLoggedItemName] = useState<string>("");

  // Show milestone reward when detected
  useEffect(() => {
    if (isNewMilestone && milestone) {
      setShowMilestoneReward(true);
    }
  }, [isNewMilestone, milestone]);

  const handleMilestoneClose = () => {
    setShowMilestoneReward(false);
    markAsSeen();
  };

  const handleMilestoneShare = () => {
    setShowMilestoneReward(false);
    markAsSeen();
    
    // Find the achievement for this milestone
    const milestoneAchievements: Record<number, string> = {
      7: "week_streak",
      30: "month_streak",
      90: "quarter_streak",
    };
    
    const achievementId = milestone ? milestoneAchievements[milestone] : null;
    const achievement = achievements.find((a) => a.id === achievementId);
    
    if (achievement) {
      setSelectedAchievement(achievement);
      setShareDialogOpen(true);
    }
  };

  const loadEventCounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get counts for the current month
      const monthStart = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const monthEnd = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      // First get items for the active profile
      let itemsQuery = supabase
        .from("items")
        .select("id");

      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      // Prepare queries
      let dosesPromise;
      if (itemIds.length > 0) {
        dosesPromise = supabase
          .from("dose_instances")
          .select("due_at")
          .in("item_id", itemIds)
          .gte("due_at", monthStart.toISOString())
          .lte("due_at", monthEnd.toISOString());
      } else {
        dosesPromise = Promise.resolve({ data: [] });
      }

      let appointmentsQuery = supabase
        .from("consultas_medicas")
        .select("data_consulta")
        .eq("user_id", user.id)
        .gte("data_consulta", monthStart.toISOString())
        .lte("data_consulta", monthEnd.toISOString());

      if (activeProfile) {
        appointmentsQuery = appointmentsQuery.eq("profile_id", activeProfile.id);
      }

      let eventsQuery = supabase
        .from("eventos_saude")
        .select("due_date")
        .eq("user_id", user.id)
        .eq("type", "renovacao_exame")
        .gte("due_date", format(monthStart, "yyyy-MM-dd"))
        .lte("due_date", format(monthEnd, "yyyy-MM-dd"));

      if (activeProfile) {
        eventsQuery = eventsQuery.eq("profile_id", activeProfile.id);
      }

      const [dosesData, appointmentsData, eventsData] = await Promise.all([
        dosesPromise,
        appointmentsQuery,
        eventsQuery
      ]);

      const counts: Record<string, number> = {};
      
      dosesData.data?.forEach((dose: any) => {
        const key = format(new Date(dose.due_at), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });

      appointmentsData.data?.forEach((apt: any) => {
        const key = format(new Date(apt.data_consulta), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });

      eventsData.data?.forEach((event: any) => {
        const key = event.due_date;
        counts[key] = (counts[key] || 0) + 1;
      });

      setEventCounts(counts);
    } catch (error) {
      console.error("Error loading event counts:", error);
    }
  }, [selectedDate, activeProfile]);

  const loadData = useCallback(async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserName(profileData.nickname || profileData.full_name || "");
      }

      // Check if user has any items at all (to control empty state)
      let allItemsQuery = supabase
        .from("items")
        .select("id", { count: "exact", head: true });

      if (activeProfile) {
        allItemsQuery = allItemsQuery.eq("profile_id", activeProfile.id);
      }

      const { count: itemCount } = await allItemsQuery;
      setHasAnyItems((itemCount || 0) > 0);

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // First get items for the active profile
      let itemsQuery = supabase
        .from("items")
        .select("id");

      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      // Load medications for the day
      let doses = null;
      if (itemIds.length > 0) {
        const { data: dosesData } = await supabase
          .from("dose_instances")
          .select(`
            id,
            due_at,
            status,
            item_id,
            items (name, dose_text, with_food)
          `)
          .in("item_id", itemIds)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString())
          .order("due_at", { ascending: true });
        
        doses = dosesData;
      } else {
        // No items for this profile, so no doses
        doses = [];
      }

      // Load appointments for the day
      let appointmentsQuery = supabase
        .from("consultas_medicas")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_consulta", dayStart.toISOString())
        .lte("data_consulta", dayEnd.toISOString());

      if (activeProfile) {
        appointmentsQuery = appointmentsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: appointments } = await appointmentsQuery.order("data_consulta", { ascending: true });

      // Load health events (exams) for the day
      let eventsQuery = supabase
        .from("eventos_saude")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "renovacao_exame")
        .gte("due_date", format(dayStart, "yyyy-MM-dd"))
        .lte("due_date", format(dayEnd, "yyyy-MM-dd"));

      if (activeProfile) {
        eventsQuery = eventsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: events } = await eventsQuery.order("due_date", { ascending: true });

      // Transform to timeline items
      const items: TimelineItem[] = [];

      // Add medications
      doses?.forEach((dose: any) => {
        items.push({
          id: dose.id,
          time: format(new Date(dose.due_at), "HH:mm"),
          type: "medication",
          title: dose.items.name,
          subtitle: dose.items.dose_text || undefined,
          status: dose.status === "taken" ? "done" : dose.status === "missed" ? "missed" : "pending",
          itemId: dose.item_id,
          onMarkDone: () => markAsTaken(dose.id, dose.item_id, dose.items.name),
          onSnooze: () => snoozeDose(dose.id, dose.items.name),
        });
      });

      // Add appointments
      appointments?.forEach((apt: any) => {
        items.push({
          id: apt.id,
          time: format(new Date(apt.data_consulta), "HH:mm"),
          type: "appointment",
          title: apt.especialidade || "Consulta Médica",
          subtitle: apt.medico_nome ? `Dr(a). ${apt.medico_nome}` : apt.local,
          status: apt.status === "realizada" ? "done" : "pending",
        });
      });

      // Add exams
      events?.forEach((event: any) => {
        items.push({
          id: event.id,
          time: "09:00", // Default time for exams
          type: "exam",
          title: event.title,
          subtitle: event.notes || undefined,
          status: event.completed_at ? "done" : "pending",
        });
      });

      // Sort by time
      items.sort((a, b) => a.time.localeCompare(b.time));

      setTimelineItems(items);

      // Calculate today's stats only if viewing today
      const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (isToday && doses) {
        const total = doses.length;
        const taken = doses.filter((d: any) => d.status === "taken").length;
        setTodayStats({ total, taken });
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    const hour = new Date().getHours();
    let quotes: string[] = [];
    
    if (hour < 12) {
      setGreeting("Bom dia");
      quotes = [
        "Um novo dia é uma nova oportunidade para cuidar da sua saúde!",
        "Cada dose tomada é um passo em direção ao seu bem-estar.",
        "Hoje é dia de cuidar de você com carinho e atenção.",
        "Comece o dia bem: sua saúde agradece!",
        "Que tal começar esse dia com foco no autocuidado?"
      ];
    } else if (hour < 18) {
      setGreeting("Boa tarde");
      quotes = [
        "Continue firme! Você está fazendo um ótimo trabalho.",
        "Lembre-se: consistência é a chave para o sucesso.",
        "Mantenha o ritmo! Sua saúde é prioridade.",
        "Cada dia seguido é uma vitória. Continue assim!",
        "Você está no caminho certo para uma vida mais saudável."
      ];
    } else {
      setGreeting("Boa noite");
      quotes = [
        "Parabéns por mais um dia de cuidado com você!",
        "Descanse bem, você merece. Amanhã tem mais!",
        "Terminar o dia em dia com a saúde é motivo de orgulho.",
        "Você está construindo hábitos saudáveis. Continue!",
        "Mais um dia cuidando de você. Que orgulho!"
      ];
    }
    
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    loadData(selectedDate);
    loadEventCounts();
  }, [loadData, loadEventCounts, selectedDate]);

  // Reload data when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      loadData(selectedDate);
      loadEventCounts();
    }
  }, [activeProfile?.id]);

  // Schedule notifications only once on mount
  useEffect(() => {
    scheduleNotificationsForNextDay();

    // Set up realtime subscription
    const channel = supabase
      .channel('timeline-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dose_instances'
        },
        () => loadData(selectedDate)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultas_medicas'
        },
        () => loadData(selectedDate)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eventos_saude'
        },
        () => loadData(selectedDate)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      showFeedback("dose-taken", { medicationName: itemName });
      loadData(selectedDate);
      streakData.refresh();
      criticalAlerts.refresh();
      
      // Open Side Effect Log modal
      setLoggedDoseId(doseId);
      setLoggedItemId(itemId);
      setLoggedItemName(itemName);
      setSideEffectLogOpen(true);
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

        showFeedback("dose-snoozed");
        loadData(selectedDate);
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error("Erro ao adiar dose");
    }
  };

  const adherencePercentage = todayStats.total > 0 
    ? Math.round((todayStats.taken / todayStats.total) * 100) 
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
      <div className="min-h-screen bg-background pt-20 px-3 py-4 pb-24 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-4 overflow-x-hidden">
          {/* Greeting & Streak */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {greeting}{userName && `, ${userName}`}!
              </h1>
              <p className="text-sm text-primary/80 font-medium mt-1.5 italic">
                {motivationalQuote}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {timelineItems.length > 0 
                  ? `${timelineItems.length} evento${timelineItems.length > 1 ? 's' : ''} hoje`
                  : "Nenhum evento programado"}
              </p>
            </div>
            {streakData.currentStreak > 0 && (
              <div className="flex items-center gap-2">
                <StreakBadge streak={streakData.currentStreak} type="current" />
                <InfoDialog
                  title="O que é streak?"
                  description="Streak são dias seguidos com progresso acima de 80%. Quanto maior seu streak, mais consistente você está sendo!"
                  triggerClassName="h-5 w-5"
                />
              </div>
            )}
          </div>

          {/* Empty State - only show when user has NO items at all */}
          {!hasAnyItems && timelineItems.length === 0 && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-4xl mb-2">🌟</div>
                <h3 className="text-lg font-semibold">Comece a organizar seus tratamentos!</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione remédios, suplementos e vitaminas. Configure horários e nunca mais esqueça.
                </p>
                <Button 
                  onClick={() => navigate("/adicionar-medicamento")} 
                  size="lg"
                  className="mt-4"
                >
                  + Adicionar Primeiro Item
                </Button>
                <div className="pt-4 border-t mt-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    📄 Você também pode guardar seus documentos médicos no Cofre
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/cofre")}
                  >
                    📄 Ir para o Cofre
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical Alerts */}
          {criticalAlerts.alerts.length > 0 && (
            <CriticalAlertBanner 
              alerts={criticalAlerts.alerts}
              onDismiss={criticalAlerts.dismissAlert}
              onDismissAll={criticalAlerts.dismissAll}
            />
          )}

          {/* Smart Action Cards */}
          <SmartActionCards />

          {/* Health Insights Card */}
          <HealthInsightsCard />

          {/* Expired Prescriptions Alert */}
          <ExpiredPrescriptionsAlert />

          {/* Vaccine Reminders Widget */}
          <VaccineRemindersWidget />

          {/* Caregiver Vaccine Reminders */}
          <CaregiverVaccineReminders />

          {/* Quick Dose Widget */}
          <QuickDoseWidget />

          {/* Adaptive Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <Alert key={idx} className="border-primary/20 bg-primary/5">
                  <AlertDescription>{suggestion.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Today Summary */}
          {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm text-muted-foreground">Progresso de Hoje</p>
                      <InfoDialog
                        title="O que é o progresso?"
                        description="Progresso é a proporção de doses tomadas. Acima de 80% é excelente!"
                      />
                    </div>
                    <p className="text-2xl font-bold">
                      {todayStats.taken}/{todayStats.total}
                    </p>
                    <p className="text-sm mt-0.5">
                      {adherencePercentage >= 80 && "🎉 Excelente!"}
                      {adherencePercentage >= 50 && adherencePercentage < 80 && "💪 Bom trabalho!"}
                      {adherencePercentage < 50 && todayStats.total > 0 && "Vamos lá!"}
                      {todayStats.total === 0 && "Nenhuma dose hoje"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{adherencePercentage}%</div>
                    <p className="text-xs text-muted-foreground">completo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendário Melhorado */}
          <ImprovedCalendar
            selectedDate={selectedDate}
            onDateSelect={(newDate) => {
              setSelectedDate(newDate);
              setLoading(true);
              loadData(newDate);
            }}
            eventCounts={eventCounts}
          />

          {/* Timeline do Dia */}
          <DayTimeline
            date={selectedDate}
            items={timelineItems}
            onDateChange={(newDate) => {
              setSelectedDate(newDate);
              setLoading(true);
              loadData(newDate);
            }}
          />
        </div>
      </div>

      <Navigation />

      {/* Milestone Reward Modal */}
      {milestone && (
        <MilestoneReward
          milestone={milestone}
          visible={showMilestoneReward}
          onClose={handleMilestoneClose}
          onShare={handleMilestoneShare}
        />
      )}

      {/* Side Effect Log Modal */}
      <SideEffectQuickLog
        open={sideEffectLogOpen}
        onOpenChange={setSideEffectLogOpen}
        doseId={loggedDoseId}
        itemId={loggedItemId}
        itemName={loggedItemName}
        profileId={activeProfile?.id}
      />

      {/* Achievement Share Dialog */}
      {selectedAchievement && (
        <AchievementShareDialog
          achievement={selectedAchievement}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </>
  );
}
