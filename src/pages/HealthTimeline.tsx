import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  FileText, 
  Pill, 
  Activity, 
  Stethoscope,
  Filter,
  TrendingUp,
  ChevronRight,
  Clock
} from "lucide-react";
import { format, isToday, isYesterday, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useUserProfiles } from "@/hooks/useUserProfiles";

interface TimelineEvent {
  id: string;
  type: 'consulta' | 'exame' | 'medicamento' | 'documento' | 'sinal_vital';
  date: string;
  title: string;
  description: string;
  metadata?: any;
}

export default function HealthTimeline() {
  const { activeProfile } = useUserProfiles();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("todos");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, []);

  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      loadTimeline();
    }
  }, [activeProfile?.id]);

  const loadTimeline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileId = activeProfile?.id;
      const allEvents: TimelineEvent[] = [];

      // Fetch all data in parallel for better performance
      const [consultasRes, examesRes, medicamentosRes, documentosRes, sinaisRes] = await Promise.allSettled([
        supabase
          .from("consultas_medicas")
          .select("*")
          .eq("user_id", user.id)
          .eq("profile_id", profileId || user.id)
          .order("data_consulta", { ascending: false })
          .limit(100),
        
        supabase
          .from("exames_laboratoriais")
          .select("*")
          .eq("user_id", user.id)
          .order("data_exame", { ascending: false })
          .limit(100),
        
        supabase
          .from("items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        
        supabase
          .from("documentos_saude")
          .select("*, categorias_saude(label)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        
        supabase
          .from("sinais_vitais")
          .select("*")
          .eq("user_id", user.id)
          .order("data_medicao", { ascending: false })
          .limit(100)
      ]);

      // Process consultas
      if (consultasRes.status === 'fulfilled' && consultasRes.value.data) {
        consultasRes.value.data.forEach(c => {
          allEvents.push({
            id: c.id,
            type: 'consulta',
            date: c.data_consulta,
            title: `Consulta: ${c.especialidade || 'Médica'}`,
            description: `${c.medico_nome || 'Médico'} - ${c.local || 'Local não informado'}`,
            metadata: c
          });
        });
      }

      // Process exames
      if (examesRes.status === 'fulfilled' && examesRes.value.data) {
        examesRes.value.data.forEach(e => {
          allEvents.push({
            id: e.id,
            type: 'exame',
            date: e.data_exame,
            title: `Exame Laboratorial`,
            description: `${e.laboratorio || 'Laboratório'} - ${e.medico_solicitante || 'Médico'}`,
            metadata: e
          });
        });
      }

      // Process medicamentos
      if (medicamentosRes.status === 'fulfilled' && medicamentosRes.value.data) {
        medicamentosRes.value.data.forEach(m => {
          allEvents.push({
            id: m.id,
            type: 'medicamento',
            date: m.created_at,
            title: `Medicamento: ${m.name}`,
            description: m.dose_text || 'Dose não especificada',
            metadata: m
          });
        });
      }

      // Process documentos
      if (documentosRes.status === 'fulfilled' && documentosRes.value.data) {
        documentosRes.value.data.forEach(d => {
          allEvents.push({
            id: d.id,
            type: 'documento',
            date: d.created_at,
            title: d.title || 'Documento',
            description: (d.categorias_saude as any)?.label || 'Documento de saúde',
            metadata: d
          });
        });
      }

      // Process sinais vitais
      if (sinaisRes.status === 'fulfilled' && sinaisRes.value.data) {
        sinaisRes.value.data.forEach(s => {
          const valores = [];
          if (s.pressao_sistolica) valores.push(`PA: ${s.pressao_sistolica}/${s.pressao_diastolica}`);
          if (s.glicemia) valores.push(`Glicemia: ${s.glicemia}`);
          if (s.peso_kg) valores.push(`Peso: ${s.peso_kg}kg`);

          allEvents.push({
            id: s.id,
            type: 'sinal_vital',
            date: s.data_medicao,
            title: 'Sinais Vitais',
            description: valores.join(' • '),
            metadata: s
          });
        });
      }

      // Sort by date descending
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error("Erro ao carregar timeline:", error);
      toast.error("Erro ao carregar histórico. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consulta': return <Stethoscope className="h-5 w-5" />;
      case 'exame': return <Activity className="h-5 w-5" />;
      case 'medicamento': return <Pill className="h-5 w-5" />;
      case 'documento': return <FileText className="h-5 w-5" />;
      case 'sinal_vital': return <TrendingUp className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'consulta': return 'bg-blue-500 text-blue-50';
      case 'exame': return 'bg-purple-500 text-purple-50';
      case 'medicamento': return 'bg-primary text-primary-foreground';
      case 'documento': return 'bg-orange-500 text-orange-50';
      case 'sinal_vital': return 'bg-red-500 text-red-50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDateLabel = (date: string) => {
    const eventDate = new Date(date);
    if (isToday(eventDate)) return "Hoje";
    if (isYesterday(eventDate)) return "Ontem";
    return format(eventDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const groupEventsByDate = (events: TimelineEvent[]) => {
    const grouped: { [key: string]: TimelineEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = format(startOfDay(new Date(event.date)), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return Object.entries(grouped).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  };

  const filteredEvents = filterType === 'todos' 
    ? events 
    : events.filter(e => e.type === filterType);

  const groupedEvents = groupEventsByDate(filteredEvents);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          
          {/* Header */}
          <div className="space-y-2 animate-fade-in">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="h-8 w-8 text-primary" />
              Linha do Tempo
            </h1>
            <p className="text-muted-foreground">
              Histórico completo da sua saúde em ordem cronológica
            </p>
          </div>

          {/* Stats */}
          {!loading && events.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <Stethoscope className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-2xl font-bold">{events.filter(e => e.type === 'consulta').length}</div>
                  <div className="text-xs text-muted-foreground">Consultas</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <Activity className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <div className="text-2xl font-bold">{events.filter(e => e.type === 'exame').length}</div>
                  <div className="text-xs text-muted-foreground">Exames</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <Pill className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">{events.filter(e => e.type === 'medicamento').length}</div>
                  <div className="text-xs text-muted-foreground">Medicamentos</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <FileText className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <div className="text-2xl font-bold">{events.filter(e => e.type === 'documento').length}</div>
                  <div className="text-xs text-muted-foreground">Documentos</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <div className="text-2xl font-bold">{events.filter(e => e.type === 'sinal_vital').length}</div>
                  <div className="text-xs text-muted-foreground">Sinais Vitais</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Tabs value={filterType} onValueChange={setFilterType} className="animate-fade-in">
            <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 gap-1">
              <TabsTrigger value="todos" className="text-xs md:text-sm">Todos</TabsTrigger>
              <TabsTrigger value="consulta" className="text-xs md:text-sm">Consultas</TabsTrigger>
              <TabsTrigger value="exame" className="text-xs md:text-sm">Exames</TabsTrigger>
              <TabsTrigger value="medicamento" className="text-xs md:text-sm">Remédios</TabsTrigger>
              <TabsTrigger value="documento" className="text-xs md:text-sm">Docs</TabsTrigger>
              <TabsTrigger value="sinal_vital" className="text-xs md:text-sm">Vitais</TabsTrigger>
            </TabsList>

            <TabsContent value={filterType} className="space-y-6 mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <Card className="animate-fade-in">
                  <CardContent className="py-16 text-center">
                    <div className="bg-muted rounded-full p-4 w-fit mx-auto mb-4">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Nenhum evento encontrado</h3>
                    <p className="text-sm text-muted-foreground">
                      Não há eventos de saúde registrados ainda
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-450px)] md:h-auto">
                  <div className="space-y-8">
                    {groupedEvents.map(([dateKey, dateEvents], groupIndex) => (
                      <div key={dateKey} className="space-y-4 animate-fade-in" style={{ animationDelay: `${groupIndex * 50}ms` }}>
                        {/* Date Header */}
                        <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                          <div className="h-px flex-1 bg-border" />
                          <div className="px-4 py-1 bg-muted/50 rounded-full">
                            <time className="text-sm font-medium text-foreground">
                              {getDateLabel(dateEvents[0].date)}
                            </time>
                          </div>
                          <div className="h-px flex-1 bg-border" />
                        </div>

                        {/* Events for this date */}
                        <div className="relative space-y-4">
                          {/* Timeline Line */}
                          <div className="absolute left-5 md:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-border via-border/50 to-transparent" />

                          {dateEvents.map((event, index) => (
                            <div 
                              key={event.id} 
                              className="relative pl-12 md:pl-16 group animate-fade-in"
                              style={{ animationDelay: `${(groupIndex * 50) + (index * 30)}ms` }}
                            >
                              {/* Timeline Dot */}
                              <div className={`absolute left-3 md:left-4 top-3 w-4 h-4 md:w-5 md:h-5 rounded-full ${getEventColor(event.type).split(' ')[0]} border-4 border-background shadow-lg group-hover:scale-125 transition-transform duration-200`} />

                              <Card className="hover:shadow-lg transition-all duration-300 hover:translate-x-1 cursor-pointer border-l-4"
                                onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                style={{
                                  borderLeftColor: getEventColor(event.type).includes('blue') ? 'rgb(59, 130, 246)' :
                                    getEventColor(event.type).includes('purple') ? 'rgb(168, 85, 247)' :
                                    getEventColor(event.type).includes('primary') ? 'hsl(var(--primary))' :
                                    getEventColor(event.type).includes('orange') ? 'rgb(249, 115, 22)' :
                                    getEventColor(event.type).includes('red') ? 'rgb(239, 68, 68)' : 'rgb(156, 163, 175)'
                                }}>
                                <CardContent className="p-3 md:p-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 md:p-2.5 rounded-lg ${getEventColor(event.type)} flex-shrink-0`}>
                                      {getEventIcon(event.type)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1">
                                          {event.title}
                                        </h3>
                                        <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${expandedEvent === event.id ? 'rotate-90' : ''}`} />
                                      </div>
                                      
                                      <time className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(event.date), "HH:mm", { locale: ptBR })}
                                      </time>

                                      <p className={`text-xs md:text-sm text-muted-foreground mt-2 ${expandedEvent === event.id ? '' : 'line-clamp-2'}`}>
                                        {event.description}
                                      </p>

                                      {expandedEvent === event.id && event.metadata && (
                                        <div className="mt-3 pt-3 border-t space-y-2 text-xs text-muted-foreground animate-fade-in">
                                          {event.type === 'consulta' && (
                                            <>
                                              {event.metadata.especialidade && <div>Especialidade: {event.metadata.especialidade}</div>}
                                              {event.metadata.observacoes && <div>Observações: {event.metadata.observacoes}</div>}
                                            </>
                                          )}
                                          {event.type === 'medicamento' && (
                                            <>
                                              {event.metadata.dose_text && <div>Dosagem: {event.metadata.dose_text}</div>}
                                              {event.metadata.frequency && <div>Frequência: {event.metadata.frequency}</div>}
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Navigation />
    </>
  );
}
