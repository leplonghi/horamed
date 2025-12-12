import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, SkipForward, AlertCircle, Info } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import DoseActionButton from "./DoseActionButton";
import MedicationInfoSheet from "./MedicationInfoSheet";
import { useMedicationInfo } from "@/hooks/useMedicationInfo";

interface DoseCardProps {
  dose: {
    id: string;
    item_id: string;
    due_at: string;
    status: 'scheduled' | 'taken' | 'missed' | 'skipped';
    taken_at: string | null;
    items: {
      name: string;
      dose_text: string | null;
    };
    stock?: {
      units_left: number;
    }[];
  };
  onTake: () => void;
  onMore: () => void;
}

export default function DoseCard({ dose, onTake, onMore }: DoseCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { info, isLoading, error, fetchInfo, clearInfo } = useMedicationInfo();

  const dueTime = new Date(dose.due_at);
  const now = new Date();
  const isPast = dueTime < now;
  const isCurrent = Math.abs(dueTime.getTime() - now.getTime()) < 30 * 60 * 1000; // 30min window
  const isFuture = dueTime > now && !isCurrent;

  const handleShowInfo = () => {
    setShowInfo(true);
    fetchInfo(dose.items.name);
  };

  const handleCloseInfo = (open: boolean) => {
    setShowInfo(open);
    if (!open) {
      clearInfo();
    }
  };

  const getStatusConfig = () => {
    switch (dose.status) {
      case 'taken':
        return {
          icon: CheckCircle2,
          label: "Tomado",
          color: "bg-success/10 border-success/20 text-success",
          badgeColor: "bg-success text-success-foreground",
        };
      case 'missed':
        return {
          icon: XCircle,
          label: "Esquecido",
          color: "bg-destructive/10 border-destructive/20 text-destructive",
          badgeColor: "bg-destructive text-destructive-foreground",
        };
      case 'skipped':
        return {
          icon: SkipForward,
          label: "Pulado",
          color: "bg-muted border-border text-muted-foreground",
          badgeColor: "bg-muted text-muted-foreground",
        };
      default:
        if (isPast && !isCurrent) {
          return {
            icon: AlertCircle,
            label: "Atrasado",
            color: "bg-warning/10 border-warning/20 text-warning animate-pulse",
            badgeColor: "bg-warning text-warning-foreground",
          };
        }
        if (isCurrent) {
          return {
            icon: Clock,
            label: "Agora",
            color: "bg-primary/10 border-primary/30 text-primary",
            badgeColor: "bg-primary text-primary-foreground",
          };
        }
        return {
          icon: Clock,
          label: "Pendente",
          color: "bg-card border-border text-foreground",
          badgeColor: "bg-secondary text-secondary-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <>
      <Card
        className={cn(
          "p-4 transition-all duration-300 hover:shadow-md",
          config.color,
          isCurrent && "ring-2 ring-primary/50"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "p-2 rounded-full shrink-0",
            dose.status === 'taken' && "bg-success/20",
            dose.status === 'missed' && "bg-destructive/20",
            dose.status === 'skipped' && "bg-muted",
            dose.status === 'scheduled' && isPast && !isCurrent && "bg-warning/20",
            dose.status === 'scheduled' && isCurrent && "bg-primary/20",
            dose.status === 'scheduled' && isFuture && "bg-secondary"
          )}>
            <StatusIcon className={cn("h-5 w-5", config.color.split(' ').pop())} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground truncate">
                    {dose.items.name}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleShowInfo}
                    title="Ver informações do medicamento"
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                {dose.items.dose_text && (
                  <p className="text-sm text-muted-foreground">
                    {dose.items.dose_text}
                  </p>
                )}
              </div>
              <Badge className={cn("shrink-0 text-xs", config.badgeColor)}>
                {config.label}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(dueTime, "HH:mm", { locale: ptBR })}
              </span>
              {dose.status === 'scheduled' && (
                <span className="text-xs">
                  {isPast && !isCurrent && `⚠️ ${formatDistanceToNow(dueTime, { locale: ptBR, addSuffix: true })}`}
                  {isCurrent && "⏰ É agora!"}
                  {isFuture && `🕒 ${formatDistanceToNow(dueTime, { locale: ptBR, addSuffix: true })}`}
                </span>
              )}
              {dose.taken_at && (
                <span className="text-success text-xs">
                  ✓ às {format(new Date(dose.taken_at), "HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>

            {dose.stock && dose.stock.length > 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                📦 Estoque: {dose.stock[0].units_left} unidades
              </p>
            )}

            {/* Actions */}
            {dose.status === 'scheduled' && (
              <div className="flex items-center gap-2">
                <DoseActionButton
                  variant="taken"
                  onClick={onTake}
                  className="flex-1"
                />
                <DoseActionButton
                  variant="more"
                  onClick={onMore}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      <MedicationInfoSheet
        open={showInfo}
        onOpenChange={handleCloseInfo}
        medicationName={dose.items.name}
        info={info}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}