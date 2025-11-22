import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface DayProgress {
  date: Date;
  total: number;
  taken: number;
  rate: number;
}

export function MonthlyProgressCalendar({ profileId }: { profileId?: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayProgress | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: progressData = [] } = useQuery({
    queryKey: ["monthly-progress", format(monthStart, "yyyy-MM"), profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items!inner(user_id, profile_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", monthStart.toISOString())
        .lte("due_at", monthEnd.toISOString());

      if (profileId) {
        query = query.eq("items.profile_id", profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by day
      const dayMap = new Map<string, DayProgress>();
      
      data?.forEach((dose) => {
        const dayKey = format(new Date(dose.due_at), "yyyy-MM-dd");
        const existing = dayMap.get(dayKey) || {
          date: new Date(dose.due_at),
          total: 0,
          taken: 0,
          rate: 0,
        };

        existing.total++;
        if (dose.status === "taken") {
          existing.taken++;
        }
        existing.rate = existing.total > 0 ? (existing.taken / existing.total) * 100 : 0;

        dayMap.set(dayKey, existing);
      });

      return Array.from(dayMap.values());
    },
  });

  const getDayProgress = (date: Date): DayProgress | undefined => {
    return progressData.find((p) => isSameDay(p.date, date));
  };

  const getProgressColor = (rate: number): string => {
    if (rate >= 100) return "bg-green-500";
    if (rate >= 75) return "bg-blue-500";
    if (rate >= 50) return "bg-yellow-500";
    if (rate > 0) return "bg-orange-500";
    return "bg-red-500";
  };

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Empty cells for alignment */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const progress = getDayProgress(day);
            const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => progress && setSelectedDay(progress)}
                disabled={!progress || isFuture}
                className={cn(
                  "aspect-square rounded-lg border-2 p-2 transition-all relative",
                  "hover:border-primary disabled:cursor-default",
                  isToday && "border-primary",
                  !progress && !isFuture && "border-muted",
                  progress && !isFuture && "cursor-pointer hover:scale-105",
                  selectedDay && isSameDay(selectedDay.date, day) && "ring-2 ring-primary"
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={cn(
                    "text-sm font-medium",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground",
                    isToday && "font-bold"
                  )}>
                    {format(day, "d")}
                  </span>
                  
                  {progress && !isFuture && (
                    <div className="mt-1 flex flex-col items-center gap-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getProgressColor(progress.rate)
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progress.rate)}%
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">75-99%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm">50-74%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm">1-49%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">0%</span>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">
              {format(selectedDay.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <div className="space-y-1 text-sm">
              <p>Total de doses: {selectedDay.total}</p>
              <p>Doses tomadas: {selectedDay.taken}</p>
              <p className="font-medium">
                Progresso: {Math.round(selectedDay.rate)}%
              </p>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}
