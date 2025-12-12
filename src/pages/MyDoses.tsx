import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import DoseTimeline from "@/components/DoseTimeline";
import DoseActionModal from "@/components/DoseActionModal";
import NextDoseWidget from "@/components/NextDoseWidget";
import MedicationSummaryCard from "@/components/MedicationSummaryCard";
import StreakBadge from "@/components/StreakBadge";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, TrendingUp, History, Pill } from "lucide-react";

interface DoseInstance {
  id: string;
  item_id: string;
  due_at: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  taken_at: string | null;
  items: {
    name: string;
    dose_text: string | null;
    user_id: string;
  };
  stock?: {
    units_left: number;
  }[];
}

export default function MyDoses() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'history'>('today');
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDose, setSelectedDose] = useState<DoseInstance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const [customTimeModalOpen, setCustomTimeModalOpen] = useState(false);
  const [customTime, setCustomTime] = useState<string>('');
  const { showFeedback } = useFeedbackToast();

  useEffect(() => {
    loadDoses();
    loadStreak();
  }, [activeTab]);

  const loadDoses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: Date;
      let endDate: Date;

      switch (activeTab) {
        case 'today':
          startDate = startOfDay(new Date());
          endDate = endOfDay(new Date());
          break;
        case 'week':
          startDate = startOfWeek(new Date(), { locale: ptBR });
          endDate = endOfWeek(new Date(), { locale: ptBR });
          break;
        case 'history':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
      }

      const { data, error } = await supabase
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
            user_id
          )
        `)
        .eq('items.user_id', user.id)
        .gte('due_at', startDate.toISOString())
        .lte('due_at', endDate.toISOString())
        .order('due_at', { ascending: true });

      if (error) throw error;

      // Buscar estoque separadamente
      const itemIds = [...new Set((data || []).map(d => d.item_id))];
      const { data: stockData } = await supabase
        .from('stock')
        .select('item_id, units_left')
        .in('item_id', itemIds);

      const stockMap = new Map(stockData?.map(s => [s.item_id, s]) || []);
      
      const dosesWithStock = (data || []).map(dose => ({
        ...dose,
        stock: stockMap.get(dose.item_id) ? [{ units_left: stockMap.get(dose.item_id)!.units_left }] : []
      })) as DoseInstance[];

      setDoses(dosesWithStock);
    } catch (error) {
      console.error('Erro ao carregar doses:', error);
      showFeedback('dose-missed', { customMessage: 'Erro ao carregar doses' });
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_adherence_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStreak(data?.current_streak || 0);
    } catch (error) {
      console.error('Erro ao carregar sequência:', error);
    }
  };

  const handleQuickTake = async (dose: DoseInstance) => {
    try {
      const takenTime = new Date();
      const { error } = await supabase
        .from('dose_instances')
        .update({
          status: 'taken',
          taken_at: takenTime.toISOString(),
        })
        .eq('id', dose.id);

      if (error) throw error;

      // Decrementar estoque
      if (dose.stock && dose.stock.length > 0) {
        const { error: stockError } = await supabase
          .from('stock')
          .update({ units_left: Math.max(0, dose.stock[0].units_left - 1) })
          .eq('item_id', dose.item_id);

        if (stockError) throw stockError;
      }

      // Check if period is complete
      const periodDoses = doses.filter(d => {
        const hour = new Date(d.due_at).getHours();
        const doseHour = new Date(dose.due_at).getHours();
        return Math.floor(hour / 6) === Math.floor(doseHour / 6);
      });
      const allTaken = periodDoses.every(d => 
        d.id === dose.id || d.status === 'taken'
      );

      if (allTaken) {
        const periodName = new Date(dose.due_at).getHours() < 12 ? 'manhã' : 
                          new Date(dose.due_at).getHours() < 18 ? 'tarde' : 'noite';
        showFeedback('period-complete', { periodName });
      } else {
        showFeedback('dose-taken', {
          medicationName: dose.items.name,
          takenTime: format(takenTime, "HH:mm"),
        });
      }

      loadDoses();
      loadStreak();
    } catch (error) {
      console.error('Erro ao marcar dose:', error);
      showFeedback('dose-missed', { customMessage: 'Erro ao marcar dose como tomada' });
    }
  };

  const handleStatusUpdate = async (action: 'taken' | 'missed' | 'skipped' | 'custom-time') => {
    if (!selectedDose) return;

    try {
      if (action === 'custom-time') {
        // Use current time as custom time for now
        const customTakenAt = new Date().toISOString();
        const { error } = await supabase
          .from('dose_instances')
          .update({ status: 'taken', taken_at: customTakenAt })
          .eq('id', selectedDose.id);
        
        if (error) throw error;
        showFeedback('dose-taken', { medicationName: selectedDose.items.name });
        loadDoses();
        loadStreak();
        return;
      }

      const updateData: any = {
        status: action,
        ...(action === 'taken' && { taken_at: new Date().toISOString() }),
      };

      const { error } = await supabase
        .from('dose_instances')
        .update(updateData)
        .eq('id', selectedDose.id);

      if (error) throw error;

      if (action === 'taken' && selectedDose.stock && selectedDose.stock.length > 0) {
        const { error: stockError } = await supabase
          .from('stock')
          .update({ units_left: Math.max(0, selectedDose.stock[0].units_left - 1) })
          .eq('item_id', selectedDose.item_id);

        if (stockError) throw stockError;
      }

      // Show appropriate feedback
      if (action === 'taken') {
        showFeedback('dose-taken', { medicationName: selectedDose.items.name });
      } else if (action === 'missed') {
        showFeedback('dose-missed');
      } else if (action === 'skipped') {
        showFeedback('dose-skipped');
      }

      loadDoses();
      loadStreak();
    } catch (error) {
      console.error('Erro ao atualizar dose:', error);
      showFeedback('dose-missed', { customMessage: 'Erro ao atualizar status da dose' });
    }
  };

  const handleMoreOptions = (dose: DoseInstance) => {
    setSelectedDose(dose);
    setModalOpen(true);
  };

  const calculateProgress = () => {
    if (doses.length === 0) return 0;
    const takenCount = doses.filter(d => d.status === 'taken').length;
    return Math.round((takenCount / doses.length) * 100);
  };

  const progress = calculateProgress();
  const nextDose = doses.find(d => d.status === 'scheduled' && new Date(d.due_at) > new Date());

  // Group medications for summary cards
  const medicationGroups = doses.reduce((acc, dose) => {
    if (!acc[dose.item_id]) {
      acc[dose.item_id] = {
        id: dose.item_id,
        name: dose.items.name,
        doses: [],
      };
    }
    acc[dose.item_id].doses.push(dose);
    return acc;
  }, {} as Record<string, { id: string; name: string; doses: typeof doses }>);

  const medications = Object.values(medicationGroups);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8">
        {/* Header com Streak */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Minhas Doses</h1>
              <p className="text-muted-foreground">
                Acompanhe seu compromisso com a saúde
              </p>
            </div>
            {streak > 0 && <StreakBadge streak={streak} type="current" />}
          </div>

          {/* Card de Adesão */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">Compromisso {activeTab === 'today' ? 'de Hoje' : activeTab === 'week' ? 'da Semana' : 'Mensal'}</span>
                  <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>
               <Progress value={progress} className="h-3" />
               <p className="text-sm text-muted-foreground">
                 {progress >= 90 && "🎉 Você está indo muito bem!"}
                 {progress >= 70 && progress < 90 && "💪 Bom trabalho! Continue assim!"}
                 {progress >= 50 && progress < 70 && "⚡ Você pode melhorar!"}
                 {progress < 50 && "Vamos retomar o compromisso!"}
               </p>
              </div>
            </CardContent>
          </Card>

          {/* Próxima Dose Widget */}
          {nextDose && activeTab === 'today' && (
            <NextDoseWidget
              dose={nextDose}
              onTake={() => handleQuickTake(nextDose)}
            />
          )}

          {/* Medication Summary Cards */}
          {activeTab === 'today' && medications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Seus Medicamentos</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {medications.map(med => (
                  <MedicationSummaryCard key={med.id} medication={med} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Hoje
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : doses.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma dose programada para hoje</CardContent></Card>
            ) : (
              <DoseTimeline
                doses={doses}
                period="today"
                onTake={handleQuickTake}
                onMore={handleMoreOptions}
                groupByTime={true}
              />
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : doses.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma dose nesta semana</CardContent></Card>
            ) : (
              <DoseTimeline
                doses={doses}
                period="week"
                onTake={handleQuickTake}
                onMore={handleMoreOptions}
                groupByTime={false}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : doses.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Sem histórico nos últimos 30 dias</CardContent></Card>
            ) : (
              <DoseTimeline
                doses={doses}
                period="month"
                onTake={handleQuickTake}
                onMore={handleMoreOptions}
                groupByTime={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <DoseActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dose={selectedDose}
        onAction={handleStatusUpdate}
      />
    </div>
  );
}
