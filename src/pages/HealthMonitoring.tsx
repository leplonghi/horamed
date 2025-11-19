import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Heart, Droplets, Weight, Thermometer, Wind, Plus } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface VitalSign {
  id: string;
  data_medicao: string;
  pressao_sistolica: number | null;
  pressao_diastolica: number | null;
  frequencia_cardiaca: number | null;
  temperatura: number | null;
  glicemia: number | null;
  saturacao_oxigenio: number | null;
  peso_kg: number | null;
  observacoes: string | null;
}

export default function HealthMonitoring() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeProfile) {
      loadVitalSigns();
    }
  }, [period, activeProfile?.id]);

  const loadVitalSigns = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfile) return;

      const daysBack = period === "week" ? 7 : 30;
      const startDate = subDays(new Date(), daysBack);

      const { data, error } = await supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .eq("profile_id", activeProfile.id)
        .gte("data_medicao", startDate.toISOString())
        .order("data_medicao", { ascending: true });

      if (error) throw error;
      setVitalSigns(data || []);
    } catch (error) {
      console.error("Erro ao carregar sinais vitais:", error);
      toast.error("Erro ao carregar dados de saúde");
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (key: keyof VitalSign) => {
    return vitalSigns
      .filter(v => v[key] !== null)
      .map(v => ({
        data: format(new Date(v.data_medicao), "dd/MMM", { locale: ptBR }),
        valor: v[key]
      }));
  };

  const getLatestValue = (key: keyof VitalSign): number | null => {
    const latest = vitalSigns
      .filter(v => v[key] !== null)
      .sort((a, b) => new Date(b.data_medicao).getTime() - new Date(a.data_medicao).getTime())[0];
    const value = latest?.[key];
    return typeof value === 'number' ? value : null;
  };

  const StatCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number | null; 
    unit: string; 
    icon: any; 
    color: string;
  }) => (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {value !== null ? `${value} ${unit}` : "Sem dados"}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${color.replace('border-l-', '')} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ChartCard = ({ 
    title, 
    data, 
    dataKey, 
    color,
    yAxisLabel 
  }: { 
    title: string; 
    data: any[]; 
    dataKey: string; 
    color: string;
    yAxisLabel?: string;
  }) => {
    if (data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado registrado neste período
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const pressureData = vitalSigns
    .filter(v => v.pressao_sistolica !== null && v.pressao_diastolica !== null)
    .map(v => ({
      data: format(new Date(v.data_medicao), "dd/MMM", { locale: ptBR }),
      sistolica: v.pressao_sistolica,
      diastolica: v.pressao_diastolica
    }));

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-24 p-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-24 p-6 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-7 w-7 text-primary" />
                Monitoramento de Saúde
              </h2>
              <p className="text-muted-foreground mt-1">
                Acompanhe a evolução dos seus indicadores de saúde
              </p>
            </div>
            <Button onClick={() => navigate("/perfil")} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Registro
            </Button>
          </div>

          {/* Period Selector */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="week">Última Semana</TabsTrigger>
              <TabsTrigger value="month">Último Mês</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Latest Values Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Pressão Arterial"
              value={getLatestValue("pressao_sistolica")}
              unit={getLatestValue("pressao_diastolica") !== null ? `/${getLatestValue("pressao_diastolica")}` : "mmHg"}
              icon={Heart}
              color="border-l-red-500 from-red-500 to-red-600"
            />
            <StatCard
              title="Glicemia"
              value={getLatestValue("glicemia")}
              unit="mg/dL"
              icon={Droplets}
              color="border-l-blue-500 from-blue-500 to-blue-600"
            />
            <StatCard
              title="Peso"
              value={getLatestValue("peso_kg")}
              unit="kg"
              icon={Weight}
              color="border-l-green-500 from-green-500 to-green-600"
            />
            <StatCard
              title="Saturação O2"
              value={getLatestValue("saturacao_oxigenio")}
              unit="%"
              icon={Wind}
              color="border-l-purple-500 from-purple-500 to-purple-600"
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pressão Arterial */}
            {pressureData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pressão Arterial</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={pressureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sistolica" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Sistólica"
                        dot={{ fill: "#ef4444", r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="diastolica" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        name="Diastólica"
                        dot={{ fill: "#f97316", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <ChartCard 
                title="Pressão Arterial" 
                data={[]} 
                dataKey="valor" 
                color="#ef4444"
                yAxisLabel="mmHg"
              />
            )}

            {/* Glicemia */}
            <ChartCard 
              title="Glicemia" 
              data={formatChartData("glicemia")} 
              dataKey="valor" 
              color="#3b82f6"
              yAxisLabel="mg/dL"
            />

            {/* Peso */}
            <ChartCard 
              title="Peso Corporal" 
              data={formatChartData("peso_kg")} 
              dataKey="valor" 
              color="#22c55e"
              yAxisLabel="kg"
            />

            {/* Frequência Cardíaca */}
            <ChartCard 
              title="Frequência Cardíaca" 
              data={formatChartData("frequencia_cardiaca")} 
              dataKey="valor" 
              color="#f59e0b"
              yAxisLabel="bpm"
            />

            {/* Temperatura */}
            <ChartCard 
              title="Temperatura" 
              data={formatChartData("temperatura")} 
              dataKey="valor" 
              color="#ec4899"
              yAxisLabel="°C"
            />

            {/* Saturação de Oxigênio */}
            <ChartCard 
              title="Saturação de Oxigênio" 
              data={formatChartData("saturacao_oxigenio")} 
              dataKey="valor" 
              color="#8b5cf6"
              yAxisLabel="%"
            />
          </div>

          {/* Empty State */}
          {vitalSigns.length === 0 && (
            <Card className="p-12 text-center">
              <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground mb-6">
                Comece a registrar seus sinais vitais para acompanhar sua saúde
              </p>
              <Button onClick={() => navigate("/perfil")}>
                Adicionar Primeiro Registro
              </Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
