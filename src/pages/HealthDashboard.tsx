import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  LineChart,
  Pill,
  Target,
  Calendar,
  FileText,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { format, subMonths, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area
} from 'recharts';

interface ExamValue {
  parametro: string;
  valor: number;
  data: string;
  status: string;
  referencia_min?: number;
  referencia_max?: number;
}

interface AdherenceData {
  data: string;
  taxa: number;
  total: number;
  tomadas: number;
}

interface CorrelationData {
  data: string;
  adesao: number;
  peso?: number;
  pressao?: number;
  glicemia?: number;
}

export default function HealthDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pesoData, setPesoData] = useState<any[]>([]);
  const [pressaoData, setPressaoData] = useState<any[]>([]);
  const [glicemiaData, setGlicemiaData] = useState<any[]>([]);
  const [examesAlterados, setExamesAlterados] = useState<ExamValue[]>([]);
  const [adherenceData, setAdherenceData] = useState<AdherenceData[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [stats, setStats] = useState({
    medicamentosAtivos: 0,
    taxaAdesao: 0,
    proximosEventos: 0,
    documentosVencendo: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const threeMonthsAgo = subMonths(new Date(), 3);
      const thirtyDaysAgo = subDays(new Date(), 30);

      // === ESTATÍSTICAS PRINCIPAIS ===
      
      // Medicamentos ativos
      const { count: activeMeds } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Taxa de adesão nos últimos 30 dias
      const { data: recentDoses } = await supabase
        .from("dose_instances")
        .select("status, item_id, items!inner(user_id)")
        .eq("items.user_id", user.id)
        .gte("due_at", thirtyDaysAgo.toISOString());

      const totalDoses = recentDoses?.length || 0;
      const takenDoses = recentDoses?.filter(d => d.status === "taken").length || 0;
      const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      // Próximos eventos (consultas + eventos de saúde)
      const hoje = new Date().toISOString().split("T")[0];
      const { data: upcomingConsultas } = await supabase
        .from("consultas_medicas")
        .select("id")
        .eq("user_id", user.id)
        .gte("data_consulta", hoje);

      const { data: upcomingEventos } = await supabase
        .from("eventos_saude")
        .select("id")
        .eq("user_id", user.id)
        .gte("due_date", hoje)
        .is("completed_at", null);

      const upcomingEvents = (upcomingConsultas?.length || 0) + (upcomingEventos?.length || 0);

      // Documentos vencendo em 30 dias
      const em30Dias = new Date();
      em30Dias.setDate(em30Dias.getDate() + 30);
      const { count: expiringDocs } = await supabase
        .from("documentos_saude")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("expires_at", hoje)
        .lte("expires_at", em30Dias.toISOString().split("T")[0]);

      setStats({
        medicamentosAtivos: activeMeds || 0,
        taxaAdesao: adherenceRate,
        proximosEventos: upcomingEvents,
        documentosVencendo: expiringDocs || 0
      });

      // === DADOS DE ADESÃO POR DIA (últimos 30 dias) ===
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return {
          date: date,
          dateStr: format(date, "yyyy-MM-dd")
        };
      });

      const adherenceByDay: AdherenceData[] = [];
      
      for (const day of last30Days) {
        const dayStart = startOfDay(day.date);
        const dayEnd = endOfDay(day.date);
        
        const { data: dayDoses } = await supabase
          .from("dose_instances")
          .select("status, item_id, items!inner(user_id)")
          .eq("items.user_id", user.id)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString());

        const total = dayDoses?.length || 0;
        const taken = dayDoses?.filter(d => d.status === "taken").length || 0;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

        adherenceByDay.push({
          data: format(day.date, "dd/MMM", { locale: ptBR }),
          taxa: rate,
          total: total,
          tomadas: taken
        });
      }
      
      setAdherenceData(adherenceByDay);

      // Buscar sinais vitais dos últimos 3 meses
      const { data: sinais } = await supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_medicao", threeMonthsAgo.toISOString())
        .order("data_medicao", { ascending: true });

      // Processar dados de peso
      const peso = sinais
        ?.filter(s => s.peso_kg)
        .map(s => ({
          data: format(new Date(s.data_medicao), "dd/MMM", { locale: ptBR }),
          peso: parseFloat(String(s.peso_kg))
        })) || [];
      setPesoData(peso);

      // Processar dados de pressão
      const pressao = sinais
        ?.filter(s => s.pressao_sistolica)
        .map(s => ({
          data: format(new Date(s.data_medicao), "dd/MMM", { locale: ptBR }),
          sistolica: s.pressao_sistolica,
          diastolica: s.pressao_diastolica
        })) || [];
      setPressaoData(pressao);

      // Processar dados de glicemia
      const glicemia = sinais
        ?.filter(s => s.glicemia)
        .map(s => ({
          data: format(new Date(s.data_medicao), "dd/MMM", { locale: ptBR }),
          glicemia: s.glicemia
        })) || [];
      setGlicemiaData(glicemia);

      // Buscar exames com valores alterados
      const { data: exames } = await supabase
        .from("exames_laboratoriais")
        .select(`
          id,
          data_exame,
          valores_exames!inner(*)
        `)
        .eq("user_id", user.id)
        .eq("valores_exames.status", "alterado")
        .gte("data_exame", threeMonthsAgo.toISOString())
        .order("data_exame", { ascending: false })
        .limit(10);

      const alterados: ExamValue[] = [];
      exames?.forEach((exame: any) => {
        exame.valores_exames?.forEach((valor: any) => {
          if (valor.status === 'alterado') {
            alterados.push({
              parametro: valor.parametro,
              valor: valor.valor,
              data: exame.data_exame,
              status: valor.status,
              referencia_min: valor.referencia_min,
              referencia_max: valor.referencia_max
            });
          }
        });
      });
      setExamesAlterados(alterados);

      // === CORRELAÇÃO ADESÃO x SINAIS VITAIS ===
      // Combinar dados de adesão com sinais vitais dos últimos 30 dias
      const correlations: CorrelationData[] = [];
      
      for (const day of last30Days) {
        const dayStart = startOfDay(day.date);
        const dayEnd = endOfDay(day.date);
        
        // Adesão do dia
        const { data: dayDoses } = await supabase
          .from("dose_instances")
          .select("status, item_id, items!inner(user_id)")
          .eq("items.user_id", user.id)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString());

        const total = dayDoses?.length || 0;
        const taken = dayDoses?.filter(d => d.status === "taken").length || 0;
        const adesao = total > 0 ? Math.round((taken / total) * 100) : 0;

        // Sinais vitais do dia
        const { data: vitals } = await supabase
          .from("sinais_vitais")
          .select("*")
          .eq("user_id", user.id)
          .gte("data_medicao", dayStart.toISOString())
          .lte("data_medicao", dayEnd.toISOString())
          .order("data_medicao", { ascending: false })
          .limit(1);

        const vital = vitals?.[0];

        correlations.push({
          data: format(day.date, "dd/MMM", { locale: ptBR }),
          adesao: adesao,
          peso: vital?.peso_kg ? parseFloat(String(vital.peso_kg)) : undefined,
          pressao: vital?.pressao_sistolica || undefined,
          glicemia: vital?.glicemia || undefined
        });
      }

      setCorrelationData(correlations);

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 pb-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Dados & Insights
            </h1>
            <p className="text-muted-foreground">
              Análise completa da sua saúde e correlação com adesão aos medicamentos
            </p>
          </div>

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/medicamentos')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.medicamentosAtivos}</p>
                    <p className="text-xs text-muted-foreground truncate">Medicamentos Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/historico')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    stats.taxaAdesao >= 80 ? 'bg-green-500/10' : stats.taxaAdesao >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'
                  }`}>
                    <Target className={`h-5 w-5 ${
                      stats.taxaAdesao >= 80 ? 'text-green-600' : stats.taxaAdesao >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.taxaAdesao}%</p>
                    <p className="text-xs text-muted-foreground truncate">Taxa de Adesão (30d)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/consultas')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.proximosEventos}</p>
                    <p className="text-xs text-muted-foreground truncate">Próximos Eventos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/cofre')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    stats.documentosVencendo > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'
                  }`}>
                    <FileText className={`h-5 w-5 ${
                      stats.documentosVencendo > 0 ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.documentosVencendo}</p>
                    <p className="text-xs text-muted-foreground truncate">Docs Vencendo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Automáticos */}
          {stats.taxaAdesao < 50 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Atenção: Taxa de Adesão Baixa
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-200 mb-3">
                      Sua taxa de adesão está em {stats.taxaAdesao}%. Manter a regularidade é essencial para o tratamento.
                    </p>
                    <Button size="sm" variant="destructive" onClick={() => navigate('/hoje')}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Ver Doses de Hoje
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.documentosVencendo > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      {stats.documentosVencendo} Documento{stats.documentosVencendo > 1 ? 's' : ''} Vencendo em Breve
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-200 mb-3">
                      Verifique seus documentos que estão próximos do vencimento.
                    </p>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/cofre')}>
                      <FileText className="h-4 w-4 mr-1.5" />
                      Abrir Cofre
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adesão ao Longo do Tempo */}
          {adherenceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Adesão aos Medicamentos (Últimos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={adherenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis yAxisId="left" label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Doses', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="taxa"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Taxa de Adesão (%)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="tomadas"
                      fill="#22c55e"
                      name="Doses Tomadas"
                      opacity={0.6}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="total"
                      fill="#94a3b8"
                      name="Total de Doses"
                      opacity={0.3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Correlação: Adesão x Sinais Vitais */}
          {correlationData.some(d => d.pressao || d.peso || d.glicemia) && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Correlação: Adesão x Saúde
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Veja como sua adesão aos medicamentos impacta seus sinais vitais ao longo do tempo
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {correlationData.some(d => d.pressao !== undefined) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Adesão vs Pressão Arterial
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={correlationData.filter(d => d.pressao !== undefined)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis yAxisId="left" label={{ value: 'Adesão (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Pressão', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="adesao"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Adesão (%)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="pressao"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Pressão Sistólica"
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {correlationData.some(d => d.glicemia !== undefined) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Adesão vs Glicemia
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={correlationData.filter(d => d.glicemia !== undefined)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis yAxisId="left" label={{ value: 'Adesão (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Glicemia', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="adesao"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Adesão (%)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="glicemia"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Glicemia (mg/dL)"
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {correlationData.some(d => d.peso !== undefined) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Adesão vs Peso
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={correlationData.filter(d => d.peso !== undefined)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis yAxisId="left" label={{ value: 'Adesão (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Peso (kg)', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="adesao"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Adesão (%)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="peso"
                          stroke="#22c55e"
                          strokeWidth={2}
                          name="Peso (kg)"
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Exames Alterados */}
          {examesAlterados.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  Valores Alterados Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {examesAlterados.slice(0, 5).map((exame, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">{exame.parametro}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(exame.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{exame.valor}</p>
                        {(exame.referencia_min || exame.referencia_max) && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {exame.referencia_min} - {exame.referencia_max}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sinais Vitais Individuais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Evolução dos Sinais Vitais</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/perfil')}>
                <Activity className="h-4 w-4 mr-1.5" />
                Registrar Dados
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Peso */}
            {pesoData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Evolução do Peso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={pesoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="peso" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Pressão Arterial */}
            {pressaoData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    Pressão Arterial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={pressaoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sistolica" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Sistólica"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="diastolica" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Diastólica"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Glicemia */}
            {glicemiaData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                    Glicemia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={glicemiaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="glicemia" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Empty State */}
          {pesoData.length === 0 && pressaoData.length === 0 && glicemiaData.length === 0 && adherenceData.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Comece a usar o app para ver insights</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  À medida que você registra suas doses e sinais vitais, esta página mostrará 
                  correlações importantes entre sua adesão aos medicamentos e sua saúde.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => navigate('/hoje')}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Registrar Doses
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/perfil')}>
                    <Activity className="h-4 w-4 mr-1.5" />
                    Adicionar Sinais Vitais
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links Rápidos */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
            <CardHeader>
              <CardTitle className="text-lg">Explore Mais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/historico')}>
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Histórico</div>
                    <div className="text-xs text-muted-foreground">Ver todas as doses</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/timeline')}>
                  <LineChart className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Timeline</div>
                    <div className="text-xs text-muted-foreground">Linha do tempo</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/relatorios')}>
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Relatórios</div>
                    <div className="text-xs text-muted-foreground">Gerar PDF</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}
