import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useMilestoneDetector } from "@/hooks/useMilestoneDetector";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import DayTimeline from "@/components/DayTimeline";
import ImprovedCalendar from "@/components/ImprovedCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StreakBadge from "@/components/StreakBadge";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import HealthInsightsCard from "@/components/HealthInsightsCard";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import QuickDoseWidget from "@/components/QuickDoseWidget";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { useAdaptiveSuggestions } from "@/hooks/useAdaptiveSuggestions";
import { VaccineRemindersWidget } from "@/components/VaccineRemindersWidget";
import { ExpiredPrescriptionsAlert } from "@/components/ExpiredPrescriptionsAlert";
import EssentialShortcuts from "@/components/EssentialShortcuts";
import SimpleAdherenceSummary from "@/components/SimpleAdherenceSummary";
import { X, Settings, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import HydrationWidget from "@/components/fitness/HydrationWidget";
import EnergyHintWidget from "@/components/fitness/EnergyHintWidget";
import SupplementConsistencyWidget from "@/components/fitness/SupplementConsistencyWidget";
import { useFitnessPreferences } from "@/hooks/useFitnessPreferences";
import TutorialHint from "@/components/TutorialHint";
import { trackDoseTaken } from "@/hooks/useAppMetrics";
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
export default function TodayRedesign() {
  const navigate = useNavigate();
  const {
    scheduleNotificationsForNextDay
  } = useMedicationAlarm();
  usePushNotifications();
  const streakData = useStreakCalculator();
  const {
    milestone,
    isNewMilestone,
    markAsSeen
  } = useMilestoneDetector();
  const {
    achievements
  } = useAchievements();
  const criticalAlerts = useCriticalAlerts();
  const {
    showFeedback
  } = useFeedbackToast();
  const {
    activeProfile
  } = useUserProfiles();
  useSmartRedirect();
  const {
    suggestions
  } = useAdaptiveSuggestions();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [motivationalQuote, setMotivationalQuote] = useState("");
  const [userName, setUserName] = useState("");
  const [todayStats, setTodayStats] = useState({
    total: 0,
    taken: 0
  });
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [hasAnyItems, setHasAnyItems] = useState(true);
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [hasSupplements, setHasSupplements] = useState(false);
  const {
    preferences
  } = useFitnessPreferences();
  const [tutorialsEnabled, setTutorialsEnabled] = useState(true);

  useEffect(() => {
    const loadTutorialPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.tutorial_flags) {
        const flags = profile.tutorial_flags as Record<string, boolean>;
        setTutorialsEnabled(!flags['tutorials_disabled']);
      }
    };
    loadTutorialPreference();
  }, []);

  const toggleTutorials = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newState = !tutorialsEnabled;
    setTutorialsEnabled(newState);

    const { data: profile } = await supabase
      .from("profiles")
      .select("tutorial_flags")
      .eq("user_id", user.id)
      .single();

    const currentFlags = (profile?.tutorial_flags as Record<string, boolean>) || {};
    const newFlags = { ...currentFlags, tutorials_disabled: !newState };

    await supabase
      .from("profiles")
      .update({ tutorial_flags: newFlags })
      .eq("user_id", user.id);

    toast.success(newState ? "Tutoriais ativados" : "Tutoriais desativados");
  };

  // Check if user has supplements
  useEffect(() => {
    const checkSupplements = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      let query = supabase.from("items").select("id", {
        count: "exact",
        head: true
      }).in("category", ["suplemento", "vitamina"]).eq("is_active", true).eq("user_id", user.id);
      if (activeProfile?.id) {
        query = query.eq("profile_id", activeProfile.id);
      }
      const {
        count
      } = await query;
      setHasSupplements((count || 0) > 0);
    };
    checkSupplements();
  }, [activeProfile]);
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
    const milestoneAchievements: Record<number, string> = {
      7: "week_streak",
      30: "month_streak",
      90: "quarter_streak"
    };
    const achievementId = milestone ? milestoneAchievements[milestone] : null;
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
      setSelectedAchievement(achievement);
      setShareDialogOpen(true);
    }
  };
  const loadEventCounts = useCallback(async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const monthStart = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const monthEnd = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));
      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: profileItems
      } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];
      let dosesPromise;
      if (itemIds.length > 0) {
        dosesPromise = supabase.from("dose_instances").select("due_at").in("item_id", itemIds).gte("due_at", monthStart.toISOString()).lte("due_at", monthEnd.toISOString());
      } else {
        dosesPromise = Promise.resolve({
          data: []
        });
      }
      let appointmentsQuery = supabase.from("consultas_medicas").select("data_consulta").eq("user_id", user.id).gte("data_consulta", monthStart.toISOString()).lte("data_consulta", monthEnd.toISOString());
      if (activeProfile) {
        appointmentsQuery = appointmentsQuery.eq("profile_id", activeProfile.id);
      }
      let eventsQuery = supabase.from("eventos_saude").select("due_date").eq("user_id", user.id).eq("type", "renovacao_exame").gte("due_date", format(monthStart, "yyyy-MM-dd")).lte("due_date", format(monthEnd, "yyyy-MM-dd"));
      if (activeProfile) {
        eventsQuery = eventsQuery.eq("profile_id", activeProfile.id);
      }
      const [dosesData, appointmentsData, eventsData] = await Promise.all([dosesPromise, appointmentsQuery, eventsQuery]);
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: profileData
      } = await supabase.from("profiles").select("nickname, full_name").eq("user_id", user.id).maybeSingle();
      if (profileData) {
        setUserName(profileData.nickname || profileData.full_name || "");
      }
      let allItemsQuery = supabase.from("items").select("id", {
        count: "exact",
        head: true
      });
      if (activeProfile) {
        allItemsQuery = allItemsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        count: itemCount
      } = await allItemsQuery;
      setHasAnyItems((itemCount || 0) > 0);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: profileItems
      } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];
      let doses = null;
      if (itemIds.length > 0) {
        const {
          data: dosesData
        } = await supabase.from("dose_instances").select(`id, due_at, status, item_id, items (name, dose_text, with_food)`).in("item_id", itemIds).gte("due_at", dayStart.toISOString()).lte("due_at", dayEnd.toISOString()).order("due_at", {
          ascending: true
        });
        doses = dosesData;
      } else {
        doses = [];
      }
      let appointmentsQuery = supabase.from("consultas_medicas").select("*").eq("user_id", user.id).gte("data_consulta", dayStart.toISOString()).lte("data_consulta", dayEnd.toISOString());
      if (activeProfile) {
        appointmentsQuery = appointmentsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: appointments
      } = await appointmentsQuery.order("data_consulta", {
        ascending: true
      });
      let eventsQuery = supabase.from("eventos_saude").select("*").eq("user_id", user.id).eq("type", "renovacao_exame").gte("due_date", format(dayStart, "yyyy-MM-dd")).lte("due_date", format(dayEnd, "yyyy-MM-dd"));
      if (activeProfile) {
        eventsQuery = eventsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: events
      } = await eventsQuery.order("due_date", {
        ascending: true
      });
      const items: TimelineItem[] = [];
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
          onSnooze: () => snoozeDose(dose.id, dose.items.name)
        });
      });
      appointments?.forEach((apt: any) => {
        items.push({
          id: apt.id,
          time: format(new Date(apt.data_consulta), "HH:mm"),
          type: "appointment",
          title: apt.especialidade || "Consulta Médica",
          subtitle: apt.medico_nome ? `Dr(a). ${apt.medico_nome}` : apt.local,
          status: apt.status === "realizada" ? "done" : "pending"
        });
      });
      events?.forEach((event: any) => {
        items.push({
          id: event.id,
          time: "09:00",
          type: "exam",
          title: event.title,
          subtitle: event.notes || undefined,
          status: event.completed_at ? "done" : "pending"
        });
      });
      items.sort((a, b) => a.time.localeCompare(b.time));
      setTimelineItems(items);
      const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (isToday && doses) {
        const total = doses.length;
        const taken = doses.filter((d: any) => d.status === "taken").length;
        setTodayStats({
          total,
          taken
        });
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
    
    // Determina se é perfil próprio ou de familiar
    // Se ainda não carregou o perfil, assume que é próprio (mais comum)
    const isSelf = !activeProfile || activeProfile.relationship === 'self';
    const profileName = activeProfile?.name || userName || "você";
    
    if (hour < 12) {
      setGreeting("Bom dia");
      if (isSelf) {
        quotes = [
          "Vamos começar o dia cuidando da sua saúde!",
          "Suas doses da manhã estão te esperando.",
          "Bom dia! Como está se sentindo hoje?"
        ];
      } else {
        quotes = [
          `${profileName} já tomou os remédios da manhã?`,
          `Confira se ${profileName} está em dia com os medicamentos.`
        ];
      }
    } else if (hour < 18) {
      setGreeting("Boa tarde");
      if (isSelf) {
        quotes = [
          "Continue firme! Você está cuidando bem de você.",
          "Mantenha o foco na sua saúde.",
          "Não esqueça das doses da tarde!"
        ];
      } else {
        quotes = [
          `Como está ${profileName}? Confira as doses.`,
          `${profileName} tomou o remédio do almoço?`
        ];
      }
    } else {
      setGreeting("Boa noite");
      if (isSelf) {
        quotes = [
          "Não esqueça dos remédios da noite!",
          "Finalize o dia em dia com sua saúde.",
          "Quase lá! Últimas doses do dia."
        ];
      } else {
        quotes = [
          `${profileName} já tomou os remédios da noite?`,
          `Confirme as doses de ${profileName} antes de dormir.`
        ];
      }
    }
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    loadData(selectedDate);
    loadEventCounts();
  }, [loadData, loadEventCounts, selectedDate, activeProfile, userName]);
  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      loadData(selectedDate);
      loadEventCounts();
    }
  }, [activeProfile?.id]);
  useEffect(() => {
    scheduleNotificationsForNextDay();
    const channel = supabase.channel('timeline-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'dose_instances'
    }, () => loadData(selectedDate)).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'consultas_medicas'
    }, () => loadData(selectedDate)).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'eventos_saude'
    }, () => loadData(selectedDate)).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const markAsTaken = async (doseId: string, itemId: string, itemName: string) => {
    try {
      const {
        data: stockData
      } = await supabase.from("stock").select("units_left").eq("item_id", itemId).single();
      if (stockData && stockData.units_left === 0) {
        toast.error("Estoque zerado! Reabasteça antes de registrar dose.");
        return;
      }
      await supabase.from("dose_instances").update({
        status: "taken",
        taken_at: new Date().toISOString()
      }).eq("id", doseId);
      if (stockData && stockData.units_left > 0) {
        await supabase.from("stock").update({
          units_left: stockData.units_left - 1
        }).eq("item_id", itemId);
      }
      // Track metric
      trackDoseTaken(doseId, itemName);
      
      showFeedback("dose-taken", {
        medicationName: itemName
      });
      loadData(selectedDate);
      streakData.refresh();
      criticalAlerts.refresh();
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error("Erro ao confirmar dose");
    }
  };
  const snoozeDose = async (doseId: string, itemName: string) => {
    try {
      const {
        data: dose
      } = await supabase.from("dose_instances").select("due_at").eq("id", doseId).single();
      if (dose) {
        const newDueAt = new Date(dose.due_at);
        newDueAt.setMinutes(newDueAt.getMinutes() + 15);
        await supabase.from("dose_instances").update({
          due_at: newDueAt.toISOString()
        }).eq("id", doseId);
        toast.success(`${itemName} adiado por 15 minutos`);
        loadData(selectedDate);
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error("Erro ao adiar dose");
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto pt-24 pb-20 max-w-6xl px-[10px]">
        {/* Compact Header with greeting */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {greeting}{userName && `, ${userName}`}!
              </h1>
              <p className="text-muted-foreground text-sm truncate">{motivationalQuote}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Streak inline badge */}
              {streakData.currentStreak > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
                  🔥 {streakData.currentStreak}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTutorials}
                className="h-8 w-8"
                title={tutorialsEnabled ? "Desativar tutoriais" : "Ativar tutoriais"}
              >
                <Settings className={`h-4 w-4 ${tutorialsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Critical Alerts - Compact and dismissable */}
        {criticalAlerts.alerts.length > 0 && (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
                criticalAlerts.dismissAll();
              }
            }}
            className="mb-3"
          >
            <CriticalAlertBanner
              alerts={criticalAlerts.alerts}
              onDismiss={(id) => criticalAlerts.dismissAlert(id)}
              onDismissAll={() => criticalAlerts.dismissAll()}
            />
          </motion.div>
        )}

        {/* Expired Prescriptions & Vaccine Reminders - inline compact */}
        <div className="flex flex-wrap gap-2 mb-3">
          <ExpiredPrescriptionsAlert />
          <VaccineRemindersWidget />
        </div>

        {/* MAIN: Timeline + Calendar (medications first) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Timeline - PRIMARY, first on mobile */}
          <div className="w-full order-1">
            <DayTimeline date={selectedDate} items={timelineItems} onDateChange={setSelectedDate} />
          </div>

          {/* Calendar */}
          <div className="w-full order-2">
            <ImprovedCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} eventCounts={eventCounts} />
          </div>
        </div>

        {/* Quick Actions - Compact inline row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/adicionar-medicamento")}
            className="text-xs gap-1.5"
          >
            <span className="text-primary">+</span> Remédio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/carteira")}
            className="text-xs gap-1.5"
          >
            <span className="text-green-600">📄</span> Documento
          </Button>
        </div>

        {/* Secondary Stats Row - Colorful */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Adherence - Primary color */}
          <Card className="p-3 bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">Doses Hoje</p>
                <p className="text-lg font-bold text-foreground">
                  {todayStats.taken}/{todayStats.total}
                </p>
              </div>
              <div className={cn(
                "text-2xl font-bold",
                todayStats.total > 0 && todayStats.taken === todayStats.total
                  ? "text-green-500"
                  : todayStats.taken > 0
                  ? "text-primary"
                  : "text-muted-foreground"
              )}>
                {todayStats.total > 0 ? Math.round((todayStats.taken / todayStats.total) * 100) : 0}%
              </div>
            </div>
          </Card>

          {/* Insights - Blue accent */}
          <Card
            className="p-3 cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/20 active:scale-[0.98]"
            onClick={() => navigate('/evolucao')}
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">Evolução</p>
                <p className="text-[10px] text-muted-foreground">Insights e dados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Dose Widget - Full width */}
        <div className="mb-4">
          <QuickDoseWidget />
        </div>

        {/* Fitness Widgets - Conditional */}
        {hasSupplements && preferences.showFitnessWidgets && (
          <div className="space-y-2 mb-4">
            <HydrationWidget />
            <SupplementConsistencyWidget last7Days={[80, 85, 90, 75, 95, 88, 92]} />
            <EnergyHintWidget />
          </div>
        )}

        {/* Tutorial Hints */}
        {tutorialsEnabled && (
          <TutorialHint
            id="today_overview"
            title="📅 Sua rotina de hoje"
            message="Marque as doses quando tomar. O calendário mostra seus compromissos do mês."
            placement="bottom"
          />
        )}

        {/* Milestone Reward Modal */}
        {milestone && (
          <MilestoneReward
            visible={showMilestoneReward}
            onClose={handleMilestoneClose}
            onShare={handleMilestoneShare}
            milestone={milestone}
          />
        )}

        {/* Achievement Share Dialog */}
        {selectedAchievement && (
          <AchievementShareDialog
            achievement={selectedAchievement}
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
          />
        )}
      </main>

      <Navigation />
    </div>
  );
}