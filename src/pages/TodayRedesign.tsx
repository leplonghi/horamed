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
import { X } from "lucide-react";

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

      const monthStart = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const monthEnd = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserName(profileData.nickname || profileData.full_name || "");
      }

      let allItemsQuery = supabase.from("items").select("id", { count: "exact", head: true });
      if (activeProfile) {
        allItemsQuery = allItemsQuery.eq("profile_id", activeProfile.id);
      }

      const { count: itemCount } = await allItemsQuery;
      setHasAnyItems((itemCount || 0) > 0);

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      let doses = null;
      if (itemIds.length > 0) {
        const { data: dosesData } = await supabase
          .from("dose_instances")
          .select(`id, due_at, status, item_id, items (name, dose_text, with_food)`)
          .in("item_id", itemIds)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString())
          .order("due_at", { ascending: true });
        
        doses = dosesData;
      } else {
        doses = [];
      }

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
          onSnooze: () => snoozeDose(dose.id, dose.items.name),
        });
      });

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

      events?.forEach((event: any) => {
        items.push({
          id: event.id,
          time: "09:00",
          type: "exam",
          title: event.title,
          subtitle: event.notes || undefined,
          status: event.completed_at ? "done" : "pending",
        });
      });

      items.sort((a, b) => a.time.localeCompare(b.time));
      setTimelineItems(items);

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
      ];
    } else if (hour < 18) {
      setGreeting("Boa tarde");
      quotes = [
        "Continue firme! Você está fazendo um ótimo trabalho.",
        "Lembre-se: consistência é a chave para o sucesso.",
      ];
    } else {
      setGreeting("Boa noite");
      quotes = [
        "Parabéns por mais um dia de cuidado com você!",
        "Descanse bem, você merece. Amanhã tem mais!",
      ];
    }
    
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    loadData(selectedDate);
    loadEventCounts();
  }, [loadData, loadEventCounts, selectedDate]);

  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      loadData(selectedDate);
      loadEventCounts();
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    scheduleNotificationsForNextDay();

    const channel = supabase
      .channel('timeline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dose_instances' }, () => loadData(selectedDate))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas_medicas' }, () => loadData(selectedDate))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_saude' }, () => loadData(selectedDate))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsTaken = async (doseId: string, itemId: string, itemName: string) => {
    try {
      const { data: stockData } = await supabase
        .from("stock")
        .select("units_left")
        .eq("item_id", itemId)
        .single();

      if (stockData && stockData.units_left === 0) {
        toast.error("Estoque zerado! Reabasteça antes de registrar dose.");
        return;
      }

      await supabase
        .from("dose_instances")
        .update({ status: "taken", taken_at: new Date().toISOString() })
        .eq("id", doseId);

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
        const newDueAt = new Date(dose.due_at);
        newDueAt.setMinutes(newDueAt.getMinutes() + 15);

        await supabase
          .from("dose_instances")
          .update({ due_at: newDueAt.toISOString() })
          .eq("id", doseId);

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
      
      <main className="container mx-auto px-3 pt-16 pb-20 max-w-6xl">
        {/* Dismissable Alerts with Swipe - Compact */}
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

        <div className="space-y-3">
          <ExpiredPrescriptionsAlert />
          <VaccineRemindersWidget />
        </div>

        {/* Header with greeting - Compact */}
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-0.5">
            {greeting}{userName && `, ${userName}`}!
          </h1>
          <p className="text-muted-foreground text-xs">{motivationalQuote}</p>
        </div>

        {/* Compact Grid: Stats and Quick Actions - Equal Height Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4 items-stretch">
          {/* Streak Badge */}
          {streakData.currentStreak > 0 && (
            <div className="transition-transform hover:scale-105 h-full">
              <StreakBadge streak={streakData.currentStreak} type="current" />
            </div>
          )}
          
          {/* Adherence Summary */}
          <div className="transition-transform hover:scale-105 h-full">
            <SimpleAdherenceSummary 
              taken={todayStats.taken} 
              total={todayStats.total}
              period="Hoje"
            />
          </div>
          
          {/* Health Insights - Compact */}
          <div className="transition-transform hover:scale-105 h-full">
            <HealthInsightsCard />
          </div>
          
          {/* Quick Dose Widget - Compact */}
          <div className="transition-transform hover:scale-105 h-full">
            <QuickDoseWidget />
          </div>
        </div>

        {/* Essential Shortcuts - Compact */}
        <div className="mb-4">
          <EssentialShortcuts />
        </div>

        {/* Two Column Layout: Calendar + Timeline */}
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          {/* Calendar - Compact */}
          <div className="transition-transform hover:scale-[1.02]">
            <ImprovedCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              eventCounts={eventCounts}
            />
          </div>

          {/* Timeline - Compact */}
          <div className="transition-transform hover:scale-[1.02]">
            <DayTimeline 
              date={selectedDate}
              items={timelineItems}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>

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
