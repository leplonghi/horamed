import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, Calendar, Stethoscope, TestTube, Pill, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

export default function DayTimeline({
  date,
  items,
  onDateChange
}: DayTimelineProps) {
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

  const getTypeIcon = (type: string, isDone: boolean) => {
    if (isDone) return <CheckCircle2 className="h-4 w-4" />;
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

  const getTypeStyles = (type: string, status: string, isPast: boolean) => {
    const isDone = status === "done";
    const isMissed = status === "missed";

    if (isDone) {
      return {
        card: "bg-gradient-to-r from-success/10 via-success/5 to-transparent border-l-success",
        iconBg: "bg-success text-success-foreground",
        badge: "bg-success/20 text-success border-success/30",
      };
    }
    if (isMissed) {
      return {
        card: "bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent border-l-destructive",
        iconBg: "bg-destructive text-destructive-foreground",
        badge: "bg-destructive/20 text-destructive border-destructive/30",
      };
    }
    if (isPast) {
      return {
        card: "bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border-l-warning animate-pulse",
        iconBg: "bg-warning text-warning-foreground",
        badge: "bg-warning/20 text-warning border-warning/30",
      };
    }

    switch (type) {
      case "medication":
        return {
          card: "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-primary hover:from-primary/15",
          iconBg: "bg-primary/20 text-primary",
          badge: "bg-primary/20 text-primary border-primary/30",
        };
      case "appointment":
        return {
          card: "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-l-emerald-500 hover:from-emerald-500/15",
          iconBg: "bg-emerald-500/20 text-emerald-600",
          badge: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
        };
      case "exam":
        return {
          card: "bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent border-l-violet-500 hover:from-violet-500/15",
          iconBg: "bg-violet-500/20 text-violet-600",
          badge: "bg-violet-500/20 text-violet-600 border-violet-500/30",
        };
      default:
        return {
          card: "bg-gradient-to-r from-muted/50 to-transparent border-l-muted-foreground",
          iconBg: "bg-muted text-muted-foreground",
          badge: "bg-muted text-muted-foreground border-muted",
        };
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
    <div className="space-y-3 overflow-x-hidden w-full">
      {/* Header do Dia */}
      <div className="text-center py-2 mb-2">
        <p className="text-xs text-muted-foreground capitalize">
          {format(date, "EEEE", { locale: ptBR })}
        </p>
        <p className="text-base font-bold text-foreground">
          {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Timeline do Dia */}
      <div className="space-y-3 w-full overflow-x-hidden">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">Nenhum evento hoje</p>
              <p className="text-muted-foreground text-sm">
                Você não tem medicamentos, consultas ou exames agendados para este dia.
              </p>
            </CardContent>
          </Card>
        ) : (
          hours.map(hour => {
            const hourItems = groupedItems[hour];
            if (!hourItems || hourItems.length === 0) return null;

            return (
              <div key={hour} className="flex gap-3 w-full overflow-x-hidden">
                {/* Hora com linha vertical */}
                <div className="shrink-0 flex flex-col items-center">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                    {hour}:00
                  </span>
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/30 to-transparent mt-2" />
                </div>

                {/* Items */}
                <div className="flex-1 space-y-2 min-w-0 pb-4">
                  {hourItems.map((item, index) => {
                    const isPast = isCurrentDay && isBefore(parseISO(`${format(date, "yyyy-MM-dd")}T${item.time}`), now);
                    const isDone = item.status === "done";
                    const isMissed = item.status === "missed";
                    const styles = getTypeStyles(item.type, item.status, isPast && !isDone && !isMissed);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={cn(
                            "border-l-4 transition-all duration-300 hover:shadow-lg overflow-hidden",
                            styles.card,
                            isDone && "opacity-80"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Ícone */}
                              <div className={cn("p-2.5 rounded-xl shrink-0 shadow-sm", styles.iconBg)}>
                                {getTypeIcon(item.type, isDone)}
                              </div>

                              {/* Conteúdo */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                      "font-semibold text-foreground",
                                      isDone && "line-through text-muted-foreground"
                                    )}>
                                      {item.title}
                                    </h3>
                                    {item.subtitle && (
                                      <p className="text-sm text-muted-foreground truncate">
                                        {item.subtitle}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-lg font-bold text-primary shrink-0">
                                    {item.time}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <Badge variant="outline" className={cn("text-xs border", styles.badge)}>
                                    {getTypeLabel(item.type)}
                                  </Badge>
                                  {isPast && !isDone && !isMissed && (
                                    <Badge className="bg-warning/90 text-warning-foreground text-xs animate-pulse">
                                      ⚠️ Atrasado
                                    </Badge>
                                  )}
                                  {isDone && (
                                    <Badge className="bg-success text-success-foreground text-xs">
                                      ✓ Tomado
                                    </Badge>
                                  )}
                                  {isMissed && (
                                    <Badge variant="destructive" className="text-xs">
                                      Perdido
                                    </Badge>
                                  )}
                                </div>

                                {/* Ações - apenas para medicamentos pendentes */}
                                {item.type === "medication" && !isDone && !isMissed && (
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      onClick={item.onMarkDone}
                                      className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                      Tomei
                                    </Button>
                                    {item.onSnooze && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={item.onSnooze}
                                        className="h-9 px-3 border-muted-foreground/30"
                                      >
                                        <Timer className="h-4 w-4 mr-1" />
                                        Adiar
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
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