import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Pill, Target, Clock, AlertCircle, Lightbulb } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TimeSlotStats {
  label: string;
  period: string;
  count: number;
  adherence: number;
}

interface MissedItem {
  name: string;
  count: number;
  time: string;
}

export default function Charts() {
  const [stats, setStats] = useState({
    weeklyAdherence: 0,
    totalDoses: 0,
    takenDoses: 0,
    streak: 0,
  });
  const [timeSlotStats, setTimeSlotStats] = useState<TimeSlotStats[]>([]);
  const [missedItems, setMissedItems] = useState<MissedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasFeature('charts')) {
      setShowUpgradeModal(true);
    } else {
      loadStats();
    }
  }, [hasFeature]);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const last7Days = subDays(new Date(), 7);

      // Get all doses from last 7 days
      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id, name)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", last7Days.toISOString());

      if (doses) {
        const total = doses.length;
        const taken = doses.filter((d) => d.status === "taken").length;
        const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

        // Calculate time slot stats
        const morningDoses = doses.filter(d => {
          const hour = new Date(d.due_at).getHours();
          return hour >= 6 && hour < 12;
        });
        const afternoonDoses = doses.filter(d => {
          const hour = new Date(d.due_at).getHours();
          return hour >= 12 && hour < 18;
        });
        const nightDoses = doses.filter(d => {
          const hour = new Date(d.due_at).getHours();
          return hour >= 18 || hour < 6;
        });

        const timeSlots: TimeSlotStats[] = [
          {
            label: "Manhã",
            period: "6h - 12h",
            count: morningDoses.length,
            adherence: morningDoses.length > 0 
              ? Math.round((morningDoses.filter(d => d.status === "taken").length / morningDoses.length) * 100)
              : 0
          },
          {
            label: "Tarde",
            period: "12h - 18h",
            count: afternoonDoses.length,
            adherence: afternoonDoses.length > 0
              ? Math.round((afternoonDoses.filter(d => d.status === "taken").length / afternoonDoses.length) * 100)
              : 0
          },
          {
            label: "Noite",
            period: "18h - 23h",
            count: nightDoses.length,
            adherence: nightDoses.length > 0
              ? Math.round((nightDoses.filter(d => d.status === "taken").length / nightDoses.length) * 100)
              : 0
          }
        ];

        // Calculate missed items
        const skippedDoses = doses.filter(d => d.status === "skipped" || d.status === "scheduled");
        const itemCounts: Record<string, { count: number; time: string }> = {};
        
        skippedDoses.forEach(dose => {
          const itemName = dose.items.name;
          const hour = format(new Date(dose.due_at), "HH:mm");
          if (!itemCounts[itemName]) {
            itemCounts[itemName] = { count: 0, time: hour };
          }
          itemCounts[itemName].count++;
        });

        const missedArray: MissedItem[] = Object.entries(itemCounts)
          .map(([name, data]) => ({ name, count: data.count, time: data.time }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats({
          weeklyAdherence: adherence,
          totalDoses: total,
          takenDoses: taken,
          streak: 0, // TODO: Calculate streak
        });
        setTimeSlotStats(timeSlots);
        setMissedItems(missedArray);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center pb-24">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!hasFeature('charts')) {
    return (
      <>
        <div className="min-h-screen bg-background p-6 pb-24">
          <div className="max-w-4xl mx-auto space-y-6 text-center pt-20">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Gráficos Avançados</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Os gráficos avançados de adesão e estatísticas detalhadas estão disponíveis apenas no Plano Premium.
            </p>
            <Button onClick={() => navigate('/planos')} size="lg">
              Ver Planos Premium
            </Button>
          </div>
        </div>
        <UpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          feature="Gráficos avançados"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">HoraMed</h1>
          </div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Gráficos
          </h2>
          <p className="text-muted-foreground">
            Acompanhe sua adesão ao tratamento
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalDoses}</p>
              </div>
              <Pill className="h-10 w-10 text-primary" />
            </div>
          </Card>

          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Doses Tomadas</p>
                <p className="text-3xl font-bold text-foreground">{stats.takenDoses}</p>
              </div>
              <Target className="h-10 w-10 text-primary" />
            </div>
          </Card>

          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Adesão</p>
                <p className="text-3xl font-bold text-foreground">{stats.weeklyAdherence}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
          </Card>

          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sequência</p>
                <p className="text-3xl font-bold text-foreground">{stats.streak} dias</p>
              </div>
              <Calendar className="h-10 w-10 text-primary" />
            </div>
          </Card>
        </div>

        {/* Time Slot Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Análise de Horários
          </h3>
          <div className="space-y-4">
            {timeSlotStats.map((slot, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{slot.label} ({slot.period})</p>
                    <p className="text-sm text-muted-foreground">{slot.count} medicamentos</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      slot.adherence >= 90 ? "text-primary" :
                      slot.adherence >= 70 ? "text-primary/70" : "text-primary/50"
                    }`}>
                      {slot.adherence}%
                    </p>
                    <p className="text-xs text-muted-foreground">adesão</p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      slot.adherence >= 90 ? "bg-primary" :
                      slot.adherence >= 70 ? "bg-primary/70" : "bg-primary/50"
                    }`}
                    style={{ width: `${slot.adherence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Missed Items */}
        {missedItems.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Itens Mais Esquecidos
            </h3>
            <div className="space-y-3">
              {missedItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{item.count} faltas</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Insights */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
            <Lightbulb className="h-5 w-5" />
            Insights
          </h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span>•</span>
              <span>Sua adesão está {stats.weeklyAdherence >= 80 ? "excelente" : "precisando melhorar"}! Continue assim.</span>
            </li>
            {timeSlotStats.find(s => s.adherence < 70) && (
              <li className="flex gap-2">
                <span>•</span>
                <span>Considere definir lembretes extras para o período da {timeSlotStats.find(s => s.adherence < 70)?.label.toLowerCase()}.</span>
              </li>
            )}
            {missedItems.length > 0 && (
              <li className="flex gap-2">
                <span>•</span>
                <span>Você tem esquecido {missedItems[0].name} com frequência. Que tal definir alarmes?</span>
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
