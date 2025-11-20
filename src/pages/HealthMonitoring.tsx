import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    pressao_sistolica: "",
    pressao_diastolica: "",
    frequencia_cardiaca: "",
    temperatura: "",
    glicemia: "",
    saturacao_oxigenio: "",
    peso_kg: "",
    observacoes: "",
  });

  useEffect(() => {
    if (activeProfile) {
      loadVitalSigns();
    }
  }, [period, activeProfile?.id]);

  useEffect(() => {
    if (dialogOpen && vitalSigns.length > 0) {
      // Pré-preencher com última medição
      const latest = vitalSigns[vitalSigns.length - 1];
      setFormData({
        pressao_sistolica: latest.pressao_sistolica?.toString() || "",
        pressao_diastolica: latest.pressao_diastolica?.toString() || "",
        frequencia_cardiaca: latest.frequencia_cardiaca?.toString() || "",
        temperatura: latest.temperatura?.toString() || "",
        glicemia: latest.glicemia?.toString() || "",
        saturacao_oxigenio: latest.saturacao_oxigenio?.toString() || "",
        peso_kg: latest.peso_kg?.toString() || "",
        observacoes: "",
      });
    }
  }, [dialogOpen, vitalSigns]);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfile) return;

      const dataToInsert: any = {
        user_id: user.id,
        profile_id: activeProfile.id,
        data_medicao: new Date().toISOString(),
      };

      // Adicionar apenas campos preenchidos
      if (formData.pressao_sistolica) dataToInsert.pressao_sistolica = parseInt(formData.pressao_sistolica);
      if (formData.pressao_diastolica) dataToInsert.pressao_diastolica = parseInt(formData.pressao_diastolica);
      if (formData.frequencia_cardiaca) dataToInsert.frequencia_cardiaca = parseInt(formData.frequencia_cardiaca);
      if (formData.temperatura) dataToInsert.temperatura = parseFloat(formData.temperatura);
      if (formData.glicemia) dataToInsert.glicemia = parseInt(formData.glicemia);
      if (formData.saturacao_oxigenio) dataToInsert.saturacao_oxigenio = parseInt(formData.saturacao_oxigenio);
      if (formData.peso_kg) dataToInsert.peso_kg = parseFloat(formData.peso_kg);
      if (formData.observacoes) dataToInsert.observacoes = formData.observacoes;

      const { error } = await supabase
        .from("sinais_vitais")
        .insert(dataToInsert);

      if (error) throw error;

      toast.success("Registro salvo com sucesso!");
      setDialogOpen(false);
      loadVitalSigns();
      
      // Limpar formulário
      setFormData({
        pressao_sistolica: "",
        pressao_diastolica: "",
        frequencia_cardiaca: "",
        temperatura: "",
        glicemia: "",
        saturacao_oxigenio: "",
        peso_kg: "",
        observacoes: "",
      });
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      toast.error("Erro ao salvar registro");
    } finally {
      setSaving(false);
    }
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Sinais Vitais</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pressao_sistolica">Pressão Sistólica (mmHg)</Label>
                      <Input
                        id="pressao_sistolica"
                        type="number"
                        placeholder="Ex: 120"
                        value={formData.pressao_sistolica}
                        onChange={(e) => setFormData({ ...formData, pressao_sistolica: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pressao_diastolica">Pressão Diastólica (mmHg)</Label>
                      <Input
                        id="pressao_diastolica"
                        type="number"
                        placeholder="Ex: 80"
                        value={formData.pressao_diastolica}
                        onChange={(e) => setFormData({ ...formData, pressao_diastolica: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="glicemia">Glicemia (mg/dL)</Label>
                      <Input
                        id="glicemia"
                        type="number"
                        placeholder="Ex: 95"
                        value={formData.glicemia}
                        onChange={(e) => setFormData({ ...formData, glicemia: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="peso_kg">Peso (kg)</Label>
                      <Input
                        id="peso_kg"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 70.5"
                        value={formData.peso_kg}
                        onChange={(e) => setFormData({ ...formData, peso_kg: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequencia_cardiaca">Frequência Cardíaca (bpm)</Label>
                      <Input
                        id="frequencia_cardiaca"
                        type="number"
                        placeholder="Ex: 72"
                        value={formData.frequencia_cardiaca}
                        onChange={(e) => setFormData({ ...formData, frequencia_cardiaca: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saturacao_oxigenio">Saturação O2 (%)</Label>
                      <Input
                        id="saturacao_oxigenio"
                        type="number"
                        placeholder="Ex: 98"
                        value={formData.saturacao_oxigenio}
                        onChange={(e) => setFormData({ ...formData, saturacao_oxigenio: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperatura">Temperatura (°C)</Label>
                    <Input
                      id="temperatura"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 36.5"
                      value={formData.temperatura}
                      onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Observações adicionais sobre a medição..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Registro"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
