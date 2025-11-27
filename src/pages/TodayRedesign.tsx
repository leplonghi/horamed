import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Pill, FileText, Calendar, CheckCircle2, 
  Clock, AlertCircle, TrendingUp, Package
} from "lucide-react";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import StreakBadge from "@/components/StreakBadge";
import SimpleDoseCard from "@/components/SimpleDoseCard";
import { cn } from "@/lib/utils";

interface Dose {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  taken_at: string | null;
  items: {
    name: string;
    dose_text: string | null;
    with_food: boolean | null;
  };
}

export default function TodayRedesign() {
  const navigate = useNavigate();
  const streakData = useStreakCalculator();
  const { activeProfile } = useUserProfiles();
  const { showFeedback } = useFeedbackToast();
  
  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [todayStats, setTodayStats] = useState({ total: 0, taken: 0, pending: 0, late: 0 });

  const loadDoses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dayStart = startOfDay(new Date());
      const dayEnd = endOfDay(new Date());

      // Get items for active profile
      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }

      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      if (itemIds.length === 0) {
        setDoses([]);
        setTodayStats({ total: 0, taken: 0, pending: 0, late: 0 });
        setLoading(false);
        return;
      }

      // Load today's doses
      const { data: dosesData } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          taken_at,
          items (name, dose_text, with_food)
        `)
        .in("item_id", itemIds)
        .gte("due_at", dayStart.toISOString())
        .lte("due_at", dayEnd.toISOString())
        .order("due_at", { ascending: true });

      setDoses(dosesData || []);

      // Calculate stats
      const total = dosesData?.length || 0;
      const taken = dosesData?.filter(d => d.status === "taken").length || 0;
      const now = new Date();
      const late = dosesData?.filter(d => 
        d.status === "scheduled" && new Date(d.due_at) < now
      ).length || 0;
      const pending = dosesData?.filter(d => 
        d.status === "scheduled" && new Date(d.due_at) >= now
      ).length || 0;

      setTodayStats({ total, taken, pending, late });
    } catch (error) {
      console.error("Error loading doses:", error);
      toast.error("Erro ao carregar doses");
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bom dia");
    else if (hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    loadDoses();
  }, [loadDoses]);

  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      loadDoses();
    }
  }, [activeProfile?.id]);

  const markAsTaken = async (doseId: string, itemId: string, itemName: string) => {
    try {
      // Check stock
      const { data: stockData } = await supabase
        .from("stock")
        .select("units_left")
        .eq("item_id", itemId)
        .single();

      if (stockData && stockData.units_left === 0) {
        toast.error("Estoque zerado! Reabasteça antes de registrar dose.");
        return;
      }

      // Update dose
      await supabase
        .from("dose_instances")
        .update({
          status: "taken",
          taken_at: new Date().toISOString(),
        })
        .eq("id", doseId);

      // Decrement stock
      if (stockData && stockData.units_left > 0) {
        await supabase
          .from("stock")
          .update({ units_left: stockData.units_left - 1 })
          .eq("item_id", itemId);
      }

      showFeedback("dose-taken", { medicationName: itemName });
      loadDoses();
      streakData.refresh();
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error("Erro ao confirmar dose");
    }
  };

  const upcomingDoses = doses.filter(d => 
    d.status === "scheduled" && new Date(d.due_at) >= new Date()
  );

  const lateDoses = doses.filter(d => 
    d.status === "scheduled" && new Date(d.due_at) < new Date()
  );

  const takenDoses = doses.filter(d => d.status === "taken");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-24 max-w-4xl">
        {/* Greeting Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {activeProfile?.name || "Usuário"}!
          </h1>
          <p className="text-muted-foreground">
            {todayStats.total === 0 
              ? "Você não tem doses agendadas para hoje" 
              : `${todayStats.taken} de ${todayStats.total} doses tomadas hoje`
            }
          </p>
        </div>

        {/* Streak Badge */}
        {streakData.currentStreak > 0 && (
          <div className="mb-6">
            <StreakBadge
              streak={streakData.currentStreak}
              type="current"
            />
          </div>
        )}

        {/* Quick Stats */}
        {todayStats.total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="border-primary/20">
              <CardContent className="pt-6 pb-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{todayStats.taken}</div>
                <div className="text-xs text-muted-foreground">Tomadas</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6 pb-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{todayStats.pending}</div>
                <div className="text-xs text-muted-foreground">Próximas</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6 pb-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{todayStats.late}</div>
                <div className="text-xs text-muted-foreground">Atrasadas</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Late Doses Alert */}
        {lateDoses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Doses Atrasadas ({lateDoses.length})
            </h2>
            <div className="space-y-2">
              {lateDoses.map((dose) => (
                <SimpleDoseCard
                  key={dose.id}
                  time={format(new Date(dose.due_at), "HH:mm", { locale: ptBR })}
                  medicationName={dose.items.name}
                  dose={dose.items.dose_text || undefined}
                  status="missed"
                  onTake={() => markAsTaken(dose.id, dose.item_id, dose.items.name)}
                  onSkip={() => {}}
                  onSnooze={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Doses */}
        {upcomingDoses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximas Doses ({upcomingDoses.length})
            </h2>
            <div className="space-y-2">
              {upcomingDoses.slice(0, 3).map((dose) => (
                <SimpleDoseCard
                  key={dose.id}
                  time={format(new Date(dose.due_at), "HH:mm", { locale: ptBR })}
                  medicationName={dose.items.name}
                  dose={dose.items.dose_text || undefined}
                  status="pending"
                  onTake={() => markAsTaken(dose.id, dose.item_id, dose.items.name)}
                  onSkip={() => {}}
                  onSnooze={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Taken Doses */}
        {takenDoses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Doses Tomadas ({takenDoses.length})
            </h2>
            <div className="space-y-2">
              {takenDoses.map((dose) => (
                <Card key={dose.id} className="opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{dose.items.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(dose.due_at), "HH:mm", { locale: ptBR })} • Tomada às {format(new Date(dose.taken_at!), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todayStats.total === 0 && !loading && (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="mb-4 bg-primary/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xl font-semibold mb-2">Nenhuma dose agendada para hoje</p>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Adicione medicamentos e configure os horários para começar a organizar sua rotina
              </p>
              <Button size="lg" onClick={() => navigate("/adicionar")}>
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Medicamento
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/adicionar")}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">Adicionar</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/medicamentos")}
          >
            <Pill className="h-6 w-6" />
            <span className="text-xs">Saúde</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/cofre")}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs">Carteira</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/evolucao")}
          >
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs">Progresso</span>
          </Button>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
