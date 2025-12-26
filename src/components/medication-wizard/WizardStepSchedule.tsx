import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Clock, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

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

const WEEK_DAYS_PT = [
  { value: 0, label: "D", fullLabel: "Dom" },
  { value: 1, label: "S", fullLabel: "Seg" },
  { value: 2, label: "T", fullLabel: "Ter" },
  { value: 3, label: "Q", fullLabel: "Qua" },
  { value: 4, label: "Q", fullLabel: "Qui" },
  { value: 5, label: "S", fullLabel: "Sex" },
  { value: 6, label: "S", fullLabel: "Sáb" },
];

const WEEK_DAYS_EN = [
  { value: 0, label: "S", fullLabel: "Sun" },
  { value: 1, label: "M", fullLabel: "Mon" },
  { value: 2, label: "T", fullLabel: "Tue" },
  { value: 3, label: "W", fullLabel: "Wed" },
  { value: 4, label: "T", fullLabel: "Thu" },
  { value: 5, label: "F", fullLabel: "Fri" },
  { value: 6, label: "S", fullLabel: "Sat" },
];

export function WizardStepSchedule({ data, updateData }: WizardStepScheduleProps) {
  const { t, language } = useLanguage();
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState("");

  const QUICK_TIMES = [
    { label: t('wizard.morning'), time: "08:00", icon: Sunrise, color: "text-orange-500" },
    { label: t('wizard.lunch'), time: "12:00", icon: Sun, color: "text-yellow-500" },
    { label: t('wizard.afternoon'), time: "18:00", icon: Sunset, color: "text-purple-500" },
    { label: t('wizard.night'), time: "22:00", icon: Moon, color: "text-blue-500" },
  ];

  const FREQUENCY_OPTIONS = [
    { 
      value: "daily", 
      label: t('wizard.daily'), 
      description: t('wizard.dailyDesc'),
      emoji: "📅"
    },
    { 
      value: "specific_days", 
      label: t('wizard.specificDays'), 
      description: t('wizard.specificDaysDesc'),
      emoji: "📆"
    },
    { 
      value: "weekly", 
      label: t('wizard.weekly'), 
      description: t('wizard.weeklyDesc'),
      emoji: "🔄"
    },
  ];

  const WEEK_DAYS = language === 'pt' ? WEEK_DAYS_PT : WEEK_DAYS_EN;

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

  return (
    <div className="space-y-6">
      {/* Duração do tratamento - agora primeiro */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{t('wizard.continuousUse')}</Label>
            <p className="text-xs text-muted-foreground">{t('wizard.noEndDate')}</p>
          </div>
          <Switch
            checked={data.continuousUse}
            onCheckedChange={(checked) => updateData({ continuousUse: checked })}
          />
        </div>

        {!data.continuousUse && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('wizard.start')}</Label>
              <Input
                type="date"
                value={data.startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateData({ startDate: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('wizard.end')}</Label>
              <Input
                type="date"
                value={data.endDate || ""}
                onChange={(e) => updateData({ endDate: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Frequência */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-base font-semibold">{t('wizard.frequency')}</Label>
        
        <div className="space-y-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <Card
              key={opt.value}
              onClick={() => updateData({ frequency: opt.value })}
              className={cn(
                "p-3 cursor-pointer transition-all active:scale-[0.99]",
                data.frequency === opt.value 
                  ? "border-primary bg-primary/5" 
                  : "hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                </div>
                {data.frequency === opt.value && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dias da semana (para dias específicos) */}
      {data.frequency === "specific_days" && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t('wizard.whichDays')}</Label>
          <div className="flex gap-1 justify-center">
            {WEEK_DAYS.map((day) => {
              const isSelected = (data.daysOfWeek || []).includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "w-10 h-10 rounded-full font-semibold text-xs transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                  title={day.fullLabel}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Horários */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{t('wizard.times')}</Label>
          <Badge variant="secondary" className="text-xs">
            {data.times.length} {data.times.length !== 1 ? t('wizard.timesCount') : t('wizard.time')}
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
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 rounded-full"
                >
                  <TimeIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium">{time}</span>
                  <button
                    type="button"
                    onClick={() => removeTime(time)}
                    className="ml-0.5 p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                    disabled={data.times.length === 1}
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Horários rápidos */}
        <div className="grid grid-cols-4 gap-1.5">
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
                className="flex-col h-auto py-2 gap-0.5 px-1"
              >
                <Icon className={cn("w-3.5 h-3.5", !isAdded && qt.color)} />
                <span className="text-[10px]">{qt.label}</span>
                <span className="text-[9px] opacity-70">{qt.time}</span>
              </Button>
            );
          })}
        </div>

        {/* Horário personalizado */}
        {showCustomTime ? (
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="flex-1 h-10"
              autoFocus
            />
            <Button type="button" size="sm" onClick={addCustomTime} disabled={!customTime} className="h-10 px-3">
              <Plus className="w-4 h-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowCustomTime(false)}
              className="h-10 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomTime(true)}
            className="w-full h-10"
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('wizard.otherTime')}
          </Button>
        )}
      </div>
    </div>
  );
}
