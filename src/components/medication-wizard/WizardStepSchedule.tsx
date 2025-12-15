import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Clock, HelpCircle, Calendar, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WizardStepScheduleProps {
  data: {
    frequency: "daily" | "specific_days" | "weekly";
    times: string[];
    daysOfWeek?: number[];
    continuousUse: boolean;
    startDate?: string;
    endDate?: string;
  };
  updateData: (data: Partial<any>) => void;
}

const QUICK_TIMES = [
  { label: "Manhã", time: "08:00", icon: Sunrise, color: "text-orange-500" },
  { label: "Almoço", time: "12:00", icon: Sun, color: "text-yellow-500" },
  { label: "Tarde", time: "18:00", icon: Sunset, color: "text-purple-500" },
  { label: "Noite", time: "22:00", icon: Moon, color: "text-blue-500" },
];

const FREQUENCY_OPTIONS = [
  { 
    value: "daily", 
    label: "Todo dia", 
    description: "Todos os dias da semana",
    emoji: "📅"
  },
  { 
    value: "specific_days", 
    label: "Dias específicos", 
    description: "Escolher quais dias",
    emoji: "📆"
  },
  { 
    value: "weekly", 
    label: "Semanal", 
    description: "Uma vez por semana (ex: Ozempic)",
    emoji: "🔄"
  },
];

const WEEK_DAYS = [
  { value: 0, label: "D", fullLabel: "Dom" },
  { value: 1, label: "S", fullLabel: "Seg" },
  { value: 2, label: "T", fullLabel: "Ter" },
  { value: 3, label: "Q", fullLabel: "Qua" },
  { value: 4, label: "Q", fullLabel: "Qui" },
  { value: 5, label: "S", fullLabel: "Sex" },
  { value: 6, label: "S", fullLabel: "Sáb" },
];

export function WizardStepSchedule({ data, updateData }: WizardStepScheduleProps) {
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState("");

  const addQuickTime = (time: string) => {
    if (!data.times.includes(time)) {
      updateData({ times: [...data.times, time].sort() });
    }
  };

  const removeTime = (time: string) => {
    if (data.times.length > 1) {
      updateData({ times: data.times.filter((t) => t !== time) });
    }
  };

  const addCustomTime = () => {
    if (customTime && !data.times.includes(customTime)) {
      updateData({ times: [...data.times, customTime].sort() });
      setCustomTime("");
      setShowCustomTime(false);
    }
  };

  const toggleDay = (day: number) => {
    const currentDays = data.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updateData({ daysOfWeek: newDays });
  };

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 5 && hour < 12) return Sunrise;
    if (hour >= 12 && hour < 17) return Sun;
    if (hour >= 17 && hour < 21) return Sunset;
    return Moon;
  };

  const getTimeLabel = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 5 && hour < 12) return "Manhã";
    if (hour >= 12 && hour < 17) return "Tarde";
    if (hour >= 17 && hour < 21) return "Fim de tarde";
    return "Noite";
  };

  return (
    <div className="space-y-8">
      {/* Header explicativo */}
      <Alert className="bg-primary/5 border-primary/20">
        <HelpCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Como funciona?</strong> Escolha quando você precisa tomar este medicamento. 
          O app vai te avisar nos horários certos.
        </AlertDescription>
      </Alert>

      {/* Frequência */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Com que frequência você toma?
        </Label>
        
        <div className="grid gap-3">
          {FREQUENCY_OPTIONS.map((opt) => (
            <Card
              key={opt.value}
              onClick={() => updateData({ frequency: opt.value })}
              className={cn(
                "p-4 cursor-pointer transition-all",
                data.frequency === opt.value 
                  ? "border-primary bg-primary/5 shadow-md" 
                  : "hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                </div>
                {data.frequency === opt.value && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dias da semana (para dias específicos) */}
      {data.frequency === "specific_days" && (
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Em quais dias?
          </Label>
          <div className="flex gap-2 justify-center">
            {WEEK_DAYS.map((day) => {
              const isSelected = (data.daysOfWeek || []).includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "w-11 h-11 rounded-full font-semibold text-sm transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md scale-110"
                      : "bg-muted hover:bg-muted/80"
                  )}
                  title={day.fullLabel}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {(data.daysOfWeek?.length || 0) > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {data.daysOfWeek?.map(d => WEEK_DAYS.find(w => w.value === d)?.fullLabel).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Horários */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">
            Em quais horários?
          </Label>
          <Badge variant="secondary" className="text-xs">
            {data.times.length} horário{data.times.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Horários selecionados */}
        {data.times.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.times.map((time) => {
              const TimeIcon = getTimeIcon(time);
              return (
                <div
                  key={time}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-full"
                >
                  <TimeIcon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{time}</span>
                  <button
                    type="button"
                    onClick={() => removeTime(time)}
                    className="ml-1 p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                    disabled={data.times.length === 1}
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Horários rápidos */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Adicionar horário:</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_TIMES.map((qt) => {
              const isAdded = data.times.includes(qt.time);
              const Icon = qt.icon;
              return (
                <Button
                  key={qt.time}
                  type="button"
                  variant={isAdded ? "default" : "outline"}
                  size="sm"
                  onClick={() => addQuickTime(qt.time)}
                  disabled={isAdded}
                  className="flex-col h-auto py-3 gap-1"
                >
                  <Icon className={cn("w-4 h-4", !isAdded && qt.color)} />
                  <span className="text-xs">{qt.label}</span>
                  <span className="text-[10px] opacity-70">{qt.time}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Horário personalizado */}
        {showCustomTime ? (
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="flex-1 h-11"
              autoFocus
            />
            <Button type="button" size="sm" onClick={addCustomTime} disabled={!customTime}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowCustomTime(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomTime(true)}
            className="w-full"
          >
            <Clock className="w-4 h-4 mr-2" />
            Outro horário
          </Button>
        )}
      </div>

      {/* Duração do tratamento */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Uso contínuo</Label>
            <p className="text-sm text-muted-foreground">
              Sem data de término
            </p>
          </div>
          <Switch
            checked={data.continuousUse}
            onCheckedChange={(checked) => updateData({ continuousUse: checked })}
          />
        </div>

        {!data.continuousUse && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm">Início</Label>
              <Input
                type="date"
                value={data.startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateData({ startDate: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Término</Label>
              <Input
                type="date"
                value={data.endDate || ""}
                onChange={(e) => updateData({ endDate: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}