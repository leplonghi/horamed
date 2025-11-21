import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, eachDayOfInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, MinusCircle, Clock } from "lucide-react";
import { useState } from "react";

interface Dose {
  id: string;
  due_at: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  taken_at: string | null;
  items: {
    name: string;
  };
}

interface InteractiveTimelineChartProps {
  doses: Dose[];
  period: 'today' | 'week' | 'month';
}

export default function InteractiveTimelineChart({ doses, period }: InteractiveTimelineChartProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Agrupar doses por dia
  const dosesByDay = doses.reduce((acc, dose) => {
    const day = format(parseISO(dose.due_at), 'yyyy-MM-dd');
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(dose);
    return acc;
  }, {} as Record<string, Dose[]>);

  const days = Object.keys(dosesByDay).sort();
  const selectedDoses = selectedDay ? dosesByDay[selectedDay] || [] : [];

  const getDayStats = (dayDoses: Dose[]) => {
    const total = dayDoses.length;
    const taken = dayDoses.filter(d => d.status === 'taken').length;
    const missed = dayDoses.filter(d => d.status === 'missed').length;
    const skipped = dayDoses.filter(d => d.status === 'skipped').length;
    const scheduled = dayDoses.filter(d => d.status === 'scheduled').length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
    return { total, taken, missed, skipped, scheduled, rate };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped':
        return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'bg-success';
    if (rate >= 70) return 'bg-primary';
    if (rate >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Linha do Tempo Interativa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Clique em um dia para ver os detalhes das doses
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Visual */}
        <div className="relative">
          {/* Linha de conexão */}
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-border" />
          
          {/* Pontos da timeline */}
          <div className="relative flex justify-between items-start">
            {days.map((day) => {
              const dayDoses = dosesByDay[day];
              const stats = getDayStats(dayDoses);
              const isSelected = selectedDay === day;
              const statusColor = getStatusColor(stats.rate);

              return (
                <div
                  key={day}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                >
                  {/* Ponto */}
                  <div
                    className={`
                      relative z-10 w-12 h-12 rounded-full border-4 border-background
                      flex items-center justify-center transition-all duration-200
                      ${statusColor}
                      ${isSelected ? 'scale-125 shadow-lg' : 'group-hover:scale-110'}
                    `}
                  >
                    <span className="text-xs font-bold text-white">
                      {stats.rate}%
                    </span>
                  </div>

                  {/* Data */}
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(parseISO(day), 'dd/MM', { locale: ptBR })}
                    </p>
                    <p className={`text-[10px] ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {format(parseISO(day), 'EEE', { locale: ptBR })}
                    </p>
                  </div>

                  {/* Badge de doses */}
                  <div className={`
                    mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    {stats.taken}/{stats.total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">≥90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">70-89%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">50-69%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">&lt;50%</span>
          </div>
        </div>

        {/* Detalhes do dia selecionado */}
        {selectedDay && selectedDoses.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {format(parseISO(selectedDay), "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2">
              {selectedDoses
                .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
                .map((dose) => (
                  <div
                    key={dose.id}
                    className="flex items-center justify-between p-3 rounded-md bg-background"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(dose.status)}
                      <div>
                        <p className="text-sm font-medium">{dose.items.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(dose.due_at), 'HH:mm')}
                          {dose.taken_at && dose.status === 'taken' && (
                            <> • Tomado às {format(parseISO(dose.taken_at), 'HH:mm')}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${dose.status === 'taken' ? 'bg-success/10 text-success' : ''}
                      ${dose.status === 'missed' ? 'bg-destructive/10 text-destructive' : ''}
                      ${dose.status === 'skipped' ? 'bg-muted text-muted-foreground' : ''}
                      ${dose.status === 'scheduled' ? 'bg-primary/10 text-primary' : ''}
                    `}>
                      {dose.status === 'taken' && 'Tomado'}
                      {dose.status === 'missed' && 'Perdido'}
                      {dose.status === 'skipped' && 'Pulado'}
                      {dose.status === 'scheduled' && 'Agendado'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
