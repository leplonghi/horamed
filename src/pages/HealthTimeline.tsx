import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HelpTooltip from "@/components/HelpTooltip";
import { 
  Calendar, 
  FileText, 
  Pill, 
  Activity, 
  Stethoscope,
  TrendingUp,
  Clock,
  ChevronRight
} from "lucide-react";
import { format, isThisMonth, isThisYear, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  type: 'consulta' | 'exame' | 'medicamento' | 'documento' | 'sinal_vital';
  date: string;
  title: string;
  description: string;
  metadata?: any;
}

export default function HealthTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("todos");

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allEvents: TimelineEvent[] = [];

      // Buscar consultas
      const { data: consultas } = await supabase
        .from("consultas_medicas")
        .select("*")
        .eq("user_id", user.id)
        .order("data_consulta", { ascending: false })
        .limit(30);

      consultas?.forEach(c => {
        allEvents.push({
          id: c.id,
          type: 'consulta',
          date: c.data_consulta,
          title: c.especialidade || 'Consulta Médica',
          description: c.medico_nome || '',
          metadata: c
        });
      });

      // Buscar exames
      const { data: exames } = await supabase
        .from("exames_laboratoriais")
        .select("*")
        .eq("user_id", user.id)
        .order("data_exame", { ascending: false })
        .limit(30);

      exames?.forEach(e => {
        allEvents.push({
          id: e.id,
          type: 'exame',
          date: e.data_exame,
          title: 'Exame Laboratorial',
          description: e.laboratorio || '',
          metadata: e
        });
      });

      // Buscar medicamentos adicionados
      const { data: medicamentos } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      medicamentos?.forEach(m => {
        allEvents.push({
          id: m.id,
          type: 'medicamento',
          date: m.created_at || '',
          title: m.name,
          description: m.dose_text || '',
          metadata: m
        });
      });

      // Buscar documentos
      const { data: documentos } = await supabase
        .from("documentos_saude")
        .select("*, categorias_saude(label)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      documentos?.forEach(d => {
        allEvents.push({
          id: d.id,
          type: 'documento',
          date: d.created_at || '',
          title: d.title || 'Documento',
          description: (d.categorias_saude as any)?.label || '',
          metadata: d
        });
      });

      // Ordenar por data decrescente
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error("Erro ao carregar timeline:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'consulta': return <Stethoscope className={iconClass} />;
      case 'exame': return <Activity className={iconClass} />;
      case 'medicamento': return <Pill className={iconClass} />;
      case 'documento': return <FileText className={iconClass} />;
      case 'sinal_vital': return <TrendingUp className={iconClass} />;
      default: return <Calendar className={iconClass} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'consulta': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'exame': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'medicamento': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'documento': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'sinal_vital': return 'bg-rose-500/10 text-rose-600 border-rose-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consulta': return 'Consulta';
      case 'exame': return 'Exame';
      case 'medicamento': return 'Medicamento';
      case 'documento': return 'Documento';
      case 'sinal_vital': return 'Vital';
      default: return 'Outro';
    }
  };

  const filteredEvents = filterType === "todos" 
    ? events 
    : events.filter(e => e.type === filterType);

  // Agrupar eventos por mês
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const monthKey = format(new Date(event.date), 'MMMM yyyy', { locale: ptBR });
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  const formatEventDate = (date: string) => {
    const eventDate = new Date(date);
    if (isThisMonth(eventDate)) {
      return format(eventDate, "d 'de' MMMM", { locale: ptBR });
    }
    return format(eventDate, "d MMM", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-lg mx-auto px-4 py-6">
        {/* Header com explicação */}
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Linha do Tempo</h1>
          <HelpTooltip 
            content="Visualize todo seu histórico de saúde organizado cronologicamente. Consultas, exames, medicamentos e documentos em um só lugar."
            iconSize="lg"
          />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Seu histórico de saúde organizado por data
        </p>

        {/* Filtros compactos */}
        <Tabs value={filterType} onValueChange={setFilterType} className="mb-4">
          <TabsList className="w-full grid grid-cols-5 h-9">
            <TabsTrigger value="todos" className="text-xs px-2">Todos</TabsTrigger>
            <TabsTrigger value="consulta" className="text-xs px-2">
              <Stethoscope className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="exame" className="text-xs px-2">
              <Activity className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="medicamento" className="text-xs px-2">
              <Pill className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="documento" className="text-xs px-2">
              <FileText className="h-3 w-3" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum evento encontrado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Adicione medicamentos, consultas ou documentos para ver aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month}>
                {/* Cabeçalho do mês */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {month}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Eventos do mês - layout compacto */}
                <div className="space-y-2">
                  {monthEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-accent/50 transition-colors cursor-pointer group"
                    >
                      {/* Ícone com cor */}
                      <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>

                      {/* Conteúdo principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {event.title}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Data e seta */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatEventDate(event.date)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legenda compacta */}
        {filteredEvents.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Mostrando {filteredEvents.length} eventos • Toque para ver detalhes
            </p>
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
