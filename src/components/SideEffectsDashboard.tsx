import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSideEffectsLog, SideEffectLog } from "@/hooks/useSideEffectsLog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Download, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface SideEffectsDashboardProps {
  itemId?: string;
}

export function SideEffectsDashboard({ itemId }: SideEffectsDashboardProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { logs, isLoading, fetchLogs, getCorrelationData } = useSideEffectsLog();
  const [medications, setMedications] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedMedication, setSelectedMedication] = useState<string>(itemId || "");
  const [chartData, setChartData] = useState<any[]>([]);

  const dateLocale = language === 'pt' ? ptBR : enUS;

  // Chart labels using translation keys
  const chartLabels = {
    overallFeeling: t('sideEffects.overallFeeling'),
    energy: t('sideEffects.energy'),
    pain: t('sideEffects.pain'),
    nausea: t('sideEffects.nausea'),
    sleep: t('sideEffects.sleep'),
  };

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
      date: format(new Date(item.recorded_at), 'dd/MM', { locale: dateLocale }),
      [chartLabels.overallFeeling]: item.overall_feeling,
      [chartLabels.energy]: (energy as any[])[index]?.energy_level,
      [chartLabels.pain]: (pain as any[])[index]?.pain_level,
      [chartLabels.nausea]: (nausea as any[])[index]?.nausea_level,
      [chartLabels.sleep]: (sleep as any[])[index]?.sleep_quality,
    }));

    setChartData(combined);
  };

  const exportToPDF = async () => {
    try {
      toast.info(t('sideEffects.generatingPdf'));
      
      const selectedMed = medications.find(m => m.id === selectedMedication);
      const reportData = {
        medication: selectedMed?.name || t('today.medication'),
        logs: logs.slice(0, 30),
        chartData,
        generatedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `side-effects-${selectedMed?.name}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('sideEffects.exportSuccess'));
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(t('sideEffects.exportError'));
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
          <h2 className="text-2xl font-bold">{t('sideEffects.diaryTitle')}</h2>
          <p className="text-muted-foreground">
            {t('sideEffects.diarySubtitle')}
          </p>
        </div>
        <Button onClick={exportToPDF} disabled={logs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {t('sideEffects.exportToDoctorBtn')}
        </Button>
      </div>

      {/* Medication Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">{t('sideEffects.medicationLabel')}</label>
            <Select value={selectedMedication} onValueChange={setSelectedMedication}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder={t('sideEffects.selectMedication')} />
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
            <CardTitle className="text-sm font-medium">{t('sideEffects.overallFeeling')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('overall_feeling')}</div>
            <p className="text-xs text-muted-foreground">{t('sideEffects.averageOf5')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('sideEffects.energy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('energy_level')}</div>
            <p className="text-xs text-muted-foreground">{t('sideEffects.averageOf5')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('sideEffects.pain')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('pain_level')}</div>
            <p className="text-xs text-muted-foreground">{t('sideEffects.averageOf5')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('sideEffects.nausea')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('nausea_level')}</div>
            <p className="text-xs text-muted-foreground">{t('sideEffects.averageOf5')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('sideEffects.sleep')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating('sleep_quality')}</div>
            <p className="text-xs text-muted-foreground">{t('sideEffects.averageOf5')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('sideEffects.evolutionTitle')}
            </CardTitle>
            <CardDescription>
              {t('sideEffects.evolutionSubtitle')}
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
                <Line type="monotone" dataKey={chartLabels.overallFeeling} stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey={chartLabels.energy} stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey={chartLabels.pain} stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey={chartLabels.nausea} stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey={chartLabels.sleep} stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t('sideEffects.noRecords')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
