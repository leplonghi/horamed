import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import StreakBadge from "@/components/StreakBadge";
import InteractiveTimelineChart from "@/components/InteractiveTimelineChart";
import DoseTimeline from "@/components/DoseTimeline";
import InfoDialog from "@/components/InfoDialog";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Clock,
  Target,
  BarChart3,
  Minus
} from "lucide-react";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { useUserProfiles } from "@/hooks/useUserProfiles";

interface DoseInstance {
  id: string;
  item_id: string;
  due_at: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  taken_at: string | null;
  items: {
    name: string;
    dose_text: string | null;
  };
}

interface Stats {
  total: number;
  taken: number;
  missed: number;
  skipped: number;
  progressRate: number;
}

interface MedicationStats {
  name: string;
  total: number;
  taken: number;
  progressRate: number;
}

export default function History() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [previousDoses, setPreviousDoses] = useState<DoseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [medicationStats, setMedicationStats] = useState<MedicationStats[]>([]);
  const { activeProfile } = useUserProfiles();

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  // Reload data when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      loadAllData();
    }
  }, [activeProfile?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDoses(),
        loadStreak(),
        loadMedicationStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadDoses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: Date;
      let endDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      const now = new Date();

      if (activeTab === 'today') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        
        previousStartDate = subDays(startDate, 1);
        previousEndDate = subDays(endDate, 1);
      } else if (activeTab === 'week') {
        startDate = startOfWeek(now, { locale: ptBR });
        endDate = endOfWeek(now, { locale: ptBR });
        previousStartDate = subWeeks(startDate, 1);
        previousEndDate = subWeeks(endDate, 1);
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = subMonths(startDate, 1);
        previousEndDate = subMonths(endDate, 1);
      }

      // Load current period doses
      let dosesQuery = supabase
        .from('dose_instances')
        .select(`
          id,
          item_id,
          due_at,
          status,
          taken_at,
          items!inner(
            name,
            dose_text,
            user_id,
            profile_id
          )
        `)
        .eq('items.user_id', user.id)
        .gte('due_at', startDate.toISOString())
        .lte('due_at', endDate.toISOString());

      if (activeProfile) {
        dosesQuery = dosesQuery.eq('items.profile_id', activeProfile.id);
      }

      const { data, error } = await dosesQuery.order('due_at', { ascending: false });

      if (error) throw error;
      setDoses((data || []) as DoseInstance[]);

      // Load previous period doses for comparison
      let prevDosesQuery = supabase
        .from('dose_instances')
        .select(`
          id,
          item_id,
          due_at,
          status,
          taken_at,
          items!inner(
            name,
            dose_text,
            user_id,
            profile_id
          )
        `)
        .eq('items.user_id', user.id)
        .gte('due_at', previousStartDate.toISOString())
        .lte('due_at', previousEndDate.toISOString());

      if (activeProfile) {
        prevDosesQuery = prevDosesQuery.eq('items.profile_id', activeProfile.id);
      }

      const { data: prevData, error: prevError } = await prevDosesQuery;

      if (prevError) throw prevError;
      setPreviousDoses((prevData || []) as DoseInstance[]);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_adherence_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStreak(data?.current_streak || 0);
      setLongestStreak(data?.longest_streak || 0);
    } catch (error) {
      console.error('Erro ao carregar sequência:', error);
    }
  };

  const loadMedicationStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      let statsQuery = supabase
        .from('dose_instances')
        .select(`
          item_id,
          status,
          items!inner(
            name,
            user_id,
            profile_id
          )
        `)
        .eq('items.user_id', user.id)
        .gte('due_at', thirtyDaysAgo.toISOString())
        .lte('due_at', now.toISOString());

      if (activeProfile) {
        statsQuery = statsQuery.eq('items.profile_id', activeProfile.id);
      }

      const { data, error } = await statsQuery;

      if (error) throw error;

      // Group by medication
      const statsByMed = (data || []).reduce((acc, dose: any) => {
        const medName = dose.items.name;
        if (!acc[medName]) {
          acc[medName] = { name: medName, total: 0, taken: 0 };
        }
        acc[medName].total++;
        if (dose.status === 'taken') {
          acc[medName].taken++;
        }
        return acc;
      }, {} as Record<string, { name: string; total: number; taken: number }>);

      const stats = Object.values(statsByMed).map(stat => ({
        ...stat,
        progressRate: stat.total > 0 ? Math.round((stat.taken / stat.total) * 100) : 0
      })).sort((a, b) => b.progressRate - a.progressRate);

      setMedicationStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const calculateStats = (dosesData: DoseInstance[]): Stats => {
    const total = dosesData.length;
    const taken = dosesData.filter(d => d.status === 'taken').length;
    const missed = dosesData.filter(d => d.status === 'missed').length;
    const skipped = dosesData.filter(d => d.status === 'skipped').length;
    const progressRate = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    return { total, taken, missed, skipped, progressRate };
  };

  const currentStats = calculateStats(doses);
  const previousStats = calculateStats(previousDoses);
  const difference = currentStats.progressRate - previousStats.progressRate;

  const getPeriodLabel = () => {
    switch (activeTab) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
    }
  };

  const getPreviousPeriodLabel = () => {
    switch (activeTab) {
      case 'today': return 'Ontem';
      case 'week': return 'Semana Passada';
      case 'month': return 'Mês Passado';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <PageSkeleton />
        <Navigation />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico Completo</h1>
            <p className="text-muted-foreground">
              Análises detalhadas do seu compromisso com o tratamento
            </p>
          </div>
          {streak > 0 && <StreakBadge streak={streak} type="current" />}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Target className="h-4 w-4" />
                <span className="text-sm">Progresso</span>
                <InfoDialog
                  title="O que é o progresso?"
                  description="Progresso é a porcentagem de doses tomadas corretamente no período selecionado. Um bom progresso ajuda a garantir a eficácia do tratamento."
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-primary">
                {currentStats.progressRate}%
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {difference > 0 && (
                  <>
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">+{difference}%</span>
                  </>
                )}
                {difference < 0 && (
                  <>
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">{difference}%</span>
                  </>
                )}
                {difference === 0 && (
                  <>
                    <Minus className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">sem mudança</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Sequência</span>
                <InfoDialog
                  title="O que é a sequência?"
                  description="Sequência (streak) são dias consecutivos com progresso acima de 80%. Quanto maior sua sequência, mais consistente você está sendo com seu tratamento!"
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {streak}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recorde: {longestStreak} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Tomadas</span>
                <InfoDialog
                  title="Doses tomadas"
                  description="Número de doses que você tomou no período selecionado. Cada dose tomada no horário correto contribui para o sucesso do seu tratamento."
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-success">
                {currentStats.taken}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                de {currentStats.total} doses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Perdidas</span>
                <InfoDialog
                  title="Doses perdidas"
                  description="Doses que não foram tomadas no período. Use os lembretes e configurações do app para reduzir este número e melhorar seu tratamento."
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-destructive">
                {currentStats.missed + currentStats.skipped}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {currentStats.missed} perdidas, {currentStats.skipped} puladas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Comparison Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparação de Períodos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{getPeriodLabel()}</span>
                   <span className="text-lg font-bold text-primary">
                     {currentStats.progressRate}%
                   </span>
                  </div>
                  <Progress value={currentStats.progressRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentStats.taken} de {currentStats.total} doses tomadas
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {getPreviousPeriodLabel()}
                    </span>
                   <span className="text-lg font-bold text-muted-foreground">
                     {previousStats.progressRate}%
                   </span>
                  </div>
                  <Progress value={previousStats.progressRate} className="h-2 opacity-50" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {previousStats.taken} de {previousStats.total} doses tomadas
                  </p>
                </div>

                {difference !== 0 && (
                  <div className={`p-3 rounded-lg ${difference > 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <p className={`text-sm font-medium ${difference > 0 ? 'text-success' : 'text-destructive'}`}>
                      {difference > 0 ? (
                        <>🎉 Parabéns! Você melhorou {Math.abs(difference)}% comparado com {getPreviousPeriodLabel().toLowerCase()}!</>
                      ) : (
                        <>⚠️ Seu compromisso caiu {Math.abs(difference)}% comparado com {getPreviousPeriodLabel().toLowerCase()}. Vamos retomar!</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactive Timeline Chart */}
            <InteractiveTimelineChart 
              doses={doses}
              period={activeTab}
            />

            {/* Dose Timeline */}
            <DoseTimeline 
              doses={doses}
              period={activeTab}
            />

            {/* Medication Stats */}
            {medicationStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compromisso por Medicamento (últimos 30 dias)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medicationStats.map((med) => (
                     <div key={med.name}>
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-medium">{med.name}</span>
                         <span className="text-sm font-bold text-primary">
                           {med.progressRate}%
                         </span>
                       </div>
                       <Progress value={med.progressRate} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {med.taken} de {med.total} doses tomadas
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}
