import { useState, useEffect } from "react";
import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Stethoscope, Activity, Pill, CheckCircle2, Clock, Link as LinkIcon, Plus, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const { toast } = useToast();
  const navigate = useNavigate();

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
        title: t('healthCalendar.loadError'),
        description: t('healthCalendar.loadErrorDesc'),
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
      title: t('healthCalendar.integrationDev'),
      description: t('healthCalendar.integrationDevDesc'),
    });
  };

  const syncWithGoogle = async () => {
    if (!isConnected) {
      toast({
        title: t('healthCalendar.connectFirst'),
        description: t('healthCalendar.connectFirstDesc'),
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
        title: t('healthCalendar.syncComplete'),
        description: t('healthCalendar.syncCompleteDesc', { count: String(data.eventsCount.total) }),
      });

      fetchEvents(selectedDate);
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: t('healthCalendar.syncError'),
        description: t('healthCalendar.syncErrorDesc'),
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

  const filteredEvents = filterType === "all" 
    ? events 
    : events.filter(e => e.type === filterType);

  const selectedDateEvents = filteredEvents.filter(event => 
    format(new Date(event.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const eventDates = filteredEvents.map(e => new Date(e.date));

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const weekDays = viewMode === "week" 
    ? eachDayOfInterval({
        start: startOfWeek(selectedDate, { locale: dateLocale }),
        end: endOfWeek(selectedDate, { locale: dateLocale })
      })
    : [];

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => 
      isSameDay(new Date(event.date), day)
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendário principal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle>{t('healthCalendar.title')}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchEvents(selectedDate)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")} className="w-auto">
                <TabsList>
                  <TabsTrigger value="month">{t('healthCalendar.month')}</TabsTrigger>
                  <TabsTrigger value="week">{t('healthCalendar.week')}</TabsTrigger>
                </TabsList>
              </Tabs>

              {!isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectGoogleCalendar}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {t('healthCalendar.googleAgenda')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncWithGoogle}
                >
                  {t('healthCalendar.sync')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Navegação do mês */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: dateLocale })}
              </h3>
              <Button variant="outline" size="sm" onClick={handleToday}>
                {t('healthCalendar.today')}
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              <Filter className="h-3 w-3 mr-2" />
              {t('healthCalendar.all')}
            </Button>
            <Button
              variant={filterType === "consulta" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("consulta")}
            >
              <Stethoscope className="h-3 w-3 mr-2" />
              {t('healthCalendar.consultations')}
            </Button>
            <Button
              variant={filterType === "exame" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("exame")}
            >
              <Activity className="h-3 w-3 mr-2" />
              {t('healthCalendar.exams')}
            </Button>
            <Button
              variant={filterType === "medicamento" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("medicamento")}
            >
              <Pill className="h-3 w-3 mr-2" />
              {t('healthCalendar.medications')}
            </Button>
          </div>

          {viewMode === "month" ? (
            <div className="grid md:grid-cols-[2fr,1fr] gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-md border w-full"
                  locale={dateLocale}
                  modifiers={{
                    hasEvent: eventDates,
                    isToday: [new Date()]
                  }}
                  modifiersClassNames={{
                    hasEvent: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
                    isToday: "bg-primary text-primary-foreground font-bold"
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    {format(selectedDate, "d 'de' MMMM", { locale: dateLocale })}
                  </h3>
                  <Badge variant="secondary">
                    {selectedDateEvents.length} {selectedDateEvents.length === 1 ? t('cofreDoc.event') : t('cofreDoc.events')}
                  </Badge>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  {loading ? (
                    <p className="text-muted-foreground text-center py-8">{t('healthCalendar.loading')}</p>
                  ) : selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-muted-foreground">{t('healthCalendar.noEvents')}</p>
                      <Button size="sm" onClick={() => navigate('/saude/consultas')}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('healthCalendar.addEvent')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.map(event => (
                        <Card 
                          key={event.id}
                          className={`border-l-4 ${
                            event.color === 'blue' ? 'border-l-blue-500' :
                            event.color === 'green' ? 'border-l-green-500' :
                            event.color === 'orange' ? 'border-l-orange-500' :
                            'border-l-purple-500'
                          } hover:shadow-md transition-shadow cursor-pointer`}
                        >
                          <CardContent className="p-4">
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
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {format(new Date(event.date), "HH:mm", { locale: dateLocale })}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <Card 
                      key={day.toISOString()}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSameDay(day, selectedDate) ? 'ring-2 ring-primary' : ''
                      } ${isToday(day) ? 'bg-primary/5' : ''}`}
                      onClick={() => handleDateSelect(day)}
                    >
                      <CardContent className="p-3">
                        <div className="text-center space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {format(day, "EEE", { locale: dateLocale })}
                          </p>
                          <p className={`text-lg font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                            {format(day, "d")}
                          </p>
                          {dayEvents.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {dayEvents.length}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('healthCalendar.eventsFor')} {format(selectedDate, "EEEE, d 'de' MMMM", { locale: dateLocale })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {selectedDateEvents.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t('healthCalendar.noEvents')}</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateEvents.map(event => (
                          <Card key={event.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">{getEventIcon(event.type)}</div>
                                <div className="flex-1">
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-sm text-muted-foreground">{event.description}</p>
                                  <Badge variant="outline" className="text-xs mt-2">
                                    {format(new Date(event.date), "HH:mm", { locale: dateLocale })}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
