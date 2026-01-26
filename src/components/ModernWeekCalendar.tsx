import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Locale } from "date-fns";
import { 
  ChevronLeft,
  ChevronRight, 
  Calendar as CalendarIcon,
  Check,
  Clock,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay, 
  isToday, 
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  isPast
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface ModernWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  profileId?: string;
}

interface DayStats {
  total: number;
  taken: number;
  missed: number;
  pending: number;
}

// Animated progress ring component
const ProgressRing = ({ 
  progress, 
  size = 32, 
  strokeWidth = 3,
  isSelected = false 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  isSelected?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress === 100) return isSelected ? "stroke-primary-foreground" : "stroke-green-500";
    if (progress >= 50) return isSelected ? "stroke-primary-foreground/80" : "stroke-amber-500";
    return isSelected ? "stroke-primary-foreground/60" : "stroke-orange-500";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background ring */}
        <circle
          className={cn(
            "transition-colors",
            isSelected ? "stroke-primary-foreground/20" : "stroke-muted/50"
          )}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress ring */}
        <motion.circle
          className={cn("transition-colors", getColor())}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {progress === 100 ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <Check className={cn(
              "h-3.5 w-3.5",
              isSelected ? "text-primary-foreground" : "text-green-500"
            )} />
          </motion.div>
        ) : (
          <span className={cn(
            "text-[9px] font-bold",
            isSelected ? "text-primary-foreground" : "text-foreground"
          )}>
            {progress}
          </span>
        )}
      </div>
    </div>
  );
};

