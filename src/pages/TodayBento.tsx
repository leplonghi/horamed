import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import DockNavigation from "@/components/ui/dock-navigation";
import ModernHeader from "@/components/ui/modern-header";
import {
  BentoGrid,
  BentoCard,
  BentoHeader,
  BentoValue,
  BentoProgress,
} from "@/components/ui/bento-grid";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOverdueDoses } from "@/hooks/useOverdueDoses";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Pill,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";
import DayTimeline from "@/components/DayTimeline";
import ModernWeekCalendar from "@/components/ModernWeekCalendar";

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

// Streak Widget
const StreakWidget = memo(function StreakWidget({
  streak,
  language,
}: {
  streak: number;
  language: string;
}) {
  return (
    <BentoCard variant="highlight" size={1} delay={0}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="p-2 rounded-xl bg-orange-500/20"
          >
            <Flame className="h-5 w-5 text-orange-500" />
          </motion.div>
          <span className="text-xs text-muted-foreground font-medium">
            {language === "pt" ? "Sequência" : "Streak"}
          </span>
        </div>
        <div className="mt-auto">
          <span className="text-4xl font-bold text-foreground">{streak}</span>
          <p className="text-xs text-muted-foreground">
            {language === "pt" ? "dias seguidos" : "days in a row"}
          </p>
        </div>
      </div>
    </BentoCard>
  );
});

// Progress Widget
const ProgressWidget = memo(function ProgressWidget({
  taken,
  total,
  language,
}: {
  taken: number;
  total: number;
  language: string;
}) {
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
  const isComplete = taken === total && total > 0;

  return (
    <BentoCard
      variant={isComplete ? "gradient" : "default"}
      size={1}
      delay={1}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-2 rounded-xl",
              isComplete ? "bg-success/20" : "bg-primary/10"
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Target className="h-5 w-5 text-primary" />
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {language === "pt" ? "Hoje" : "Today"}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-bold text-foreground">{taken}</span>
            <span className="text-lg text-muted-foreground mb-1">/{total}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "h-full rounded-full",
                isComplete ? "bg-success" : "bg-primary"
              )}
            />
          </div>
        </div>
      </div>
    </BentoCard>
  );
});

// Overdue Alert Widget
const OverdueWidget = memo(function OverdueWidget({
  count,
  language,
  onClick,
}: {
  count: number;
  language: string;
  onClick: () => void;
}) {
  if (count === 0) return null;

  return (
    <BentoCard variant="default" size={2} delay={2} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="p-3 rounded-2xl bg-destructive/10"
          >
            <AlertCircle className="h-6 w-6 text-destructive" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">
              {count} {language === "pt" ? "dose" : "dose"}
              {count > 1 ? "s" : ""}{" "}
              {language === "pt" ? "atrasada" : "overdue"}
              {count > 1 ? "s" : ""}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "pt" ? "Toque para ver" : "Tap to view"}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </BentoCard>
  );
});

