import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import DoseTimeline from "@/components/DoseTimeline";
import DoseStatusDialog from "@/components/DoseStatusDialog";
import DoseActionButton from "@/components/DoseActionButton";
import StreakBadge from "@/components/StreakBadge";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar as CalendarIcon, TrendingUp, History } from "lucide-react";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [streak, setStreak] = useState<number>(0);

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
      toast.error('Erro ao carregar doses');
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
      const { error } = await supabase
        .from('dose_instances')
        .update({
          status: 'taken',
          taken_at: new Date().toISOString(),
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

      toast.success(`✓ ${dose.items.name} marcado como tomado!`);
      loadDoses();
      loadStreak();
    } catch (error) {
      console.error('Erro ao marcar dose:', error);
      toast.error('Erro ao marcar dose como tomada');
    }
  };

  const handleStatusUpdate = async (status: 'taken' | 'missed' | 'skipped') => {
    if (!selectedDose) return;

    try {
      const updateData: any = {
        status,
        ...(status === 'taken' && { taken_at: new Date().toISOString() }),
      };

      const { error } = await supabase
        .from('dose_instances')
        .update(updateData)
        .eq('id', selectedDose.id);

      if (error) throw error;

      if (status === 'taken' && selectedDose.stock && selectedDose.stock.length > 0) {
        const { error: stockError } = await supabase
          .from('stock')
          .update({ units_left: Math.max(0, selectedDose.stock[0].units_left - 1) })
          .eq('item_id', selectedDose.item_id);

        if (stockError) throw stockError;
      }

      const messages = {
        taken: '✓ Dose marcada como tomada!',
        missed: '⚠️ Dose marcada como esquecida',
        skipped: '→ Dose pulada',
      };

      toast.success(messages[status]);
      loadDoses();
      loadStreak();
    } catch (error) {
      console.error('Erro ao atualizar dose:', error);
      toast.error('Erro ao atualizar status da dose');
    }
  };

  const calculateAdherence = () => {
    if (doses.length === 0) return 0;
    const takenCount = doses.filter(d => d.status === 'taken').length;
    return Math.round((takenCount / doses.length) * 100);
  };

  const adherence = calculateAdherence();
  const nextDose = doses.find(d => d.status === 'scheduled' && new Date(d.due_at) > new Date());

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
                  <span className="text-2xl font-bold text-primary">{adherence}%</span>
                </div>
                <Progress value={adherence} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {adherence >= 90 && "🎉 Você está indo muito bem!"}
                  {adherence >= 70 && adherence < 90 && "💪 Bom trabalho! Continue assim!"}
                  {adherence >= 50 && adherence < 70 && "⚡ Você pode melhorar!"}
                  {adherence < 50 && "Vamos retomar o compromisso!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Próxima Dose */}
          {nextDose && activeTab === 'today' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Próxima dose</p>
                      <h3 className="font-semibold text-lg">{nextDose.items.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ⏰ {format(new Date(nextDose.due_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <DoseActionButton
                      variant="taken"
                      onClick={() => handleQuickTake(nextDose)}
                      className="shrink-0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <DoseStatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        doseName={selectedDose?.items.name || ''}
        onSelectStatus={handleStatusUpdate}
      />
    </div>
  );
}
