import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
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
import { Card } from "@/components/ui/card";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { VaccineRemindersWidget } from "@/components/VaccineRemindersWidget";
import { ExpiredPrescriptionsAlert } from "@/components/ExpiredPrescriptionsAlert";
import { trackDoseTaken } from "@/hooks/useAppMetrics";
import { OverdueDosesBanner } from "@/components/OverdueDosesBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import StockAlertWidget from "@/components/StockAlertWidget";
import MonthlyReportWidget from "@/components/MonthlyReportWidget";
import HeroNextDose from "@/components/HeroNextDose";
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
  const { getProfileCache } = useProfileCacheContext();
  const { t, language } = useLanguage();
  useSmartRedirect();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [todayStats, setTodayStats] = useState({
    total: 0,
    taken: 0,
  });
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [nextPendingDose, setNextPendingDose] = useState<any>(null);
  const [nextDayDose, setNextDayDose] = useState<{ time: string; name: string } | null>(null);
  // Milestone detection
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
  }, [selectedDate, activeProfile?.id]);

  const loadTomorrowFirstDose = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tomorrow = addDays(new Date(), 1);
      const tomorrowStart = startOfDay(tomorrow);
      const tomorrowEnd = endOfDay(tomorrow);

      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }
      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      if (itemIds.length > 0) {
        const { data: tomorrowDoses } = await supabase
          .from("dose_instances")
          .select(`due_at, items (name)`)
          .in("item_id", itemIds)
          .gte("due_at", tomorrowStart.toISOString())
          .lte("due_at", tomorrowEnd.toISOString())
          .eq("status", "scheduled")
          .order("due_at", { ascending: true })
          .limit(1);

        if (tomorrowDoses && tomorrowDoses.length > 0) {
          const dose = tomorrowDoses[0] as any;
          setNextDayDose({
            time: format(new Date(dose.due_at), "HH:mm"),
            name: dose.items?.name || ""
          });
        } else {
          setNextDayDose(null);
        }
      }
    } catch (error) {
      console.error("Error loading tomorrow doses:", error);
    }
  }, [activeProfile?.id]);

  const loadData = useCallback(async (date: Date, forceLoading = false) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Evita "ghost" na troca de perfil: aplica cache do perfil (apenas hoje)
      const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (activeProfile?.id && isToday) {
        const cached = getProfileCache(activeProfile.id);
        if (cached) {
          // Cache found, apply it

          const cachedDoses = (cached.todayDoses || []) as any[];
          const cachedItems: TimelineItem[] = cachedDoses.map((dose: any) => ({
            id: dose.id,
            time: format(new Date(dose.due_at), "HH:mm"),
            type: "medication",
            title: dose.items?.name,
            subtitle: dose.items?.dose_text || undefined,
            status:
              dose.status === "taken"
                ? "done"
                : dose.status === "missed"
                ? "missed"
                : "pending",
            itemId: dose.item_id,
          }));

          setTimelineItems(cachedItems);
          setTodayStats({
            total: cachedDoses.length,
            taken: cachedDoses.filter((d: any) => d.status === "taken").length,
          });

          if (!forceLoading) {
            setLoading(false);
          }
        }
      }

      if (forceLoading) setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

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
      // Items loaded
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
        } = await supabase.from("dose_instances").select(`id, due_at, status, item_id, items (name, dose_text, with_food, category)`).in("item_id", itemIds).gte("due_at", dayStart.toISOString()).lte("due_at", dayEnd.toISOString()).order("due_at", {
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
          title: apt.especialidade || t('todayRedesign.appointmentDefault'),
          subtitle: apt.medico_nome ? t('todayRedesign.doctorPrefix', { name: apt.medico_nome }) : apt.local,
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
      const isToday2 = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (isToday2 && doses) {
        const total = doses.length;
        const taken = doses.filter((d: any) => d.status === "taken").length;
        setTodayStats({ total, taken });
        
        // Find next pending dose for Hero widget
        const now = new Date();
        const pendingDoses = doses
          .filter((d: any) => d.status === "scheduled")
          .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
        
        if (pendingDoses.length > 0) {
          setNextPendingDose(pendingDoses[0]);
          setNextDayDose(null);
        } else {
          setNextPendingDose(null);
          // All done for today - fetch tomorrow's first dose
          loadTomorrowFirstDose();
        }
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("todayRedesign.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id, t, getProfileCache]);

  // Load greeting/quote once on mount or when key dependencies change
  useEffect(() => {
    const hour = new Date().getHours();
    let quotes: string[] = [];

    // Determine whether this is the user's own profile or a family profile
    const isSelf = !activeProfile || activeProfile.relationship === 'self';
    const profileName = activeProfile?.name || userName || (language === 'pt' ? "você" : "you");

    if (hour < 12) {
      setGreeting(t('today.goodMorning'));
      if (isSelf) {
        quotes = language === 'pt'
          ? [
              "Vamos começar o dia cuidando da sua saúde!",
              "Suas doses da manhã estão te esperando.",
              "Bom dia! Como está se sentindo hoje?"
            ]
          : [
              "Let's start the day taking care of your health!",
              "Your morning doses are waiting for you.",
              "Good morning! How are you feeling today?"
            ];
      } else {
        quotes = language === 'pt'
          ? [
              `${profileName} já tomou os remédios da manhã?`,
              `Confira se ${profileName} está em dia com os medicamentos.`
            ]
          : [
              `Has ${profileName} taken the morning meds?`,
              `Check if ${profileName} is up to date with medications.`
            ];
      }
    } else if (hour < 18) {
      setGreeting(t('today.goodAfternoon'));
      if (isSelf) {
        quotes = language === 'pt'
          ? [
              "Continue firme! Você está cuidando bem de você.",
              "Mantenha o foco na sua saúde.",
              "Não esqueça das doses da tarde!"
            ]
          : [
              "Keep going — you're taking great care of yourself.",
              "Stay focused on your health.",
              "Don't forget your afternoon doses!"
            ];
      } else {
        quotes = language === 'pt'
          ? [
              `Como está ${profileName}? Confira as doses.`,
              `${profileName} tomou o remédio do almoço?`
            ]
          : [
              `How is ${profileName}? Check today's doses.`,
              `Did ${profileName} take the midday dose?`
            ];
      }
    } else {
      setGreeting(t('today.goodEvening'));
      if (isSelf) {
        quotes = language === 'pt'
          ? [
              "Não esqueça dos remédios da noite!",
              "Finalize o dia em dia com sua saúde.",
              "Quase lá! Últimas doses do dia."
            ]
          : [
              "Don't forget your evening meds!",
              "Finish the day with your health on track.",
              "Almost there — last doses of the day."
            ];
      } else {
        quotes = language === 'pt'
          ? [
              `${profileName} já tomou os remédios da noite?`,
              `Confirme as doses de ${profileName} antes de dormir.`
            ]
          : [
              `Has ${profileName} taken the evening meds?`,
              `Confirm ${profileName}'s doses before bedtime.`
            ];
      }
    }

    // Greeting set
  }, [activeProfile, userName, language, t]);

  // Load data when date or profile changes
  useEffect(() => {
    loadData(selectedDate, true);
    loadEventCounts();
  }, [selectedDate, activeProfile?.id, loadData, loadEventCounts]);

  // Agendar notificações apenas uma vez
  useEffect(() => {
    scheduleNotificationsForNextDay();
  }, [scheduleNotificationsForNextDay]);

  // Realtime subscription para atualizações de doses/consultas/eventos (com debounce)
  const realtimeDebounceRef = useRef<number | null>(null);

  const handleRealtimeChange = useCallback(() => {
    if (realtimeDebounceRef.current) {
      window.clearTimeout(realtimeDebounceRef.current);
    }

    realtimeDebounceRef.current = window.setTimeout(() => {
      loadData(selectedDate);
    }, 600);
  }, [loadData, selectedDate]);

  useEffect(() => {
    const channel = supabase
      .channel("timeline-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dose_instances" },
        handleRealtimeChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "consultas_medicas" },
        handleRealtimeChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eventos_saude" },
        handleRealtimeChange
      )
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [activeProfile?.id, handleRealtimeChange]);
  const markAsTaken = async (doseId: string, itemId: string, itemName: string) => {
    try {
      const {
        data: stockData
      } = await supabase.from("stock").select("units_left").eq("item_id", itemId).single();
      if (stockData && stockData.units_left === 0) {
        toast.error(t('todayRedesign.stockEmpty'));
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
      toast.error(t('todayRedesign.confirmDoseError'));
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
        toast.success(t('todayRedesign.snoozeSuccess', { name: itemName }));
        loadData(selectedDate);
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error(t('todayRedesign.snoozeError'));
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="page-container container mx-auto max-w-2xl px-4 space-y-4">
      {/* ⭐ BLOCO PRINCIPAL: Próxima Dose - SEMPRE NO TOPO */}
      <HeroNextDose
        dose={nextPendingDose}
        nextDayDose={nextDayDose}
        onTake={markAsTaken}
        onSnooze={snoozeDose}
        allDoneToday={todayStats.total > 0 && todayStats.taken === todayStats.total}
      />

      {/* Saudação compacta + streak */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm text-muted-foreground">
          {greeting}{userName && `, ${userName}`}
        </p>
        {streakData.currentStreak > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
            🔥 {streakData.currentStreak} {language === 'pt' ? 'dias' : 'days'}
          </div>
        )}
      </div>

      {/* Banner de doses atrasadas - só aparece se houver */}
      <OverdueDosesBanner />

      {/* Progresso do dia - Simples e claro */}
      {todayStats.total > 0 && (
        <Card className="p-4 bg-muted/30 border-muted">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {language === 'pt' ? 'Progresso de hoje' : "Today's progress"}
            </span>
            <span className="text-lg font-bold text-foreground">
              {todayStats.taken}/{todayStats.total} {language === 'pt' ? 'doses' : 'doses'}
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${todayStats.total > 0 ? (todayStats.taken / todayStats.total) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </Card>
      )}

      {/* Alertas importantes - Compactos */}
      {criticalAlerts.alerts.length > 0 && (
        <CriticalAlertBanner
          alerts={criticalAlerts.alerts}
          onDismiss={(id) => criticalAlerts.dismissAlert(id)}
          onDismissAll={() => criticalAlerts.dismissAll()}
        />
      )}

      {/* Estoque baixo */}
      <StockAlertWidget />

      {/* Calendário - SECUNDÁRIO, abaixo da ação principal */}
      <Card className="p-4 border-muted/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          {language === 'pt' ? 'Calendário' : 'Calendar'}
        </p>
        <ImprovedCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} eventCounts={eventCounts} />
      </Card>

      {/* Timeline do dia - Para dias não-hoje ou detalhes */}
      {format(selectedDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") && (
        <DayTimeline date={selectedDate} items={timelineItems} onDateChange={setSelectedDate} />
      )}

      {/* Widgets secundários - Colapsáveis/opcionais */}
      <ExpiredPrescriptionsAlert />
      <VaccineRemindersWidget />
      <MonthlyReportWidget />

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