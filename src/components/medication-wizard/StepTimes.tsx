import { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";

interface StepTimesProps {
  times: string[];
  onTimesChange: (times: string[]) => void;
  onComplete: () => void;
}

const quickPresets = [
  { 
    label: "1x ao dia", 
    times: ["08:00"],
    description: "Manhã"
  },
  { 
    label: "2x ao dia", 
    times: ["08:00", "20:00"],
    description: "Manhã e noite"
  },
  { 
    label: "3x ao dia", 
    times: ["08:00", "14:00", "20:00"],
    description: "Manhã, tarde, noite"
  },
  { 
    label: "4x ao dia", 
    times: ["08:00", "12:00", "16:00", "20:00"],
    description: "A cada 4 horas"
  },
];

export default function StepTimes({ times, onTimesChange, onComplete }: StepTimesProps) {
  const [showCustom, setShowCustom] = useState(false);

  const addTime = () => {
    onTimesChange([...times, "12:00"]);
  };

  const removeTime = (index: number) => {
    onTimesChange(times.filter((_, i) => i !== index));
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    onTimesChange(newTimes);
  };

  const selectPreset = (presetTimes: string[]) => {
    onTimesChange([...presetTimes]);
    setShowCustom(false);
  };

  const isPresetSelected = (presetTimes: string[]) => {
    return JSON.stringify(times.sort()) === JSON.stringify(presetTimes.sort());
  };

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 5 && hour < 12) return "🌅";
    if (hour >= 12 && hour < 18) return "☀️";
    if (hour >= 18 && hour < 21) return "🌆";
    return "🌙";
  };

  return (
    <div className="space-y-4">
      <StepTooltip type="tip">
        Escolha os horários das doses. Você pode usar uma opção rápida ou personalizar os horários exatos.
      </StepTooltip>

      {/* Quick presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Opções rápidas</Label>
        <div className="grid grid-cols-2 gap-2">
          {quickPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectPreset(preset.times)}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all",
                isPresetSelected(preset.times)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <p className="font-medium text-sm">{preset.label}</p>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom times toggle */}
      <Button 
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowCustom(!showCustom)}
        className="w-full"
      >
        <Clock className="h-4 w-4 mr-2" />
        {showCustom ? "Ocultar horários" : "Personalizar horários"}
      </Button>

      {/* Custom time inputs */}
      {showCustom && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border animate-in fade-in duration-300">
          <div className="space-y-2">
            {times.map((time, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-lg">{getTimeIcon(time)}</span>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(index, e.target.value)}
                  className="flex-1"
                />
                {times.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTime(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTime}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar horário
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg">
        <span className="text-sm font-medium">Horários:</span>
        {times.sort().map((time, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
            {getTimeIcon(time)} {time}
          </span>
        ))}
      </div>

      <Button 
        onClick={onComplete}
        disabled={times.length === 0}
        className="w-full h-11"
      >
        Continuar
      </Button>
    </div>
  );
}
