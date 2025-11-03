import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isBefore, isAfter, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, Calendar, Stethoscope, TestTube, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  time: string;
  type: "medication" | "appointment" | "exam";
  title: string;
  subtitle?: string;
  status: "pending" | "done" | "missed";
  onMarkDone?: () => void;
  onSnooze?: () => void;
}

interface DayTimelineProps {
  date: Date;
  items: TimelineItem[];
  onDateChange: (date: Date) => void;
}

export default function DayTimeline({ date, items, onDateChange }: DayTimelineProps) {
  const now = new Date();
  const isCurrentDay = isToday(date);

  // Agrupar por hora
  const groupedItems = items.reduce((acc, item) => {
    const hour = item.time.split(":")[0];
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "medication":
        return <Pill className="h-4 w-4" />;
      case "appointment":
        return <Stethoscope className="h-4 w-4" />;
      case "exam":
        return <TestTube className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "medication":
        return "bg-blue-500";
      case "appointment":
        return "bg-green-500";
      case "exam":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "medication":
        return "Medicamento";
      case "appointment":
        return "Consulta";
      case "exam":
        return "Exame";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-2 overflow-x-hidden w-full">
      {/* Header do Dia */}
      <div className="text-center py-1.5 mb-1.5">
        <p className="text-[10px] text-muted-foreground truncate">
          {format(date, "EEEE", { locale: ptBR })}
        </p>
        <p className="text-sm font-bold truncate">
          {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Timeline do Dia */}
      <div className="space-y-2 w-full overflow-x-hidden">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl font-semibold mb-2">Nenhum evento hoje</p>
              <p className="text-muted-foreground">
                Você não tem medicamentos, consultas ou exames agendados para este dia.
              </p>
            </CardContent>
          </Card>
        ) : (
          hours.map((hour) => {
            const hourItems = groupedItems[hour];
            if (!hourItems || hourItems.length === 0) return null;

            return (
              <div key={hour} className="flex gap-2 w-full overflow-x-hidden">
                {/* Hora */}
                <div className="shrink-0 w-10 pt-0.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {hour}:00
                  </span>
                </div>

                {/* Items */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  {hourItems.map((item) => {
                    const isPast = isCurrentDay && isBefore(
                      parseISO(`${format(date, "yyyy-MM-dd")}T${item.time}`),
                      now
                    );
                    const isDone = item.status === "done";
                    const isMissed = item.status === "missed";

                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "border-l-4 transition-all hover:shadow-md w-full overflow-hidden",
                          isDone && "bg-success/5 border-success dark:bg-success/10",
                          isMissed && "bg-destructive/5 border-destructive dark:bg-destructive/10",
                          !isDone && !isMissed && "border-primary"
                        )}
                      >
                        <CardContent className="p-2 overflow-x-hidden">
                          <div className="flex items-center gap-2">
                            {/* Ícone */}
                            <div
                              className={cn(
                                "p-1.5 rounded-lg shrink-0",
                                isDone && "bg-success text-success-foreground",
                                isMissed && "bg-destructive text-destructive-foreground",
                                !isDone && !isMissed && "bg-primary/10 text-primary"
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                getTypeIcon(item.type)
                              )}
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xs font-semibold truncate">
                                    {item.title}
                                  </h3>
                                  {item.subtitle && (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-bold text-primary">
                                    {item.time}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className="text-[9px] h-4">
                                  {getTypeLabel(item.type)}
                                </Badge>
                                {isPast && !isDone && !isMissed && (
                                  <Badge variant="destructive" className="text-[9px] h-4">
                                    Atrasado
                                  </Badge>
                                )}
                                {isDone && (
                                  <Badge className="bg-success text-[9px] h-4">
                                    ✓ Feito
                                  </Badge>
                                )}
                                {isMissed && (
                                  <Badge variant="destructive" className="text-[9px] h-4">
                                    Perdido
                                  </Badge>
                                )}
                              </div>

                              {/* Ações - apenas para medicamentos pendentes */}
                              {item.type === "medication" && !isDone && !isMissed && (
                                <div className="flex gap-1.5 mt-1.5">
                                  <Button
                                    size="sm"
                                    onClick={item.onMarkDone}
                                    className="flex-1 h-7 text-[10px] px-2"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Tomei
                                  </Button>
                                  {item.onSnooze && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={item.onSnooze}
                                      className="h-7 text-[10px] px-2"
                                    >
                                      <Clock className="h-3 w-3 mr-0.5" />
                                      Adiar
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
