import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Pill, XCircle, SkipForward } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import DoseStatusDialog from "@/components/DoseStatusDialog";
import logo from "@/assets/horamend-logo.png";

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
  const [selectedDose, setSelectedDose] = useState<{ id: string; name: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchWeekDoses();
  }, [currentWeekStart]);

  useEffect(() => {
    // Mark past scheduled doses as missed automatically
    markPastDosesAsMissed();
  }, [doses]);

  const markPastDosesAsMissed = async () => {
    try {
      const now = new Date();
      const pastScheduledDoses = doses.filter(
        (dose) => dose.status === 'scheduled' && isBefore(parseISO(dose.due_at), now)
      );

      if (pastScheduledDoses.length > 0) {
        const doseIds = pastScheduledDoses.map((d) => d.id);
        await supabase
          .from("dose_instances")
          .update({ status: 'missed' })
          .in('id', doseIds);
        
        // Refresh data
        fetchWeekDoses();
      }
    } catch (error) {
      console.error("Error marking past doses as missed:", error);
    }
  };

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

  const handleDoseClick = (doseId: string, doseName: string) => {
    setSelectedDose({ id: doseId, name: doseName });
    setDialogOpen(true);
  };

  const updateDoseStatus = async (doseId: string, newStatus: 'taken' | 'missed' | 'skipped') => {
    try {
      const updateData: any = { status: newStatus };
      
      const dose = doses.find(d => d.id === doseId);
      if (!dose) return;

      if (newStatus === 'taken') {
        updateData.taken_at = new Date().toISOString();
        
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
      } else {
        updateData.taken_at = null;
      }

      const { error } = await supabase
        .from("dose_instances")
        .update(updateData)
        .eq("id", doseId);

      if (error) throw error;
      
      const statusText = newStatus === 'taken' ? 'tomada' : newStatus === 'missed' ? 'esquecida' : 'pulada';
      toast.success(`Dose marcada como ${statusText}! ${newStatus === 'taken' ? '💚' : ''}`);
      fetchWeekDoses();
    } catch (error) {
      console.error("Error updating dose status:", error);
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
          <div className="flex items-center gap-3">
            <img src={logo} alt="HoraMed" className="h-10 w-auto" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Calendário</h2>
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

          <Card className="p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Legenda</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary"></div>
                <span className="text-sm text-muted-foreground">Tomado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive"></div>
                <span className="text-sm text-muted-foreground">Esquecido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted"></div>
                <span className="text-sm text-muted-foreground">Pulado</span>
              </div>
            </div>
          </Card>

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
                          <button
                            key={dose.id}
                            onClick={() => handleDoseClick(dose.id, dose.items.name)}
                            className={`w-full p-2 rounded-lg border text-left transition-all hover:scale-105 ${
                              dose.status === "taken"
                                ? "bg-primary/10 border-primary/20"
                                : dose.status === "missed"
                                ? "bg-destructive/10 border-destructive/20"
                                : dose.status === "skipped"
                                ? "bg-muted border-muted"
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
                              {dose.status === "taken" && (
                                <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                              )}
                              {dose.status === "missed" && (
                                <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                              )}
                              {dose.status === "skipped" && (
                                <SkipForward className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              )}
                              {dose.status === "scheduled" && (
                                <Circle className="h-3 w-3 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </button>
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
      
      {selectedDose && (
        <DoseStatusDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          doseName={selectedDose.name}
          onSelectStatus={(status) => updateDoseStatus(selectedDose.id, status)}
        />
      )}
    </>
  );
}