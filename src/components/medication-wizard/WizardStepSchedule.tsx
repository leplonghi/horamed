import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Calendar, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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

export function WizardStepSchedule({ data, updateData }: WizardStepScheduleProps) {
  const [newTime, setNewTime] = useState("08:00");

  const frequencyOptions = [
    { value: "daily", label: "Todos os dias", description: "Tomar diariamente" },
    { value: "specific_days", label: "Dias específicos", description: "Escolher dias da semana" },
    { value: "weekly", label: "Semanal", description: "Uma vez por semana (ex: Ozempic)" },
  ];

  const weekDays = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sáb" },
  ];

  const addTime = () => {
    console.log("🕐 addTime chamado:", { newTime, currentTimes: data.times });
    if (!newTime) {
      console.log("❌ newTime está vazio");
      return;
    }
    if (data.times.includes(newTime)) {
      console.log("❌ Horário já existe");
      return;
    }
    console.log("✅ Adicionando horário");
    updateData({ times: [...data.times, newTime].sort() });
    setNewTime("08:00");
  };

  const removeTime = (time: string) => {
    updateData({ times: data.times.filter((t) => t !== time) });
  };

  const toggleDay = (day: number) => {
    const currentDays = data.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updateData({ daysOfWeek: newDays });
  };

  return (
    <div className="space-y-6">
      {/* Frequency Type */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Frequência</Label>
        <RadioGroup
          value={data.frequency}
          onValueChange={(value: any) => updateData({ frequency: value })}
          className="space-y-2"
        >
          {frequencyOptions.map((opt) => (
            <div key={opt.value} className="flex items-start space-x-3">
              <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
              <Label htmlFor={opt.value} className="cursor-pointer flex-1">
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-muted-foreground">{opt.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Days of Week Selection (for specific_days frequency) */}
      {data.frequency === "specific_days" && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Dias da semana</Label>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = (data.daysOfWeek || []).includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`py-3 px-2 rounded-lg border-2 font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Times */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Horários <span className="text-muted-foreground text-sm">(pelo menos 1)</span>
        </Label>
        
        {/* Existing times */}
        <div className="space-y-2">
          {data.times.map((time) => (
            <div key={time} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-lg font-medium">{time}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTime(time)}
                disabled={data.times.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add new time */}
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Label htmlFor="newTime" className="text-sm">Adicionar horário</Label>
            <Input
              id="newTime"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTime();
                }
              }}
              className="text-lg h-12"
            />
          </div>
          <Button 
            type="button"
            onClick={addTime} 
            size="lg" 
            className="h-12"
            disabled={!newTime || data.times.includes(newTime)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Treatment Duration */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="continuous" className="text-base font-semibold">
              Uso contínuo
            </Label>
            <p className="text-sm text-muted-foreground">
              Sem data de término definida
            </p>
          </div>
          <Switch
            id="continuous"
            checked={data.continuousUse}
            onCheckedChange={(checked) => updateData({ continuousUse: checked })}
          />
        </div>

        {!data.continuousUse && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm">Data de início (opcional)</Label>
              <Input
                id="startDate"
                type="date"
                value={data.startDate || ""}
                onChange={(e) => updateData({ startDate: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm">Data de término *</Label>
              <Input
                id="endDate"
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
