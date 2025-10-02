import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

interface DoseInstance {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  items: {
    name: string;
  };
}

export default function WeeklyCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekDoses();
  }, [currentWeekStart]);

  const fetchWeekDoses = async () => {
    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

      const { data, error } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items (name)
        `)
        .gte("due_at", currentWeekStart.toISOString())
        .lte("due_at", weekEnd.toISOString())
        .order("due_at", { ascending: true });

      if (error) throw error;
      setDoses(data || []);
    } catch (error) {
      console.error("Error fetching week doses:", error);
      toast.error("Erro ao carregar doses da semana");
    } finally {
      setLoading(false);
    }
  };

  const toggleDoseStatus = async (doseId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "taken" ? "scheduled" : "taken";
      const updateData: any = { status: newStatus };
      
      if (newStatus === "taken") {
        updateData.taken_at = new Date().toISOString();
        
        const dose = doses.find(d => d.id === doseId);
        if (dose) {
          const { data: stockData } = await supabase
            .from("stock")
            .select("units_left")
            .eq("item_id", dose.item_id)
            .single();

          if (stockData && stockData.units_left > 0) {
            await supabase
              .from("stock")
              .update({ units_left: stockData.units_left - 1 })
              .eq("item_id", dose.item_id);
          }
        }
      } else {
        updateData.taken_at = null;
        
        const dose = doses.find(d => d.id === doseId);
        if (dose) {
          const { data: stockData } = await supabase
            .from("stock")
            .select("units_left, units_total")
            .eq("item_id", dose.item_id)
            .single();

          if (stockData && stockData.units_left < stockData.units_total) {
            await supabase
              .from("stock")
              .update({ units_left: stockData.units_left + 1 })
              .eq("item_id", dose.item_id);
          }
        }
      }

      const { error } = await supabase
        .from("dose_instances")
        .update(updateData)
        .eq("id", doseId);

      if (error) throw error;
      
      toast.success(newStatus === "taken" ? "Dose marcada como tomada! 💚" : "Dose desmarcada");
      fetchWeekDoses();
    } catch (error) {
      console.error("Error toggling dose status:", error);
      toast.error("Erro ao atualizar status da dose");
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary">MedTracker</h1>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Calendário 📅</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayDoses = doses.filter((dose) =>
                isSameDay(parseISO(dose.due_at), day)
              );
              const isToday = isSameDay(day, new Date());

              return (
                <Card
                  key={day.toISOString()}
                  className={`p-3 ${
                    isToday ? "border-primary border-2 bg-primary/5" : ""
                  }`}
                >
                  <div className="space-y-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className={`text-xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d")}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      {dayDoses.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Sem doses
                        </p>
                      ) : (
                        dayDoses.map((dose) => (
                          <div
                            key={dose.id}
                            className={`p-2 rounded-lg border ${
                              dose.status === "taken"
                                ? "bg-success/10 border-success/20"
                                : "bg-card border-border"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {dose.items.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(dose.due_at), "HH:mm")}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 flex-shrink-0"
                                onClick={() => toggleDoseStatus(dose.id, dose.status)}
                              >
                                {dose.status === "taken" ? (
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                ) : (
                                  <Circle className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <Navigation />
    </>
  );
}