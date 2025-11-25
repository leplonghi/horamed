import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon 
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
  addMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ImprovedCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  eventCounts?: Record<string, number>;
}

type ViewMode = "day" | "week" | "month";

export default function ImprovedCalendar({ 
  selectedDate, 
  onDateSelect,
  eventCounts = {}
}: ImprovedCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));
  const [monthDate, setMonthDate] = useState(selectedDate);

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

  const renderHeader = () => {
    let headerText = "";
    if (viewMode === "day") {
      headerText = format(selectedDate, "d 'de' MMMM", { locale: ptBR });
    } else if (viewMode === "week") {
      headerText = format(weekStart, "MMM yyyy", { locale: ptBR });
    } else {
      headerText = format(monthDate, "MMMM yyyy", { locale: ptBR });
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
              Hoje
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
                locale={ptBR}
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
            {format(selectedDate, "EEEE", { locale: ptBR })}
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
                {count} {count === 1 ? "evento" : "eventos"}
              </div>
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {isDayToday ? "Hoje" : format(selectedDate, "'Dia' d 'de' MMMM", { locale: ptBR })}
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
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                "hover:bg-accent hover:scale-105",
                isSelected && "bg-primary text-primary-foreground shadow-md",
                isDayToday && !isSelected && "ring-2 ring-primary"
              )}
            >
              <span className="text-xs font-medium uppercase opacity-70 mb-1">
                {format(day, "EEEEEE", { locale: ptBR })}
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
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="space-y-2">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
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
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "relative aspect-square p-2 rounded-lg transition-all",
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
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day" className="text-xs">Dia</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Header with Navigation */}
        {renderHeader()}

        {/* Content based on view mode */}
        <div className="min-h-[200px]">
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
        </div>
      </CardContent>
    </Card>
  );
}
