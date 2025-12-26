import { Card, CardContent } from "@/components/ui/card";
import { Clock, Pill } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import DoseActionButton from "./DoseActionButton";
import { cn } from "@/lib/utils";

interface NextDoseWidgetProps {
  dose: {
    id: string;
    item_id: string;
    due_at: string;
    items: {
      name: string;
      dose_text: string | null;
    };
  };
  onTake: () => void;
  className?: string;
}

export default function NextDoseWidget({ dose, onTake, className }: NextDoseWidgetProps) {
  const dueTime = new Date(dose.due_at);
  const now = new Date();
  const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / (1000 * 60));
  const isNow = minutesUntil <= 5 && minutesUntil >= -5;

  return (
    <Card className={cn(
      "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-300",
      isNow && "ring-2 ring-primary/50 shadow-lg shadow-primary/20",
      className
    )}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Pill className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              {isNow ? "⏰ É AGORA!" : "Próxima Dose"}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              {dose.items.name}
            </h3>
            {dose.items.dose_text && (
              <p className="text-sm text-muted-foreground">
                {dose.items.dose_text}
              </p>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {format(dueTime, "HH:mm", { locale: ptBR })}
                {!isNow && (
                  <span className="ml-2 text-primary font-medium">
                    ({formatDistanceToNow(dueTime, { locale: ptBR, addSuffix: true })})
                  </span>
                )}
              </span>
            </div>
          </div>

          <DoseActionButton
            variant="taken"
            onClick={onTake}
            className="w-full text-base py-6 font-bold hover-scale"
          />
        </div>
      </CardContent>
    </Card>
  );
}
