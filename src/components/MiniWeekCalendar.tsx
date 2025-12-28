import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, isBefore, startOfDay } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";

interface MiniWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  doseCounts?: Record<string, { total: number; completed: number }>;
}

export default function MiniWeekCalendar({
  selectedDate,
  onDateSelect,
  doseCounts: externalDoseCounts,
}: MiniWeekCalendarProps) {
  const { language } = useLanguage();
  const { activeProfile } = useUserProfiles();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [doseCounts, setDoseCounts] = useState<Record<string, { total: number; completed: number }>>(externalDoseCounts || {});
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (externalDoseCounts && Object.keys(externalDoseCounts).length > 0) {
      setDoseCounts(externalDoseCounts);
      return;
    }

    const loadDoseCounts = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let itemsQuery = supabase.from("items").select("id");
        if (activeProfile) itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
        const { data: items } = await itemsQuery;
        const itemIds = items?.map(i => i.id) || [];

        if (itemIds.length === 0) {
          setDoseCounts({});
          return;
        }

        const weekEnd = addDays(weekStart, 7);
        const { data: doses } = await supabase
          .from("dose_instances")
          .select("due_at, status")
          .in("item_id", itemIds)
          .gte("due_at", weekStart.toISOString())
          .lt("due_at", weekEnd.toISOString());

        const counts: Record<string, { total: number; completed: number }> = {};
        doses?.forEach(dose => {
          const key = format(new Date(dose.due_at), "yyyy-MM-dd");
          if (!counts[key]) counts[key] = { total: 0, completed: 0 };
          counts[key].total++;
          if (dose.status === "taken") counts[key].completed++;
        });

        setDoseCounts(counts);
      } catch (error) {
        console.error("Error loading dose counts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDoseCounts();
  }, [weekStart, activeProfile?.id, externalDoseCounts]);

  const goToPreviousWeek = () => {
    setDirection(-1);
    setWeekStart(addWeeks(weekStart, -1));
  };
  
  const goToNextWeek = () => {
    setDirection(1);
    setWeekStart(addWeeks(weekStart, 1));
  };

  const getDayStatus = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const data = doseCounts[key];
    const isPast = isBefore(day, startOfDay(new Date()));
    const isDayToday = isToday(day);
    
    if (!data || data.total === 0) return "empty";
    if (data.completed === data.total) return "complete";
    if (data.completed > 0) return "partial";
    if (isPast && !isDayToday) return "missed";
    return "pending";
  };

  const getProgressPercent = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const data = doseCounts[key];
    if (!data || data.total === 0) return 0;
    return Math.round((data.completed / data.total) * 100);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-3 shadow-sm">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goToPreviousWeek}
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:bg-muted/80"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        
        <motion.span 
          key={weekStart.toISOString()}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-foreground"
        >
          {format(weekStart, "MMMM yyyy", { locale: dateLocale })}
        </motion.span>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goToNextWeek}
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:bg-muted/80"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </motion.button>
      </div>

      {/* Week Days Grid */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={weekStart.toISOString()}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-7 gap-1"
        >
          {weekDays.map((day, i) => {
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            const status = getDayStatus(day);
            const progress = getProgressPercent(day);
            const isPast = isBefore(day, startOfDay(new Date())) && !isDayToday;
            const key = format(day, "yyyy-MM-dd");
            const data = doseCounts[key];

            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "relative flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isSelected && "bg-primary shadow-lg shadow-primary/30",
                  isDayToday && !isSelected && "bg-primary/15 ring-2 ring-primary/40",
                  !isSelected && !isDayToday && "hover:bg-muted/70 active:bg-muted",
                  isPast && !isSelected && !isDayToday && "opacity-60"
                )}
              >
                {/* Day name */}
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
                </span>
                
                {/* Day number with progress ring */}
                <div className="relative mt-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                      isSelected && "text-primary-foreground",
                      isDayToday && !isSelected && "text-primary font-extrabold",
                      !isSelected && !isDayToday && "text-foreground"
                    )}
                  >
                    {/* Progress ring */}
                    {status !== "empty" && !isSelected && (
                      <svg className="absolute inset-0 w-8 h-8 transform -rotate-90">
                        <circle
                          cx="16" cy="16" r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-muted/40"
                        />
                        <motion.circle
                          cx="16" cy="16" r="14"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 88" }}
                          animate={{ strokeDasharray: `${(progress / 100) * 88} 88` }}
                          transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
                          className={cn(
                            status === "complete" && "stroke-emerald-500",
                            status === "partial" && "stroke-amber-500",
                            status === "pending" && "stroke-primary",
                            status === "missed" && "stroke-destructive"
                          )}
                        />
                      </svg>
                    )}
                    
                    {/* Content */}
                    {status === "complete" && !isSelected ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                      </motion.div>
                    ) : status === "missed" && !isSelected ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <span>{format(day, "d")}</span>
                    )}
                  </div>
                </div>

                {/* Dose count badge */}
                {data && data.total > 0 && !isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "text-[9px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full",
                      status === "complete" && "bg-emerald-500/15 text-emerald-600",
                      status === "partial" && "bg-amber-500/15 text-amber-600",
                      status === "pending" && "bg-primary/15 text-primary",
                      status === "missed" && "bg-destructive/15 text-destructive"
                    )}
                  >
                    {data.completed}/{data.total}
                  </motion.div>
                )}

                {/* Today indicator dot */}
                {isDayToday && !isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