// Quick Actions Widget
const QuickActionsWidget = memo(function QuickActionsWidget({
  language,
  onNavigate,
}: {
  language: string;
  onNavigate: (path: string) => void;
}) {
  const actions = [
    {
      icon: Pill,
      label: language === "pt" ? "Medicamentos" : "Medications",
      path: "/medicamentos",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: FileText,
      label: language === "pt" ? "Documentos" : "Documents",
      path: "/carteira",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: TrendingUp,
      label: language === "pt" ? "Progresso" : "Progress",
      path: "/progresso",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: Calendar,
      label: language === "pt" ? "Agenda" : "Schedule",
      path: "/agenda",
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  return (
    <BentoCard variant="glass" size={2} delay={3}>
      <BentoHeader
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        title={language === "pt" ? "Atalhos" : "Quick Access"}
      />
      <div className="grid grid-cols-4 gap-2 mt-3">
        {actions.map((action) => (
          <motion.button
            key={action.path}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(action.path)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className={cn("p-2.5 rounded-xl", action.color)}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </BentoCard>
  );
});

// Next Dose Widget
const NextDoseWidget = memo(function NextDoseWidget({
  dose,
  language,
}: {
  dose: TimelineItem | null;
  language: string;
}) {
  if (!dose) {
    return (
      <BentoCard variant="default" size={2} delay={4}>
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === "pt"
                ? "Tudo certo por hoje! 🎉"
                : "All done for today! 🎉"}
            </p>
          </div>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard variant="gradient" size={2} delay={4}>
      <BentoHeader
        icon={<Clock className="h-4 w-4 text-primary" />}
        title={language === "pt" ? "Próxima dose" : "Next dose"}
        subtitle={dose.time}
      />
      <div className="mt-3">
        <h4 className="text-lg font-semibold text-foreground">{dose.title}</h4>
        {dose.subtitle && (
          <p className="text-sm text-muted-foreground">{dose.subtitle}</p>
        )}
      </div>
      {dose.onMarkDone && (
        <Button
          onClick={dose.onMarkDone}
          className="w-full mt-4 rounded-xl"
          size="lg"
        >
          {language === "pt" ? "Marcar como tomado" : "Mark as taken"}
        </Button>
      )}
    </BentoCard>
  );
});

export default function TodayBento() {
  const navigate = useNavigate();
  const { scheduleNotificationsForNextDay } = useMedicationAlarm();
  const streakData = useStreakCalculator();
  const { activeProfile } = useUserProfiles();
  const { language } = useLanguage();
  const { overdueDoses } = useOverdueDoses();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ total: 0, taken: 0 });

  // Find next pending dose
  const nextPendingDose = useMemo(() => {
    const now = format(new Date(), "HH:mm");
    return (
      timelineItems.find(
        (item) => item.status === "pending" && item.time >= now
      ) || null
    );
  }, [timelineItems]);

  // Load data
  const loadData = useCallback(
    async (date: Date) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setLoading(true);

        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        // Get profile items
        let itemsQuery = supabase.from("items").select("id");
        if (activeProfile) {
          itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
        }
        const { data: profileItems } = await itemsQuery;
        const itemIds = profileItems?.map((item) => item.id) || [];

        // Get doses
        let doses = [];
        if (itemIds.length > 0) {
          const { data: dosesData } = await supabase
            .from("dose_instances")
            .select(
              `id, due_at, status, item_id, items (name, dose_text, with_food, category)`
            )
            .in("item_id", itemIds)
            .gte("due_at", dayStart.toISOString())
            .lte("due_at", dayEnd.toISOString())
            .order("due_at", { ascending: true });
          doses = dosesData || [];
        }

        // Build timeline
        const items: TimelineItem[] = doses.map((dose: any) => ({
          id: dose.id,
          time: format(new Date(dose.due_at), "HH:mm"),
          type: "medication" as const,
          title: dose.items.name,
          subtitle: dose.items.dose_text || undefined,
          status:
            dose.status === "taken"
              ? "done"
              : dose.status === "missed"
              ? "missed"
              : "pending",
          itemId: dose.item_id,
        }));

        setTimelineItems(items);

        // Update stats
        const isToday =
          format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
        if (isToday) {
          setTodayStats({
            total: doses.length,
            taken: doses.filter((d: any) => d.status === "taken").length,
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(
          language === "pt" ? "Erro ao carregar dados" : "Error loading data"
        );
      } finally {
        setLoading(false);
      }
    },
    [activeProfile?.id, language]
  );

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />

      <main className="pt-20 pb-24 px-4 max-w-4xl mx-auto space-y-6">
        {/* Week Calendar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ModernWeekCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateChange}
            profileId={activeProfile?.id}
          />
        </motion.div>

        {/* Bento Grid Stats */}
        <BentoGrid>
          <StreakWidget
            streak={streakData?.currentStreak || 0}
            language={language}
          />
          <ProgressWidget
            taken={todayStats.taken}
            total={todayStats.total}
            language={language}
          />

          {/* Show overdue alert if any */}
          {overdueDoses.length > 0 && (
            <OverdueWidget
              count={overdueDoses.length}
              language={language}
              onClick={() => {
                const banner = document.getElementById("timeline-section");
                banner?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          )}

          <QuickActionsWidget language={language} onNavigate={navigate} />

          <NextDoseWidget dose={nextPendingDose} language={language} />
        </BentoGrid>

        {/* Timeline Section */}
        <motion.div
          id="timeline-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 rounded-3xl border border-border/50">
            <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {language === "pt" ? "Cronograma" : "Schedule"}
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-muted/50 animate-pulse"
                  />
                ))}
              </div>
            ) : timelineItems.length > 0 ? (
              <DayTimeline
                date={selectedDate}
                items={timelineItems}
                onDateChange={handleDateChange}
              />
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {language === "pt"
                    ? "Nenhuma dose agendada para este dia"
                    : "No doses scheduled for this day"}
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </main>

      <DockNavigation />
    </div>
  );
}
