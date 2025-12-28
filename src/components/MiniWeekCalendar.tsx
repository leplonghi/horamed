import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface MiniWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  doseCounts?: Record<string, { total: number; completed: number }>;
}

export default function MiniWeekCalendar({
  selectedDate,
  onDateSelect,
  doseCounts = {},
}: MiniWeekCalendarProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => setWeekStart(addWeeks(weekStart, -1));
  const goToNextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
    onDateSelect(today);
  };

  const getDayStatus = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const data = doseCounts[key];
    if (!data || data.total === 0) return "empty";
    if (data.completed === data.total) return "complete";
    if (data.completed > 0) return "partial";
    return "pending";
  };

  const showTodayButton = !weekDays.some((d) => isToday(d));

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl p-3 border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPreviousWeek}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs font-semibold text-foreground min-w-[80px] text-center capitalize">
            {format(weekStart, "MMM yyyy", { locale: dateLocale })}
          </span>
          <button
            onClick={goToNextWeek}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {showTodayButton && (
          <button
            onClick={goToToday}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
          >
            <Calendar className="w-3 h-3" />
            {language === 'pt' ? 'Hoje' : 'Today'}
          </button>
        )}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, i) => {
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          const status = getDayStatus(day);

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onDateSelect(day)}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-xl transition-all",
                "hover:bg-muted/50 active:scale-95",
                isSelected && "bg-primary text-primary-foreground shadow-md shadow-primary/20",
                isDayToday && !isSelected && "ring-2 ring-primary/50 bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "text-[9px] font-medium uppercase mb-0.5",
                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  isDayToday && !isSelected && "text-primary"
                )}
              >
                {format(day, "d")}
              </span>
              {/* Status indicator */}
              <div className="h-1.5 w-1.5 mt-1 rounded-full">
                {status === "complete" && (
                  <div className={cn(
                    "h-full w-full rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-success"
                  )} />
                )}
                {status === "partial" && (
                  <div className={cn(
                    "h-full w-full rounded-full",
                    isSelected ? "bg-primary-foreground/70" : "bg-amber-500"
                  )} />
                )}
                {status === "pending" && (
                  <div className={cn(
                    "h-full w-full rounded-full",
                    isSelected ? "bg-primary-foreground/50" : "bg-muted-foreground/40"
                  )} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[9px] text-muted-foreground">{language === 'pt' ? 'Completo' : 'Complete'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[9px] text-muted-foreground">{language === 'pt' ? 'Parcial' : 'Partial'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
          <span className="text-[9px] text-muted-foreground">{language === 'pt' ? 'Pendente' : 'Pending'}</span>
        </div>
      </div>
    </motion.div>
  );
}
