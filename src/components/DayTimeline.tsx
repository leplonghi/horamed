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
        return <Pill className="h-6 w-6" />;
      case "appointment":
        return <Stethoscope className="h-6 w-6" />;
      case "exam":
        return <TestTube className="h-6 w-6" />;
      default:
        return <Calendar className="h-6 w-6" />;
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
    <div className="space-y-4">
      {/* Header do Dia */}
      <div className="text-center py-3">
        <p className="text-sm text-muted-foreground">
          {format(date, "EEEE", { locale: ptBR })}
        </p>
        <p className="text-xl font-bold">
          {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Timeline do Dia */}
      <div className="space-y-4">
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
              <div key={hour} className="relative pl-12">
                {/* Hora */}
                <div className="absolute left-0 top-0 text-right w-10">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {hour}:00
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-3">
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
                          "border-l-4 transition-all hover:shadow-lg",
                          isDone && "bg-green-50 border-green-500",
                          isMissed && "bg-red-50 border-red-500",
                          !isDone && !isMissed && "border-primary"
                        )}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Ícone */}
                            <div
                              className={cn(
                                "p-3 rounded-full text-white shrink-0",
                                isDone && "bg-green-500",
                                isMissed && "bg-red-500",
                                !isDone && !isMissed && getTypeColor(item.type)
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : (
                                getTypeIcon(item.type)
                              )}
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1">
                                  <Badge variant="outline" className="mb-2 text-xs">
                                    {getTypeLabel(item.type)}
                                  </Badge>
                                  <h3 className="text-xl font-bold mb-1">
                                    {item.title}
                                  </h3>
                                  {item.subtitle && (
                                    <p className="text-base text-muted-foreground">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-3xl font-bold text-primary">
                                    {item.time}
                                  </p>
                                  {isPast && !isDone && !isMissed && (
                                    <Badge variant="destructive" className="mt-1">
                                      Atrasado
                                    </Badge>
                                  )}
                                  {isDone && (
                                    <Badge variant="default" className="mt-1 bg-green-500">
                                      ✓ Feito
                                    </Badge>
                                  )}
                                  {isMissed && (
                                    <Badge variant="destructive" className="mt-1">
                                      Perdido
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Ações - apenas para medicamentos pendentes */}
                              {item.type === "medication" && !isDone && !isMissed && (
                                <div className="flex gap-3 mt-4">
                                  <Button
                                    size="lg"
                                    onClick={item.onMarkDone}
                                    className="flex-1 text-lg py-6"
                                  >
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    ✓ Tomei
                                  </Button>
                                  {item.onSnooze && (
                                    <Button
                                      size="lg"
                                      variant="outline"
                                      onClick={item.onSnooze}
                                      className="text-lg py-6"
                                    >
                                      <Clock className="h-5 w-5 mr-2" />
                                      Mais tarde
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
