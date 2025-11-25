import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSideEffectsLog, SideEffectLog } from "@/hooks/useSideEffectsLog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SideEffectsDashboardProps {
  itemId?: string;
}

export function SideEffectsDashboard({ itemId }: SideEffectsDashboardProps) {
  const { user } = useAuth();
  const { logs, isLoading, fetchLogs, getCorrelationData } = useSideEffectsLog();
  const [medications, setMedications] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedMedication, setSelectedMedication] = useState<string>(itemId || "");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadMedications();
  }, [user]);

  useEffect(() => {
    if (selectedMedication) {
      fetchLogs(selectedMedication);
      loadChartData(selectedMedication);
    }
  }, [selectedMedication]);

  const loadMedications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('items')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading medications:', error);
      return;
    }

    setMedications(data || []);
    if (data && data.length > 0 && !selectedMedication) {
      setSelectedMedication(data[0].id);
    }
  };

  const loadChartData = async (medId: string) => {
    const [overall, energy, pain, nausea, sleep] = await Promise.all([
      getCorrelationData(medId, 'overall_feeling'),
      getCorrelationData(medId, 'energy_level'),
      getCorrelationData(medId, 'pain_level'),
      getCorrelationData(medId, 'nausea_level'),
      getCorrelationData(medId, 'sleep_quality'),
    ]);

    const combined = (overall as any[]).map((item: any, index: number) => ({
      date: format(new Date(item.recorded_at), 'dd/MM', { locale: ptBR }),
      'Sensação Geral': item.overall_feeling,
      'Energia': (energy as any[])[index]?.energy_level,
      'Dor': (pain as any[])[index]?.pain_level,
      'Náusea': (nausea as any[])[index]?.nausea_level,
      'Sono': (sleep as any[])[index]?.sleep_quality,
    }));

    setChartData(combined);
  };

  const exportToPDF = async () => {
    try {
      toast.info("Gerando relatório PDF...");
      
      const selectedMed = medications.find(m => m.id === selectedMedication);
      const reportData = {
        medication: selectedMed?.name || "Medicamento",
        logs: logs.slice(0, 30), // últimos 30 registros
        chartData,
        generatedAt: new Date().toISOString(),
      };

      // Aqui você pode usar jspdf ou integrar com edge function para gerar PDF
      // Por simplicidade, vou criar um JSON que o médico pode importar
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diario-efeitos-${selectedMed?.name}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error("Erro ao exportar relatório");
    }
  };

  const getAverageRating = (metric: keyof SideEffectLog) => {
    const values = logs
      .map(log => log[metric] as number)
      .filter(v => v !== null && v !== undefined);
    
    if (values.length === 0) return 0;
    return (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Diário de Efeitos</h2>
          <p className="text-muted-foreground">
            Acompanhe como você se sente após cada dose
          </p>
        </div>
        <Button onClick={exportToPDF} disabled={logs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar para Médico
        </Button>
      </div>

      {/* Medication Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Medicamento:</label>
            <Select value={selectedMedication} onValueChange={setSelectedMedication}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione um medicamento" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sensação Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('overall_feeling')}</div>
            <p className="text-xs text-muted-foreground">média de 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Energia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('energy_level')}</div>
            <p className="text-xs text-muted-foreground">média de 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('pain_level')}</div>
            <p className="text-xs text-muted-foreground">média de 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Náusea</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('nausea_level')}</div>
            <p className="text-xs text-muted-foreground">média de 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sono</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('sleep_quality')}</div>
            <p className="text-xs text-muted-foreground">média de 5</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução dos Efeitos
            </CardTitle>
            <CardDescription>
              Acompanhe como os efeitos variam ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[1, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Sensação Geral" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="Energia" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Dor" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Náusea" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Sono" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum registro encontrado. Comece a registrar seus efeitos após cada dose!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
