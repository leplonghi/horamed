import { useState, useEffect } from "react";
import { decrementStockWithProjection } from "@/lib/stockHelpers";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Pill, XCircle, SkipForward, TrendingUp, Calendar, Target } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import DoseStatusDialog from "@/components/DoseStatusDialog";
import logo from "@/assets/horamed-logo-optimized.webp";
import { useUserProfiles } from "@/hooks/useUserProfiles";

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
  const { activeProfile } = useUserProfiles();

  useEffect(() => {
    fetchWeekDoses();
  }, [currentWeekStart]);

  // Reload data when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      fetchWeekDoses();
    }
  }, [activeProfile?.id]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

      let dosesQuery = supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items!inner (name, user_id, profile_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", currentWeekStart.toISOString())
        .lte("due_at", weekEnd.toISOString());

      if (activeProfile) {
        dosesQuery = dosesQuery.eq("items.profile_id", activeProfile.id);
      }

      const { data, error } = await dosesQuery.order("due_at", { ascending: true });

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
        
        // Decrement stock with projection recalculation
        await decrementStockWithProjection(dose.item_id);
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

  // Calculate weekly stats
  const totalWeekDoses = doses.length;
  const takenDoses = doses.filter(d => d.status === 'taken').length;
  const missedDoses = doses.filter(d => d.status === 'missed').length;
  const skippedDoses = doses.filter(d => d.status === 'skipped').length;
  const weeklyAdherence = totalWeekDoses > 0 ? Math.round((takenDoses / totalWeekDoses) * 100) : 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with Logo and Title */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="HoraMed" className="h-12 w-auto drop-shadow-md" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Calendário Semanal</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {format(currentWeekStart, "d MMM", { locale: ptBR })} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), "d MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousWeek}
                className="hover:scale-105 transition-transform"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextWeek}
                className="hover:scale-105 transition-transform"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Weekly Stats - Enhanced */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Adesao</p>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{weeklyAdherence}%</p>
                <div className="w-full bg-primary/20 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-500"
                    style={{ width: `${weeklyAdherence}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-success uppercase tracking-wide">Tomadas</p>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-foreground">{takenDoses}</p>
                <p className="text-xs text-muted-foreground">de {totalWeekDoses} doses</p>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Esquecidas</p>
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-3xl font-bold text-foreground">{missedDoses}</p>
                <p className="text-xs text-muted-foreground">requer atencao</p>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-warning uppercase tracking-wide">Puladas</p>
                  <SkipForward className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-foreground">{skippedDoses}</p>
                <p className="text-xs text-muted-foreground">intencionalmente</p>
              </div>
            </Card>
          </div>

          <Card className="p-5 shadow-lg border-primary/20 bg-gradient-to-r from-card to-primary/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Legenda do Calendario</h3>
                  <p className="text-xs text-muted-foreground">Status das medicacoes</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-success/10 border-success/30 px-3 py-1.5 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-success" />
                  <span className="text-success font-medium">Tomado</span>
                </Badge>
                <Badge variant="outline" className="bg-destructive/10 border-destructive/30 px-3 py-1.5 shadow-sm">
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />
                  <span className="text-destructive font-medium">Esquecido</span>
                </Badge>
                <Badge variant="outline" className="bg-warning/10 border-warning/30 px-3 py-1.5 shadow-sm">
                  <SkipForward className="h-3.5 w-3.5 mr-1.5 text-warning" />
                  <span className="text-warning font-medium">Pulado</span>
                </Badge>
                <Badge variant="outline" className="bg-primary/10 border-primary/30 px-3 py-1.5 shadow-sm">
                  <Circle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  <span className="text-primary font-medium">Agendado</span>
                </Badge>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayDoses = doses.filter((dose) =>
                isSameDay(parseISO(dose.due_at), day)
              );
              const isToday = isSameDay(day, new Date());
              const takenToday = dayDoses.filter(d => d.status === 'taken').length;
              const adherenceToday = dayDoses.length > 0 ? (takenToday / dayDoses.length) * 100 : 0;

              return (
                <Card
                  key={day.toISOString()}
                  className={`p-4 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 ${
                    isToday 
                      ? "border-primary border-2 bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Day Header */}
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <div className={`text-3xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d")}
                      </div>
                      {isToday && (
                        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-[10px]">
                          Hoje
                        </Badge>
                      )}
                      
                      {/* Progress Indicator */}
                      {dayDoses.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                            <Target className="h-3.5 w-3.5 text-primary" />
                            <span className={takenToday === dayDoses.length ? "text-success" : "text-foreground"}>
                              {takenToday}/{dayDoses.length}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className={`rounded-full h-1.5 transition-all duration-500 ${
                                adherenceToday === 100 ? "bg-success" : adherenceToday >= 50 ? "bg-primary" : "bg-destructive"
                              }`}
                              style={{ width: `${adherenceToday}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Doses List */}
                    <div className="space-y-2">
                      {dayDoses.length === 0 ? (
                        <div className="text-center py-4 px-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Sem doses</p>
                        </div>
                      ) : (
                        dayDoses.map((dose) => (
                          <button
                            key={dose.id}
                            onClick={() => handleDoseClick(dose.id, dose.items.name)}
                            className={`w-full p-2.5 rounded-lg border text-left transition-all hover:scale-105 hover:shadow-md group ${
                              dose.status === "taken"
                                ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-sm"
                                : dose.status === "missed"
                                ? "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 shadow-sm"
                                : dose.status === "skipped"
                                ? "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30 shadow-sm"
                                : "bg-gradient-to-br from-primary/5 to-card border-primary/30 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate leading-tight">
                                  {dose.items.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <p className="text-xs text-muted-foreground font-medium">
                                    {format(parseISO(dose.due_at), "HH:mm")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {dose.status === "taken" && (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                )}
                                {dose.status === "missed" && (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                {dose.status === "skipped" && (
                                  <SkipForward className="h-4 w-4 text-warning" />
                                )}
                                {dose.status === "scheduled" && (
                                  <Circle className="h-4 w-4 text-primary" />
                                )}
                              </div>
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