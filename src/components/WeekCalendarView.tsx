import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface WeekCalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  eventCounts?: Record<string, number>; // Format: "yyyy-MM-dd" -> count
}

export default function WeekCalendarView({ 
  selectedDate, 
  onDateSelect,
  eventCounts = {}
}: WeekCalendarViewProps) {
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));
  const [view, setView] = useState<"week" | "month">("week");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousWeek = () => {
    setWeekStart(addWeeks(weekStart, -1));
  };

  const goToNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
    onDateSelect(today);
  };

  const getEventCount = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return eventCounts[key] || 0;
  };

  if (view === "month") {
    return (
      <Card>
        <CardContent className="p-4">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("week")}
              >
                Ver Semana
              </Button>
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
                      if (date) {
                        onDateSelect(date);
                        setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
                      }
                    }}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Days */}
            {monthDays.map((day) => {
              const count = getEventCount(day);
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isDayToday = isToday(day);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    onDateSelect(day);
                    setWeekStart(startOfWeek(day, { weekStartsOn: 0 }));
                  }}
                  className={cn(
                    "relative aspect-square p-2 text-sm rounded-lg transition-colors",
                    "hover:bg-accent",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                    isDayToday && !isSelected && "bg-accent font-semibold",
                    !isCurrentMonth && "text-muted-foreground/50"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {count > 0 && (
                    <div className={cn(
                      "absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousWeek}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-semibold min-w-[200px] text-center">
              {format(weekStart, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextWeek}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("month")}
            >
              Ver Mês
            </Button>
          </div>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const count = getEventCount(day);
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg transition-all",
                  "hover:bg-accent hover:scale-105",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isDayToday && !isSelected && "bg-accent ring-2 ring-primary/20"
                )}
              >
                <span className="text-xs font-medium">
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  isDayToday && !isSelected && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {count > 0 && (
                  <Badge 
                    variant={isSelected ? "secondary" : "default"} 
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
