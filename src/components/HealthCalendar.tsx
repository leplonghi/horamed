import { useState, useEffect } from "react";
import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Stethoscope, Activity, Pill, CheckCircle2, Clock, Link as LinkIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  type: 'consulta' | 'exame' | 'medicamento' | 'checkup' | 'reforco_vacina' | 'renovacao_exame' | 'consulta';
  title: string;
  date: string;
  description?: string;
  location?: string;
  status?: string;
  completed?: boolean;
  color: string;
}

interface HealthCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export default function HealthCalendar({ onDateSelect }: HealthCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents(selectedDate);
  }, [selectedDate]);

  const fetchEvents = async (date: Date) => {
    setLoading(true);
    try {
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'fetch',
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });

      if (error) throw error;
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Erro ao carregar eventos",
        description: "Não foi possível carregar os eventos do calendário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const connectGoogleCalendar = async () => {
    toast({
      title: "Integração em desenvolvimento",
      description: "A sincronização com Google Agenda estará disponível em breve.",
    });
  };

  const syncWithGoogle = async () => {
    if (!isConnected) {
      toast({
        title: "Conecte-se ao Google",
        description: "Você precisa conectar sua conta do Google primeiro.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast({
        title: "Sincronização concluída",
        description: `${data.eventsCount.total} eventos sincronizados com sucesso.`,
      });

      fetchEvents(selectedDate);
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Google Agenda.",
        variant: "destructive"
      });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consulta':
        return <Stethoscope className="h-4 w-4" />;
      case 'exame':
        return <Activity className="h-4 w-4" />;
      case 'medicamento':
        return <Pill className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getEventColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 text-blue-700 border-blue-200',
      green: 'bg-green-500/10 text-green-700 border-green-200',
      orange: 'bg-orange-500/10 text-orange-700 border-orange-200',
      purple: 'bg-purple-500/10 text-purple-700 border-purple-200',
    };
    return colors[color] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const selectedDateEvents = events.filter(event => 
    format(new Date(event.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const eventDates = events.map(e => new Date(e.date));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Calendário de Saúde</CardTitle>
          <div className="flex gap-2">
            {!isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={connectGoogleCalendar}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Conectar Google Agenda
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={syncWithGoogle}
              >
                Sincronizar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                locale={ptBR}
                modifiers={{
                  hasEvent: eventDates
                }}
                modifiersClassNames={{
                  hasEvent: "bg-primary/10 font-bold"
                }}
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
              </h3>
              
              {loading ? (
                <p className="text-muted-foreground">Carregando eventos...</p>
              ) : selectedDateEvents.length === 0 ? (
                <p className="text-muted-foreground">Nenhum evento neste dia.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedDateEvents.map(event => (
                    <Card 
                      key={event.id}
                      className={`border ${getEventColor(event.color)}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{event.title}</p>
                              {event.status === 'taken' || event.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : event.status === 'scheduled' ? (
                                <Clock className="h-4 w-4 text-blue-600" />
                              ) : null}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                            {event.location && (
                              <p className="text-xs text-muted-foreground">
                                📍 {event.location}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.date), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Consultas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Exames</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm">Medicamentos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm">Eventos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
