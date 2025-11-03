import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, SkipForward, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DoseTimelineProps {
  doses: Array<{
    id: string;
    item_id: string;
    due_at: string;
    status: 'scheduled' | 'taken' | 'missed' | 'skipped';
    taken_at: string | null;
    items: {
      name: string;
      dose_text: string | null;
    };
  }>;
  period?: "today" | "week" | "month";
}

export default function DoseTimeline({ doses, period = "week" }: DoseTimelineProps) {
  const getStatusConfig = (status: string, isPast: boolean) => {
    switch (status) {
      case 'taken':
        return {
          icon: CheckCircle2,
          label: "Tomado",
          color: "text-green-600 bg-green-50 border-green-200",
          iconColor: "text-green-600",
        };
      case 'missed':
        return {
          icon: XCircle,
          label: "Esquecido",
          color: "text-red-600 bg-red-50 border-red-200",
          iconColor: "text-red-600",
        };
      case 'skipped':
        return {
          icon: SkipForward,
          label: "Pulado",
          color: "text-gray-600 bg-gray-50 border-gray-200",
          iconColor: "text-gray-600",
        };
      default:
        return isPast
          ? {
              icon: XCircle,
              label: "Atrasado",
              color: "text-orange-600 bg-orange-50 border-orange-200",
              iconColor: "text-orange-600",
            }
          : {
              icon: Clock,
              label: "Pendente",
              color: "text-blue-600 bg-blue-50 border-blue-200",
              iconColor: "text-blue-600",
            };
    }
  };

  return (
    <div className="space-y-4">
      {doses.map((dose, index) => {
        const dueTime = new Date(dose.due_at);
        const isPast = dueTime < new Date();
        const config = getStatusConfig(dose.status, isPast);
        const StatusIcon = config.icon;

        return (
          <Card
            key={dose.id}
            className="p-4 relative animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Timeline line */}
            {index !== doses.length - 1 && (
              <div className="absolute left-8 top-14 bottom-0 w-0.5 bg-border -translate-x-1/2" />
            )}

            <div className="flex gap-4">
              {/* Icon */}
              <div className={`p-2 rounded-full ${config.color} shrink-0 z-10`}>
                <StatusIcon className={`h-5 w-5 ${config.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {dose.items.name}
                    </h4>
                    {dose.items.dose_text && (
                      <p className="text-sm text-muted-foreground">
                        {dose.items.dose_text}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    ⏰ {format(dueTime, "HH:mm", { locale: ptBR })}
                  </span>
                  {dose.taken_at && (
                    <span className="text-green-600">
                      ✓ Tomado às{" "}
                      {format(new Date(dose.taken_at), "HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
