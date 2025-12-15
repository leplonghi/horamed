import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HelpTooltip from "@/components/HelpTooltip";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  FileText, 
  Pill, 
  Activity, 
  Stethoscope,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
  MapPin,
  User,
  FlaskConical,
  Heart,
  Syringe
} from "lucide-react";
import { format, isThisMonth, isToday, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  type: 'consulta' | 'exame' | 'medicamento' | 'documento' | 'vacina' | 'dose';
  date: string;
  title: string;
  description: string;
  metadata?: any;
}

export default function HealthTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("todos");
  const [stats, setStats] = useState({
    consultas: 0,
    exames: 0,
    medicamentos: 0,
    documentos: 0,
    vacinas: 0,
    dosesTomadas: 0
  });

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allEvents: TimelineEvent[] = [];
      let consultas = 0, exames = 0, medicamentos = 0, documentos = 0, vacinas = 0, dosesTomadas = 0;

      // Buscar consultas
      const { data: consultasData } = await supabase
        .from("consultas_medicas")
        .select("*")
        .eq("user_id", user.id)
        .order("data_consulta", { ascending: false })
        .limit(50);

      consultasData?.forEach(c => {
        consultas++;
        allEvents.push({
          id: c.id,
          type: 'consulta',
          date: c.data_consulta,
          title: c.especialidade || 'Consulta Médica',
          description: c.medico_nome ? `Dr(a). ${c.medico_nome}` : '',
          metadata: { ...c, local: c.local }
        });
      });

      // Buscar exames
      const { data: examesData } = await supabase
        .from("exames_laboratoriais")
        .select("*, valores_exames(*)")
        .eq("user_id", user.id)
        .order("data_exame", { ascending: false })
        .limit(50);

      examesData?.forEach(e => {
        exames++;
        const valoresCount = e.valores_exames?.length || 0;
        allEvents.push({
          id: e.id,
          type: 'exame',
          date: e.data_exame,
          title: 'Exame Laboratorial',
          description: e.laboratorio ? `${e.laboratorio}${valoresCount > 0 ? ` • ${valoresCount} parâmetros` : ''}` : '',
          metadata: { ...e, valoresCount }
        });
      });

      // Buscar medicamentos adicionados
      const { data: medicamentosData } = await supabase
        .from("items")
        .select("*, stock(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      medicamentosData?.forEach(m => {
        medicamentos++;
        const stockInfo = m.stock?.[0];
        allEvents.push({
          id: m.id,
          type: 'medicamento',
          date: m.created_at || '',
          title: m.name,
          description: m.dose_text || m.category || '',
          metadata: { ...m, stockInfo }
        });
      });

      // Buscar documentos
      const { data: documentosData } = await supabase
        .from("documentos_saude")
        .select("*, categorias_saude(label)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      documentosData?.forEach(d => {
        documentos++;
        allEvents.push({
          id: d.id,
          type: 'documento',
          date: d.created_at || '',
          title: d.title || 'Documento',
          description: (d.categorias_saude as any)?.label || d.provider || '',
          metadata: d
        });
      });

      // Buscar vacinas
      const { data: vacinasData } = await supabase
        .from("vaccination_records")
        .select("*")
        .eq("user_id", user.id)
        .order("application_date", { ascending: false })
        .limit(50);

      vacinasData?.forEach(v => {
        vacinas++;
        allEvents.push({
          id: v.id,
          type: 'vacina',
          date: v.application_date,
          title: v.vaccine_name,
          description: v.dose_description || `${v.dose_number || 1}ª dose`,
          metadata: v
        });
      });

      // Buscar doses tomadas (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: dosesData } = await supabase
        .from("dose_instances")
        .select("*, items(name)")
        .eq("status", "taken")
        .gte("taken_at", thirtyDaysAgo.toISOString())
        .order("taken_at", { ascending: false })
        .limit(100);

      dosesData?.forEach(d => {
        dosesTomadas++;
        if (dosesTomadas <= 20) { // Limitar doses na timeline
          allEvents.push({
            id: d.id,
            type: 'dose',
            date: d.taken_at || d.due_at,
            title: `Dose tomada: ${d.items?.name || 'Medicamento'}`,
            description: d.delay_minutes ? `${d.delay_minutes} min de atraso` : 'No horário',
            metadata: d
          });
        }
      });

      setStats({ consultas, exames, medicamentos, documentos, vacinas, dosesTomadas });

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
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'consulta': return <Stethoscope className={iconClass} />;
      case 'exame': return <FlaskConical className={iconClass} />;
      case 'medicamento': return <Pill className={iconClass} />;
      case 'documento': return <FileText className={iconClass} />;
      case 'vacina': return <Syringe className={iconClass} />;
      case 'dose': return <Heart className={iconClass} />;
      default: return <Calendar className={iconClass} />;
    }
  };

  const getEventStyles = (type: string) => {
    switch (type) {
      case 'consulta': return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-600',
        dot: 'bg-blue-500'
      };
      case 'exame': return {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-600',
        dot: 'bg-purple-500'
      };
      case 'medicamento': return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-600',
        dot: 'bg-emerald-500'
      };
      case 'documento': return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-600',
        dot: 'bg-amber-500'
      };
      case 'vacina': return {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        text: 'text-cyan-600',
        dot: 'bg-cyan-500'
      };
      case 'dose': return {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        text: 'text-rose-600',
        dot: 'bg-rose-500'
      };
      default: return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
        dot: 'bg-muted-foreground'
      };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consulta': return 'Consulta';
      case 'exame': return 'Exame';
      case 'medicamento': return 'Medicamento';
      case 'documento': return 'Documento';
      case 'vacina': return 'Vacina';
      case 'dose': return 'Dose';
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
    if (isToday(eventDate)) {
      return format(eventDate, "HH:mm");
    }
    if (isThisMonth(eventDate)) {
      return format(eventDate, "d 'de' MMM", { locale: ptBR });
    }
    return format(eventDate, "d MMM", { locale: ptBR });
  };

  const getRelativeTime = (date: string) => {
    const days = differenceInDays(new Date(), new Date(date));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} sem atrás`;
    return null;
  };

  const filterButtons = [
    { value: 'todos', label: 'Todos', icon: Sparkles },
    { value: 'consulta', label: 'Consultas', icon: Stethoscope },
    { value: 'exame', label: 'Exames', icon: FlaskConical },
    { value: 'medicamento', label: 'Remédios', icon: Pill },
    { value: 'vacina', label: 'Vacinas', icon: Syringe },
    { value: 'documento', label: 'Docs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-lg mx-auto px-4 py-6">
        {/* Header animado */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Linha do Tempo</h1>
                <HelpTooltip 
                  content="Visualize todo seu histórico de saúde organizado cronologicamente. Consultas, exames, medicamentos, vacinas e documentos em um só lugar."
                  iconSize="lg"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Sua jornada de saúde completa
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards de estatísticas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-3 text-center">
              <Stethoscope className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{stats.consultas}</p>
              <p className="text-[10px] text-muted-foreground">Consultas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-3 text-center">
              <FlaskConical className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">{stats.exames}</p>
              <p className="text-[10px] text-muted-foreground">Exames</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-3 text-center">
              <Pill className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600">{stats.medicamentos}</p>
              <p className="text-[10px] text-muted-foreground">Remédios</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
            <CardContent className="p-3 text-center">
              <Syringe className="h-5 w-5 text-cyan-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-cyan-600">{stats.vacinas}</p>
              <p className="text-[10px] text-muted-foreground">Vacinas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-3 text-center">
              <FileText className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600">{stats.documentos}</p>
              <p className="text-[10px] text-muted-foreground">Documentos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
            <CardContent className="p-3 text-center">
              <Heart className="h-5 w-5 text-rose-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-rose-600">{stats.dosesTomadas}</p>
              <p className="text-[10px] text-muted-foreground">Doses (30d)</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtros com scroll horizontal */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 overflow-x-auto pb-2 -mx-4 px-4"
        >
          <div className="flex gap-2 min-w-max">
            {filterButtons.map((btn) => {
              const Icon = btn.icon;
              const isActive = filterType === btn.value;
              return (
                <Button
                  key={btn.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(btn.value)}
                  className={`gap-1.5 ${isActive ? '' : 'bg-background'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{btn.label}</span>
                </Button>
              );
            })}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <Clock className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">Carregando seu histórico...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">Nenhum evento encontrado</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Adicione medicamentos, consultas, vacinas ou documentos para ver seu histórico aqui
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-border to-transparent" />

            <AnimatePresence mode="popLayout">
              {Object.entries(groupedEvents).map(([month, monthEvents], groupIndex) => (
                <motion.div 
                  key={month}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className="mb-8"
                >
                  {/* Cabeçalho do mês */}
                  <div className="flex items-center gap-3 mb-4 ml-[10px]">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10">
                      <Calendar className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wider">
                      {month}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Eventos do mês */}
                  <div className="space-y-3 ml-[10px]">
                    {monthEvents.map((event, eventIndex) => {
                      const styles = getEventStyles(event.type);
                      const relativeTime = getRelativeTime(event.date);
                      
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: eventIndex * 0.05 }}
                          className="relative pl-8"
                        >
                          {/* Dot na timeline */}
                          <div className={`absolute left-[3px] top-4 w-3 h-3 rounded-full ${styles.dot} border-2 border-background shadow-sm z-10`} />
                          
                          {/* Card do evento */}
                          <Card className={`${styles.bg} ${styles.border} border hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Ícone */}
                                <div className={`p-2 rounded-lg ${styles.bg} ${styles.text} shrink-0`}>
                                  {getEventIcon(event.type)}
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground truncate">
                                        {event.title}
                                      </p>
                                      {event.description && (
                                        <p className="text-sm text-muted-foreground truncate">
                                          {event.description}
                                        </p>
                                      )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
                                  </div>

                                  {/* Metadados adicionais */}
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <Badge variant="outline" className={`text-[10px] ${styles.text} border-current/20`}>
                                      {getTypeLabel(event.type)}
                                    </Badge>
                                    
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatEventDate(event.date)}
                                    </span>

                                    {relativeTime && (
                                      <span className="text-[10px] text-muted-foreground/70">
                                        {relativeTime}
                                      </span>
                                    )}

                                    {event.metadata?.local && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {event.metadata.local}
                                      </span>
                                    )}

                                    {event.metadata?.valoresCount > 0 && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Activity className="h-3 w-3" />
                                        {event.metadata.valoresCount} resultados
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer com resumo */}
        {filteredEvents.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-6 border-t text-center"
          >
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredEvents.length}</span> eventos no seu histórico
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Toque em qualquer evento para ver mais detalhes
            </p>
          </motion.div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
