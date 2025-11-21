import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Calendar, Pill, Target, Clock, AlertCircle, Lightbulb, Activity, Award, Package, AlertTriangle } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HealthDataChart from "@/components/HealthDataChart";
import AdherenceChart from "@/components/AdherenceChart";
import StockChart from "@/components/StockChart";
import InfoDialog from "@/components/InfoDialog";
import { useUserProfiles } from "@/hooks/useUserProfiles";

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

interface HealthDataPoint {
  date: string;
  weight_kg: number | null;
  height_cm: number | null;
}

export default function Charts() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [stats, setStats] = useState({
    weeklyAdherence: 0,
    totalDoses: 0,
    takenDoses: 0,
    streak: 0,
  });
  const [timeSlotStats, setTimeSlotStats] = useState<TimeSlotStats[]>([]);
  const [missedItems, setMissedItems] = useState<MissedItem[]>([]);
  const [healthHistory, setHealthHistory] = useState<HealthDataPoint[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; taken: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeature } = useSubscription();
  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();

  useEffect(() => {
    // Mantém check de subscription, mas respeita feature flag também
    if (!hasFeature('charts')) {
      setShowUpgradeModal(true);
    } else {
      loadStats();
      loadHealthHistory();
    }
  }, [hasFeature, period]);

  // Reload data when active profile changes
  useEffect(() => {
    if (activeProfile && hasFeature('charts')) {
      setLoading(true);
      loadStats();
      loadHealthHistory();
    }
  }, [activeProfile?.id]);

  const loadHealthHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get health history from the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data: history } = await supabase
        .from("health_history")
        .select("weight_kg, height_cm, recorded_at")
        .eq("user_id", user.id)
        .gte("recorded_at", thirtyDaysAgo.toISOString())
        .order("recorded_at", { ascending: true });

      if (history && history.length > 0) {
        const formattedHistory = history.map(h => ({
          date: h.recorded_at,
          weight_kg: h.weight_kg,
          height_cm: h.height_cm,
        }));
        setHealthHistory(formattedHistory);
      }
    } catch (error) {
      console.error("Error loading health history:", error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const daysBack = period === "week" ? 7 : 30;
      const startDate = subDays(new Date(), daysBack);

      // Get all doses from the selected period
      let dosesQuery = supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id, name, profile_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", startDate.toISOString());

      if (activeProfile) {
        dosesQuery = dosesQuery.eq("items.profile_id", activeProfile.id);
      }

      const { data: doses } = await dosesQuery;

      if (doses) {
        const total = doses.length;
        const taken = doses.filter((d) => d.status === "taken").length;
        const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

        // Calculate daily stats based on period
        let periodStart, periodEnd, dateFormat;
        if (period === "week") {
          periodStart = startOfWeek(new Date(), { weekStartsOn: 0 });
          periodEnd = new Date();
          dateFormat = "EEE";
        } else {
          periodStart = startOfMonth(new Date());
          periodEnd = endOfMonth(new Date());
          dateFormat = "dd/MM";
        }
        
        const daysInPeriod = eachDayOfInterval({ start: periodStart, end: periodEnd });
        
        const dailyStats = daysInPeriod.map(day => {
          const dayDoses = doses.filter(d => {
            const doseDate = new Date(d.due_at);
            return doseDate.toDateString() === day.toDateString();
          });
          return {
            day: format(day, dateFormat, { locale: ptBR }),
            taken: dayDoses.filter(d => d.status === "taken").length,
            total: dayDoses.length
          };
        });
        setWeeklyData(dailyStats);

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

        // Calculate missed/skipped items (items not taken)
        const notTakenDoses = doses.filter(d => d.status === "missed" || d.status === "skipped");
        const itemCounts: Record<string, { count: number; time: string }> = {};
        
        notTakenDoses.forEach(dose => {
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
    <>
      <Header />
      <div className="min-h-screen bg-background pt-24 p-6 pb-24">{/* pt-24 para compensar o header fixo */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-7 w-7 text-primary" />
                Análise e Estatísticas
              </h2>
              <p className="text-muted-foreground">
                Acompanhe sua adesão ao tratamento e gerencie seu estoque
              </p>
            </div>
            
            <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="week">Semanal</TabsTrigger>
                <TabsTrigger value="month">Mensal</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground font-medium">Total de Doses</p>
                  <InfoDialog
                    title="Total de doses"
                    description="Número total de doses programadas para o período selecionado. Isso inclui todos os medicamentos e horários configurados."
                    triggerClassName="h-4 w-4"
                  />
                </div>
                <p className="text-4xl font-bold text-foreground mt-1">{stats.totalDoses}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {period === "week" ? "últimos 7 dias" : "último mês"}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Pill className="h-7 w-7 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground font-medium">Doses Tomadas</p>
                  <InfoDialog
                    title="Doses tomadas"
                    description="Quantidade de doses que você confirmou como tomadas no período. Cada dose tomada no horário correto contribui para o sucesso do tratamento."
                    triggerClassName="h-4 w-4"
                  />
                </div>
                <p className="text-4xl font-bold text-foreground mt-1">{stats.takenDoses}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.totalDoses - stats.takenDoses} não tomadas
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-success/20 flex items-center justify-center">
                <Target className="h-7 w-7 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-accent/30 to-accent/10 border-accent-foreground/20 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground font-medium">Taxa de Progresso</p>
                  <InfoDialog
                    title="Taxa de progresso"
                    description="Porcentagem de doses tomadas em relação ao total. Acima de 80% é considerado excelente para manter a eficácia do tratamento!"
                    triggerClassName="h-4 w-4"
                  />
                </div>
                <p className="text-4xl font-bold text-foreground mt-1">{stats.weeklyAdherence}%</p>
                <p className={`text-xs mt-2 font-semibold ${
                  stats.weeklyAdherence >= 90 ? 'text-success' : 
                  stats.weeklyAdherence >= 80 ? 'text-primary' : 
                  stats.weeklyAdherence >= 70 ? 'text-warning' : 
                  'text-destructive'
                }`}>
                  {stats.weeklyAdherence >= 90 ? '🎯 Excelente!' : 
                   stats.weeklyAdherence >= 80 ? '👍 Muito bom!' : 
                   stats.weeklyAdherence >= 70 ? '💪 Bom' : 
                   '⚠️ Precisa melhorar'}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground font-medium">Melhor Período</p>
                  <InfoDialog
                    title="Melhor período do dia"
                    description="Horário em que você tem o melhor progresso de doses tomadas. Use essa informação para entender seus padrões e otimizar os horários dos medicamentos."
                    triggerClassName="h-4 w-4"
                  />
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {timeSlotStats.length > 0 ? timeSlotStats.reduce((prev, curr) => prev.adherence > curr.adherence ? prev : curr).label : '-'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">maior progresso</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-warning/20 flex items-center justify-center">
                <Award className="h-7 w-7 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        {/* Adherence Chart */}
        {weeklyData.length > 0 && (
          <AdherenceChart 
            weeklyData={weeklyData} 
            period={period}
          />
        )}

        {/* Stock Management */}
        <StockChart />

        {/* Time Slot Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Analise Detalhada de Horarios
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Identifique seus melhores e piores horarios para tomar medicamentos
          </p>
          <div className="space-y-4">
            {timeSlotStats.map((slot, i) => {
              const takenCount = Math.round((slot.count * slot.adherence) / 100);
              const missedCount = slot.count - takenCount;
              
              return (
                <div key={i} className="space-y-2 p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-lg">{slot.label}</p>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                          {slot.period}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{slot.count} doses totais</span>
                        <span className="text-primary">{takenCount} tomadas</span>
                        {missedCount > 0 && <span className="text-destructive">{missedCount} perdidas</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        slot.adherence >= 90 ? "text-primary" :
                        slot.adherence >= 70 ? "text-primary/70" : "text-destructive"
                      }`}>
                        {slot.adherence}%
                      </p>
                      <p className="text-xs text-muted-foreground">adesao</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          slot.adherence >= 90 ? "bg-primary" :
                          slot.adherence >= 70 ? "bg-primary/70" : "bg-destructive"
                        }`}
                        style={{ width: `${slot.adherence}%` }}
                      />
                    </div>
                  </div>
                  {slot.adherence < 70 && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                      <AlertCircle className="h-3 w-3" />
                      Atencao: Este periodo precisa de mais foco
                    </p>
                  )}
                  {slot.adherence >= 90 && (
                    <p className="text-xs text-primary flex items-center gap-1 mt-2">
                      <Award className="h-3 w-3" />
                      Excelente! Continue assim
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Missed/Skipped Items */}
        {missedItems.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Medicamentos que Precisam de Atencao
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Estes sao os medicamentos que voce tem esquecido ou pulado com mais frequencia nos ultimos 7 dias
            </p>
            <div className="space-y-3">
              {missedItems.map((item, i) => {
                const badgeColors = ['bg-destructive/10 border-destructive/30', 'bg-destructive/5 border-destructive/20', 'bg-muted border-muted'];
                return (
                  <div key={i} className={`p-4 rounded-lg border ${badgeColors[i] || 'bg-card'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          i === 0 ? 'bg-destructive text-destructive-foreground' :
                          i === 1 ? 'bg-destructive/70 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Horario habitual: {item.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-destructive">{item.count}</p>
                        <p className="text-xs text-muted-foreground">vezes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 p-2 bg-background/50 rounded">
                      <Lightbulb className="h-3 w-3 text-primary" />
                      <span>
                        {i === 0 ? 'Configure um alarme extra para este medicamento' :
                         i === 1 ? 'Tente mudar o horario ou definir um lembrete' :
                         'Considere associar a toma com uma rotina diaria'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Activity className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Dica:</strong> Doses puladas nao reduzem o estoque, mas afetam diretamente sua taxa de adesao. 
                  Se voce esquece frequentemente um medicamento, considere ajustar o horario ou configurar multiplos lembretes.
                </span>
              </p>
            </div>
          </Card>
        )}

        {/* Insights */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
            <Lightbulb className="h-5 w-5" />
            Insights Personalizados
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-background rounded-lg">
              <p className="font-medium mb-1 flex items-center gap-2">
                {stats.weeklyAdherence >= 90 ? '🌟' : stats.weeklyAdherence >= 80 ? '👍' : stats.weeklyAdherence >= 70 ? '😊' : '⚠️'}
                <span>Status Geral</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.weeklyAdherence >= 90 && 'Excelente! Sua adesao esta incrivel. Voce esta no caminho certo para uma saude melhor!'}
                {stats.weeklyAdherence >= 80 && stats.weeklyAdherence < 90 && 'Muito bom! Sua adesao esta acima da media. Continue assim!'}
                {stats.weeklyAdherence >= 70 && stats.weeklyAdherence < 80 && 'Bom trabalho! Mas ha espaco para melhorias. Vamos tentar chegar aos 80%?'}
                {stats.weeklyAdherence < 70 && 'Sua adesao precisa de atencao. Vamos trabalhar juntos para melhorar isso!'}
              </p>
            </div>

            {timeSlotStats.find(s => s.adherence < 70) && (
              <div className="p-3 bg-background rounded-lg">
                <p className="font-medium mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-destructive" />
                  <span>Horario Critico</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  O periodo da {timeSlotStats.find(s => s.adherence < 70)?.label.toLowerCase()} ({timeSlotStats.find(s => s.adherence < 70)?.period}) 
                  tem a menor adesao ({timeSlotStats.find(s => s.adherence < 70)?.adherence}%). 
                  Configure lembretes adicionais ou tente ajustar os horarios dos medicamentos.
                </p>
              </div>
            )}

            {timeSlotStats.find(s => s.adherence >= 90) && (
              <div className="p-3 bg-background rounded-lg">
                <p className="font-medium mb-1 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span>Ponto Forte</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Voce tem excelente adesao no periodo da {timeSlotStats.find(s => s.adherence >= 90)?.label.toLowerCase()} ({timeSlotStats.find(s => s.adherence >= 90)?.adherence}%)! 
                  Tente aplicar a mesma estrategia nos outros horarios.
                </p>
              </div>
            )}

            {missedItems.length > 0 && (
              <div className="p-3 bg-background rounded-lg">
                <p className="font-medium mb-1 flex items-center gap-2">
                  <Target className="h-4 w-4 text-destructive" />
                  <span>Atencao Especial</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {missedItems[0].name} foi esquecido {missedItems[0].count} vezes. 
                  Sugestao: Configure multiplos alarmes ou associe a toma com uma atividade diaria (ex: apos cafe da manha).
                </p>
              </div>
            )}

            {stats.weeklyAdherence >= 80 && missedItems.length === 0 && (
              <div className="p-3 bg-background rounded-lg">
                <p className="font-medium mb-1 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Continue Assim!</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Voce esta mantendo uma excelente consistencia sem esquecimentos significativos. 
                  Sua dedicacao ao tratamento e inspiradora!
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Health Evolution Chart */}
        <HealthDataChart data={healthHistory} />
      </div>
    </div>
    </>
  );
}