// Day card component with enhanced visuals
const DayCard = ({
  day,
  stats,
  isSelected,
  isDayToday,
  status,
  progress,
  dateLocale,
  onClick
}: {
  day: Date;
  stats: DayStats;
  isSelected: boolean;
  isDayToday: boolean;
  status: "complete" | "partial" | "missed" | "pending" | "empty";
  progress: number;
  dateLocale: Locale;
  onClick: () => void;
}) => {
  const hasEvents = stats.total > 0;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "min-h-[90px] md:min-h-[100px]",
        // Selected state - gradient background
        isSelected && "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25",
        // Today state (not selected)
        !isSelected && isDayToday && "bg-gradient-to-br from-primary/15 to-primary/5 ring-2 ring-primary/50",
        // Past with events
        !isSelected && !isDayToday && hasEvents && status === "complete" && "bg-gradient-to-br from-green-500/10 to-green-500/5",
        !isSelected && !isDayToday && hasEvents && status === "missed" && "bg-gradient-to-br from-destructive/10 to-destructive/5",
        !isSelected && !isDayToday && hasEvents && status === "partial" && "bg-gradient-to-br from-amber-500/10 to-amber-500/5",
        // Default hover
        !isSelected && !isDayToday && !hasEvents && "hover:bg-accent/50",
        !isSelected && hasEvents && "hover:shadow-md"
      )}
    >
      {/* Shimmer effect for today */}
      {isDayToday && !isSelected && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ overflow: "hidden" }}
        />
      )}
      
      {/* Day name */}
      <span className={cn(
        "text-[10px] font-semibold uppercase tracking-wider mb-1",
        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
      )}>
        {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
      </span>
      
      {/* Day number - larger and bolder */}
      <motion.span 
        className={cn(
          "text-xl md:text-2xl font-bold leading-none",
          isDayToday && !isSelected && "text-primary"
        )}
        initial={false}
        animate={{ scale: isSelected ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {format(day, "d")}
      </motion.span>

      {/* Status indicator with animations */}
      <div className="mt-2 h-8 flex items-center justify-center">
        {hasEvents && (
          <AnimatePresence mode="wait">
            {status === "complete" ? (
              <motion.div
                key="complete"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full",
                  isSelected ? "bg-primary-foreground/20" : "bg-green-500/20"
                )}
              >
                <Check className={cn(
                  "h-3.5 w-3.5",
                  isSelected ? "text-primary-foreground" : "text-green-600"
                )} />
              </motion.div>
            ) : status === "missed" ? (
              <motion.div
                key="missed"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full",
                  isSelected ? "bg-primary-foreground/20" : "bg-destructive/20"
                )}
              >
                <AlertCircle className={cn(
                  "h-3.5 w-3.5",
                  isSelected ? "text-primary-foreground" : "text-destructive"
                )} />
              </motion.div>
            ) : status === "partial" || status === "pending" ? (
              <motion.div
                key="progress"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <ProgressRing 
                  progress={progress} 
                  size={28} 
                  strokeWidth={3}
                  isSelected={isSelected}
                />
              </motion.div>
            ) : (
              <motion.div
                key="pending-icon"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-0.5"
              >
                <Clock className={cn(
                  "h-3 w-3",
                  isSelected ? "text-primary-foreground/60" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {stats.total}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute -bottom-1 left-1/2 h-1 w-6 rounded-full bg-primary-foreground/50"
          layoutId="selectedIndicator"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          style={{ x: "-50%" }}
        />
      )}
      
      {/* Today pulse effect */}
      {isDayToday && (
        <motion.div
          className="absolute -top-1 -right-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        </motion.div>
      )}
    </motion.button>
  );
};

export default function ModernWeekCalendar({ 
  selectedDate, 
  onDateSelect,
  profileId
}: ModernWeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));
  const [direction, setDirection] = useState(0);
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch dose stats for the week
  const { data: weekStats = {} } = useQuery({
    queryKey: ["week-dose-stats", format(weekStart, "yyyy-MM-dd"), profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const weekEnd = addDays(weekStart, 6);

      let itemsQuery = supabase.from("items").select("id").eq("user_id", user.id);
      if (profileId) {
        itemsQuery = itemsQuery.eq("profile_id", profileId);
      }

      const { data: items } = await itemsQuery;
      const itemIds = items?.map(item => item.id) || [];
      if (itemIds.length === 0) return {};

      const { data: doses } = await supabase
        .from("dose_instances")
        .select("id, due_at, status")
        .in("item_id", itemIds)
        .gte("due_at", startOfDay(weekStart).toISOString())
        .lte("due_at", endOfDay(weekEnd).toISOString());

      if (!doses) return {};

      const stats: Record<string, DayStats> = {};
      
      doses.forEach((dose) => {
        const dayKey = format(new Date(dose.due_at), "yyyy-MM-dd");
        if (!stats[dayKey]) {
          stats[dayKey] = { total: 0, taken: 0, missed: 0, pending: 0 };
        }
        stats[dayKey].total++;
        
        if (dose.status === "taken") {
          stats[dayKey].taken++;
        } else if (dose.status === "missed") {
          stats[dayKey].missed++;
        } else if (dose.status === "skipped") {
          stats[dayKey].taken++;
        } else {
          stats[dayKey].pending++;
        }
      });

      return stats;
    },
    staleTime: 30000,
  });

  const getDayStats = (date: Date): DayStats => {
    const key = format(date, "yyyy-MM-dd");
    return weekStats[key] || { total: 0, taken: 0, missed: 0, pending: 0 };
  };

  const goToPrevious = () => {
    setDirection(-1);
    setWeekStart(subWeeks(weekStart, 1));
  };

  const goToNext = () => {
    setDirection(1);
    setWeekStart(addWeeks(weekStart, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onDateSelect(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  useEffect(() => {
    const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    if (!isSameDay(newWeekStart, weekStart)) {
      setWeekStart(newWeekStart);
    }
  }, [selectedDate]);

  const getProgressPercentage = (stats: DayStats): number => {
    if (stats.total === 0) return 0;
    return Math.round((stats.taken / stats.total) * 100);
  };

  const getDayStatus = (date: Date, stats: DayStats): "complete" | "partial" | "missed" | "pending" | "empty" => {
    if (stats.total === 0) return "empty";
    
    const progress = getProgressPercentage(stats);
    const dayIsPast = isPast(endOfDay(date)) && !isToday(date);
    
    if (progress === 100) return "complete";
    if (dayIsPast && stats.missed > 0) return "missed";
    if (progress > 0) return "partial";
    if (dayIsPast) return "missed";
    return "pending";
  };

  // Calculate weekly stats for header display
  const weeklyStats = weekDays.reduce((acc, day) => {
    const stats = getDayStats(day);
    return {
      total: acc.total + stats.total,
      taken: acc.taken + stats.taken
    };
  }, { total: 0, taken: 0 });
  
  const weeklyProgress = weeklyStats.total > 0 
    ? Math.round((weeklyStats.taken / weeklyStats.total) * 100) 
    : 0;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-3xl border shadow-lg shadow-black/5 overflow-hidden backdrop-blur-sm">
      {/* Header - Enhanced */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPrevious}
            className="h-9 w-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm border transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          
          <motion.div 
            key={format(weekStart, "yyyy-MM")}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-[120px] text-center"
          >
            <h4 className="text-sm font-bold capitalize">
              {format(weekStart, "MMMM", { locale: dateLocale })}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {format(weekStart, "yyyy")}
            </p>
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNext}
            className="h-9 w-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm border transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Weekly progress indicator */}
          {weeklyStats.total > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border shadow-sm"
            >
              <ProgressRing progress={weeklyProgress} size={20} strokeWidth={2} />
              <span className="text-xs font-medium">
                {weeklyStats.taken}/{weeklyStats.total}
              </span>
            </motion.div>
          )}
          
          {!isToday(selectedDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-full px-3"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {t('calendar.today')}
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-9 w-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm border transition-colors"
              >
                <CalendarIcon className="h-4 w-4" />
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    handleDateClick(date);
                    setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
                  }
                }}
                locale={dateLocale}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Week days - Enhanced grid */}
      <div className="p-3 md:p-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={format(weekStart, "yyyy-MM-dd")}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="grid grid-cols-7 gap-1.5 md:gap-2"
          >
            {weekDays.map((day) => {
              const stats = getDayStats(day);
              const isDayToday = isToday(day);
              const isSelected = isSameDay(day, selectedDate);
              const status = getDayStatus(day, stats);
              const progress = getProgressPercentage(stats);

              return (
                <DayCard
                  key={day.toISOString()}
                  day={day}
                  stats={stats}
                  isSelected={isSelected}
                  isDayToday={isDayToday}
                  status={status}
                  progress={progress}
                  dateLocale={dateLocale}
                  onClick={() => handleDateClick(day)}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend - More compact and modern */}
      <div className="flex items-center justify-center gap-3 md:gap-5 px-4 py-2.5 border-t bg-gradient-to-r from-muted/20 via-transparent to-muted/20">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-2.5 w-2.5 text-green-600" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {language === 'pt' ? 'Completo' : 'Complete'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ProgressRing progress={75} size={16} strokeWidth={2} />
          <span className="text-[10px] font-medium text-muted-foreground">
            {language === 'pt' ? 'Parcial' : 'Partial'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">
            {language === 'pt' ? 'Pendente' : 'Pending'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="h-2.5 w-2.5 text-destructive" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {language === 'pt' ? 'Perdido' : 'Missed'}
          </span>
        </div>
      </div>
    </div>
  );
}
