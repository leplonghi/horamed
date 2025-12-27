import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";

type FrequencyType = "daily" | "specific_days" | "weekly";

interface StepFrequencyProps {
  frequency: FrequencyType;
  daysOfWeek: number[];
  onFrequencyChange: (freq: FrequencyType) => void;
  onDaysChange: (days: number[]) => void;
  onComplete: () => void;
}

const frequencyOptions = [
  {
    value: "daily" as FrequencyType,
    label: "Todos os dias",
    emoji: "📅",
    description: "Tomar diariamente"
  },
  {
    value: "specific_days" as FrequencyType,
    label: "Dias específicos",
    emoji: "📆",
    description: "Escolher dias da semana"
  },
  {
    value: "weekly" as FrequencyType,
    label: "Semanalmente",
    emoji: "🗓️",
    description: "Uma vez por semana"
  }
];

const weekDays = [
  { value: 0, short: "Dom", full: "Domingo" },
  { value: 1, short: "Seg", full: "Segunda" },
  { value: 2, short: "Ter", full: "Terça" },
  { value: 3, short: "Qua", full: "Quarta" },
  { value: 4, short: "Qui", full: "Quinta" },
  { value: 5, short: "Sex", full: "Sexta" },
  { value: 6, short: "Sáb", full: "Sábado" }
];

export default function StepFrequency({ 
  frequency, 
  daysOfWeek, 
  onFrequencyChange, 
  onDaysChange,
  onComplete
}: StepFrequencyProps) {
  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      onDaysChange(daysOfWeek.filter(d => d !== day));
    } else {
      onDaysChange([...daysOfWeek, day].sort());
    }
  };

  const canContinue = frequency === "daily" || 
    (frequency === "specific_days" && daysOfWeek.length > 0) ||
    (frequency === "weekly" && daysOfWeek.length === 1);

  return (
    <div className="space-y-4">
      <StepTooltip type="info">
        Defina com que frequência você precisa tomar este medicamento. Isso determina quais dias aparecerão lembretes.
      </StepTooltip>

      {/* Frequency options */}
      <div className="space-y-2">
        {frequencyOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onFrequencyChange(opt.value);
              if (opt.value === "daily") {
                onDaysChange([]);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              frequency === opt.value 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/30"
            )}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1">
              <p className="font-medium">{opt.label}</p>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </div>
            {frequency === opt.value && (
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Day selector for specific days */}
      {(frequency === "specific_days" || frequency === "weekly") && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border animate-in fade-in duration-300">
          <p className="text-sm font-medium">
            {frequency === "weekly" ? "Qual dia da semana?" : "Quais dias da semana?"}
          </p>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = daysOfWeek.includes(day.value);
              
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    if (frequency === "weekly") {
                      // Only one day for weekly
                      onDaysChange([day.value]);
                    } else {
                      toggleDay(day.value);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background border hover:border-primary/50"
                  )}
                >
                  {day.short}
                </button>
              );
            })}
          </div>

          {daysOfWeek.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Selecionado: {daysOfWeek.map(d => weekDays[d].full).join(", ")}
            </p>
          )}
        </div>
      )}

      <Button 
        onClick={onComplete}
        disabled={!canContinue}
        className="w-full h-11"
      >
        Continuar
      </Button>
    </div>
  );
}
