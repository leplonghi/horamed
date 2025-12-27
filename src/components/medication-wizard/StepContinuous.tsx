import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";

interface StepContinuousProps {
  isContinuous: boolean;
  treatmentDays: number | null;
  startDate: string;
  onContinuousChange: (value: boolean) => void;
  onTreatmentDaysChange: (days: number | null) => void;
  onStartDateChange: (date: string) => void;
  onComplete: () => void;
}

export default function StepContinuous({ 
  isContinuous,
  treatmentDays,
  startDate,
  onContinuousChange,
  onTreatmentDaysChange,
  onStartDateChange,
  onComplete
}: StepContinuousProps) {
  const today = new Date().toISOString().split('T')[0];

  // Calculate end date
  const endDate = startDate && treatmentDays 
    ? new Date(new Date(startDate).getTime() + treatmentDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    : null;

  return (
    <div className="space-y-4">
      <StepTooltip type="info">
        <strong>Uso contínuo:</strong> Para medicamentos de longo prazo (ex: pressão, diabetes).{" "}
        <strong>Uso temporário:</strong> Para tratamentos com prazo definido (ex: antibióticos, 7 dias).
      </StepTooltip>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onContinuousChange(true)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            isContinuous 
              ? "border-primary bg-primary/5 shadow-sm" 
              : "border-border hover:border-primary/30"
          )}
        >
          <div className={cn(
            "p-2.5 rounded-full",
            isContinuous ? "bg-primary/10" : "bg-muted"
          )}>
            <Infinity className={cn("h-5 w-5", isContinuous ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">Uso contínuo</p>
            <p className="text-xs text-muted-foreground">Sem data final</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onContinuousChange(false)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            !isContinuous 
              ? "border-primary bg-primary/5 shadow-sm" 
              : "border-border hover:border-primary/30"
          )}
        >
          <div className={cn(
            "p-2.5 rounded-full",
            !isContinuous ? "bg-primary/10" : "bg-muted"
          )}>
            <Calendar className={cn("h-5 w-5", !isContinuous ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">Temporário</p>
            <p className="text-xs text-muted-foreground">Por X dias</p>
          </div>
        </button>
      </div>

      {/* Temporary treatment options */}
      {!isContinuous && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm">Data de início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                min={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm">Duração (dias)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="365"
                placeholder="Ex: 7, 14, 30"
                value={treatmentDays || ""}
                onChange={(e) => onTreatmentDaysChange(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>

          {endDate && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm">Término em:</span>
              <span className="font-semibold text-primary">{endDate}</span>
            </div>
          )}
        </div>
      )}

      <Button 
        onClick={onComplete}
        className="w-full h-11"
      >
        Continuar
      </Button>
    </div>
  );
}
