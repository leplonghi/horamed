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

  const getTypeStyles = (type: string, status: string, isPast: boolean, itemName?: string) => {
    const isDone = status === "done";
    const isMissed = status === "missed";

    if (isDone) {
      return {
        card: "bg-success/5 border-l-success/60",
        iconBg: "bg-success/15 text-success",
      };
    }
    if (isMissed) {
      return {
        card: "bg-destructive/5 border-l-destructive/60",
        iconBg: "bg-destructive/15 text-destructive",
      };
    }
    if (isPast) {
      return {
        card: "bg-warning/5 border-l-warning animate-pulse",
        iconBg: "bg-warning/15 text-warning",
      };
    }

    // Variações sutis de cores baseadas no nome do medicamento
    const getMedicationColorVariant = (name?: string) => {
      if (!name) return { class: "bg-blue-500/5 border-l-blue-500/70", icon: "bg-blue-500/12 text-blue-600" };
      
      const hash = name.toLowerCase().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const variants = [
        { class: "bg-blue-500/5 border-l-blue-500/70", icon: "bg-blue-500/12 text-blue-600" },
        { class: "bg-indigo-500/5 border-l-indigo-500/70", icon: "bg-indigo-500/12 text-indigo-600" },
        { class: "bg-violet-500/5 border-l-violet-500/70", icon: "bg-violet-500/12 text-violet-600" },
        { class: "bg-purple-500/5 border-l-purple-500/70", icon: "bg-purple-500/12 text-purple-600" },
        { class: "bg-sky-500/5 border-l-sky-500/70", icon: "bg-sky-500/12 text-sky-600" },
        { class: "bg-cyan-500/5 border-l-cyan-500/70", icon: "bg-cyan-500/12 text-cyan-600" },
        { class: "bg-teal-500/5 border-l-teal-500/70", icon: "bg-teal-500/12 text-teal-600" },
      ];
      
      return variants[Math.abs(hash) % variants.length];
    };

    switch (type) {
      case "medication": {
        const variant = getMedicationColorVariant(itemName);
        return {
          card: variant.class,
          iconBg: variant.icon,
        };
      }
      case "appointment":
        return {
          card: "bg-emerald-500/5 border-l-emerald-500/70",
          iconBg: "bg-emerald-500/12 text-emerald-600",
        };
      case "exam":
        return {
          card: "bg-amber-500/5 border-l-amber-500/70",
          iconBg: "bg-amber-500/12 text-amber-600",
        };
      default:
        return {
          card: "bg-muted/30 border-l-muted-foreground/40",
          iconBg: "bg-muted text-muted-foreground",
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
                    const styles = getTypeStyles(item.type, item.status, isPast && !isDone && !isMissed, item.title);

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
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2.5">
                              {/* Ícone compacto */}
                              <div className={cn("p-2 rounded-lg shrink-0", styles.iconBg)}>
                                {getTypeIcon(item.type, isDone)}
                              </div>

                              {/* Conteúdo */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className={cn(
                                    "font-medium text-sm text-foreground truncate",
                                    isDone && "line-through text-muted-foreground"
                                  )}>
                                    {item.title}
                                  </h3>
                                  <span className="text-sm font-semibold text-primary shrink-0">
                                    {item.time}
                                  </span>
                                </div>
                                {item.subtitle && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.subtitle}
                                  </p>
                                )}
                                
                                {/* Status badges inline */}
                                <div className="flex items-center gap-1.5 mt-1">
                                  {isPast && !isDone && !isMissed && (
                                    <Badge className="bg-warning/90 text-warning-foreground text-[10px] px-1.5 py-0 h-4">
                                      Atrasado
                                    </Badge>
                                  )}
                                  {isDone && (
                                    <Badge className="bg-success/90 text-success-foreground text-[10px] px-1.5 py-0 h-4">
                                      ✓ Tomado
                                    </Badge>
                                  )}
                                  {isMissed && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                                      Perdido
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Ações compactas - apenas para medicamentos pendentes */}
                              {item.type === "medication" && !isDone && !isMissed && (
                                <div className="flex gap-1.5 shrink-0">
                                  <Button
                                    size="sm"
                                    onClick={item.onMarkDone}
                                    className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Tomei
                                  </Button>
                                  {item.onSnooze && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={item.onSnooze}
                                      className="h-8 px-2"
                                    >
                                      <Timer className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              )}
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