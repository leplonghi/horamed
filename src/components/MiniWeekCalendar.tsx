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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Load dose counts for the week
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

  const goToPreviousWeek = () => setWeekStart(addWeeks(weekStart, -1));
  const goToNextWeek = () => setWeekStart(addWeeks(weekStart, 1));

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

  return (
    <div className="relative">
      {/* Navigation Header - Minimal */}
      <div className="flex items-center justify-between mb-3 px-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goToPreviousWeek}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors active:bg-muted"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </motion.button>
        
        <span className="text-sm font-semibold text-foreground">
          {format(weekStart, "MMM yyyy", { locale: dateLocale })}
        </span>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goToNextWeek}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors active:bg-muted"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Compact Week Strip */}
      <div className="flex justify-between gap-1">
        {weekDays.map((day, i) => {
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          const status = getDayStatus(day);
          const progress = getProgressPercent(day);
          const isPast = isBefore(day, startOfDay(new Date())) && !isDayToday;
          const key = format(day, "yyyy-MM-dd");
          const data = doseCounts[key];

          const statusColors = {
            complete: "bg-emerald-500",
            partial: "bg-amber-500",
            missed: "bg-destructive",
            pending: "bg-primary/50",
            empty: "bg-transparent"
          };

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDateSelect(day)}
              className={cn(
                "flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-150",
                "focus:outline-none active:scale-95",
                isSelected && "bg-primary shadow-md shadow-primary/25",
                isDayToday && !isSelected && "bg-primary/10 ring-1 ring-primary/30",
                !isSelected && !isDayToday && "hover:bg-muted/50 active:bg-muted",
                isPast && !isSelected && !isDayToday && "opacity-50"
              )}
            >
              {/* Day name */}
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase mb-0.5",
                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
              </span>
              
              {/* Day number with status ring */}
              <div className="relative">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-base transition-all",
                    isSelected && "text-primary-foreground",
                    isDayToday && !isSelected && "text-primary",
                    !isSelected && !isDayToday && "text-foreground"
                  )}
                >
                  {/* Progress ring background */}
                  {status !== "empty" && !isSelected && (
                    <svg className="absolute inset-0 w-9 h-9 transform -rotate-90">
                      <circle
                        cx="18" cy="18" r="16"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        className="text-muted/30"
                      />
                      <motion.circle
                        cx="18" cy="18" r="16"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 100.53" }}
                        animate={{ strokeDasharray: `${(progress / 100) * 100.53} 100.53` }}
                        transition={{ duration: 0.4, delay: i * 0.03 }}
                        className={cn(
                          status === "complete" && "stroke-emerald-500",
                          status === "partial" && "stroke-amber-500",
                          status === "pending" && "stroke-primary",
                          status === "missed" && "stroke-destructive"
                        )}
                      />
                    </svg>
                  )}
                  
                  {/* Status icon for complete/missed */}
                  {status === "complete" && !isSelected ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : status === "missed" && !isSelected ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <span>{format(day, "d")}</span>
                  )}
                </div>

                {/* Today dot indicator */}
                {isDayToday && !isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                  />
                )}
              </div>

              {/* Mini dose indicator */}
              {data && data.total > 0 && !isSelected && status !== "complete" && status !== "missed" && (
                <div className={cn(
                  "mt-1 w-1.5 h-1.5 rounded-full",
                  statusColors[status]
                )} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-xl"
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
