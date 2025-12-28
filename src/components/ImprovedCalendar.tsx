import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Pill
} from "lucide-react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay, 
  isToday, 
  addWeeks, 
  startOfMonth, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval,
  subWeeks,
  subMonths,
  addMonths,
  startOfDay,
  endOfDay
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImprovedCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  eventCounts?: Record<string, number>;
  profileId?: string;
}

type ViewMode = "day" | "week" | "month";

interface DosePreview {
  time: string;
  medication: string;
  status: string;
}

export default function ImprovedCalendar({ 
  selectedDate, 
  onDateSelect,
  eventCounts = {},
  profileId
}: ImprovedCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));
  const [monthDate, setMonthDate] = useState(selectedDate);
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventCount = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return eventCounts[key] || 0;
  };

  const goToPrevious = () => {
    if (viewMode === "day") {
      const newDate = addDays(selectedDate, -1);
      onDateSelect(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else if (viewMode === "week") {
      setWeekStart(subWeeks(weekStart, 1));
    } else {
      setMonthDate(subMonths(monthDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "day") {
      const newDate = addDays(selectedDate, 1);
      onDateSelect(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else if (viewMode === "week") {
      setWeekStart(addWeeks(weekStart, 1));
    } else {
      setMonthDate(addMonths(monthDate, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    onDateSelect(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
    setMonthDate(today);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
    setMonthDate(date);
  };

  // Hook to fetch dose previews for a specific date
  const useDosePreview = (date: Date) => {
    return useQuery({
      queryKey: ["dose-preview", format(date, "yyyy-MM-dd"), profileId],
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        // Get items for the profile
        let itemsQuery = supabase
          .from("items")
          .select("id");

        if (profileId) {
          itemsQuery = itemsQuery.eq("profile_id", profileId);
        }

        const { data: profileItems } = await itemsQuery;
        const itemIds = profileItems?.map(item => item.id) || [];

        if (itemIds.length === 0) return [];

        // Get doses for the day
        const { data: doses } = await supabase
          .from("dose_instances")
          .select(`
            id,
            due_at,
            status,
            items (name)
          `)
          .in("item_id", itemIds)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString())
          .order("due_at", { ascending: true })
          .limit(5);

        if (!doses) return [];

        return doses.map((dose: any) => ({
          time: format(new Date(dose.due_at), "HH:mm"),
          medication: dose.items.name,
          status: dose.status
        })) as DosePreview[];
      },
      enabled: eventCounts[format(date, "yyyy-MM-dd")] > 0,
      staleTime: 30000, // Cache for 30 seconds
    });
  };

  // Component for dose preview
  const DosePreviewCard = ({ date }: { date: Date }) => {
    const { data: doses, isLoading } = useDosePreview(date);
    const count = getEventCount(date);

    if (count === 0) return null;

    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="absolute inset-0 cursor-pointer" />
        </HoverCardTrigger>
      <HoverCardContent className="w-64 p-3" side="top" align="center">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {format(date, "d 'de' MMMM", { locale: dateLocale })}
              </h4>
              <span className="text-xs text-muted-foreground">
                {count} {count === 1 ? t('calendar.event') : t('calendar.events')}
              </span>
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : doses && doses.length > 0 ? (
              <div className="space-y-1.5">
                {doses.map((dose, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-xs",
                      dose.status === "taken" && "bg-green-500/10",
                      dose.status === "scheduled" && "bg-blue-500/10",
                      dose.status === "missed" && "bg-red-500/10"
                    )}
                  >
                    <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{dose.time}</span>
                    <Pill className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{dose.medication}</span>
                  </div>
                ))}
                {count > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{count - 5} {t('calendar.more')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('calendar.clickForDetails')}
              </p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderHeader = () => {
    let headerText = "";
    if (viewMode === "day") {
      headerText = format(selectedDate, "d 'de' MMMM", { locale: dateLocale });
    } else if (viewMode === "week") {
      headerText = format(weekStart, "MMM yyyy", { locale: dateLocale });
    } else {
      headerText = format(monthDate, "MMMM yyyy", { locale: dateLocale });
    }

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[140px] text-center capitalize">
            {headerText}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          {!isToday(selectedDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              {t('calendar.today')}
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) handleDateClick(date);
                }}
                locale={dateLocale}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const count = getEventCount(selectedDate);
    const isDayToday = isToday(selectedDate);

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div 
          className={cn(
            "relative flex flex-col items-center justify-center",
            "w-32 h-32 rounded-2xl transition-all",
            isDayToday ? "bg-primary text-primary-foreground shadow-lg" : "bg-accent"
          )}
        >
          <span className="text-sm font-medium uppercase opacity-70 mb-1">
            {format(selectedDate, "EEEE", { locale: dateLocale })}
          </span>
          <span className="text-5xl font-bold">
            {format(selectedDate, "d")}
          </span>
          {count > 0 && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                isDayToday ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
              )}>
                {count} {count === 1 ? t('calendar.event') : t('calendar.events')}
              </div>
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {isDayToday ? t('calendar.today') : format(selectedDate, "d 'de' MMMM", { locale: dateLocale })}
        </p>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const count = getEventCount(day);
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div key={day.toISOString()} className="relative">
              <button
                onClick={() => handleDateClick(day)}
                className={cn(
                  "w-full flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                  "hover:bg-accent hover:scale-105",
                  isSelected && "bg-primary text-primary-foreground shadow-md",
                  isDayToday && !isSelected && "ring-2 ring-primary"
                )}
              >
                <span className="text-xs font-medium uppercase opacity-70 mb-1">
                  {format(day, "EEEEEE", { locale: dateLocale })}
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  isDayToday && !isSelected && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {count > 0 && (
                  <div className={cn(
                    "mt-2 px-2 py-0.5 rounded-full text-xs font-medium",
                    isSelected 
                      ? "bg-primary-foreground/20 text-primary-foreground" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {count}
                  </div>
                )}
              </button>
              <DosePreviewCard date={day} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const weekdays = t('calendar.weekdays').split(',');
    return (
      <div className="space-y-2">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const count = getEventCount(day);
            const isCurrentMonth = day.getMonth() === monthDate.getMonth();
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div key={day.toISOString()} className="relative">
                <button
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "w-full aspect-square p-2 rounded-lg transition-all",
                    "hover:bg-accent hover:scale-105",
                    isSelected && "bg-primary text-primary-foreground shadow-md",
                    isDayToday && !isSelected && "ring-2 ring-primary",
                    !isCurrentMonth && "opacity-40"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isDayToday && !isSelected && "text-primary font-bold"
                  )}>
                    {format(day, "d")}
                  </span>
                  {count > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      )} />
                    </div>
                  )}
                </button>
                <DosePreviewCard date={day} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        {/* Compact Week Strip - default view */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h4 className="text-sm font-semibold capitalize">
            {format(weekStart, "MMM yyyy", { locale: dateLocale })}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week days - simplified */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const count = getEventCount(day);
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all",
                  "hover:bg-accent",
                  isSelected && "bg-primary text-primary-foreground shadow-sm",
                  isDayToday && !isSelected && "ring-1 ring-primary"
                )}
              >
                <span className="text-[10px] font-medium uppercase opacity-70">
                  {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isDayToday && !isSelected && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {count > 0 && (
                  <div className={cn(
                    "mt-0.5 h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )} />
                )}
              </button>
            );
          })}
        </div>

        {/* Today button if not today selected */}
        {!isToday(selectedDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="w-full text-xs h-7"
          >
            Ir para hoje
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
