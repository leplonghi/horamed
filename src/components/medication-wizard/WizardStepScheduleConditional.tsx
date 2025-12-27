import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Plus, X, Clock, Sun, Moon, Sunrise, Sunset, Bell, BellOff, Volume2, Check,
  Calendar, RefreshCw, Package, AlertTriangle, CheckCircle2, HelpCircle, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConditionalWizardStep } from "./ConditionalWizardStep";
import { AnimatePresence } from "framer-motion";

interface WizardData {
  frequency: "daily" | "specific_days" | "weekly";
  times: string[];
  daysOfWeek?: number[];
  continuousUse: boolean;
  startDate?: string;
  endDate?: string;
  notificationType?: "silent" | "push" | "alarm";
  controlStock: boolean;
  unitsTotal: number;
  unitLabel: string;
  lowStockThreshold: number;
}

interface WizardStepScheduleConditionalProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
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

export function WizardStepScheduleConditional({ data, updateData }: WizardStepScheduleConditionalProps) {
  const { t, language } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState("");

  const WEEK_DAYS = language === 'pt' ? WEEK_DAYS_PT : WEEK_DAYS_EN;

  const QUICK_TIMES = [
    { label: t('wizard.morning'), time: "08:00", icon: Sunrise, color: "text-orange-500" },
    { label: t('wizard.lunch'), time: "12:00", icon: Sun, color: "text-yellow-500" },
    { label: t('wizard.afternoon'), time: "18:00", icon: Sunset, color: "text-purple-500" },
    { label: t('wizard.night'), time: "22:00", icon: Moon, color: "text-blue-500" },
  ];

  const FREQUENCY_OPTIONS = [
    { value: "daily", label: t('wizard.daily'), description: t('wizard.dailyDesc'), emoji: "📅" },
    { value: "specific_days", label: t('wizard.specificDays'), description: t('wizard.specificDaysDesc'), emoji: "📆" },
    { value: "weekly", label: t('wizard.weekly'), description: t('wizard.weeklyDesc'), emoji: "🔄" },
  ];

  const unitOptions = [
    { value: "comprimidos", label: t('wizard.pills'), emoji: "💊" },
    { value: "cápsulas", label: t('wizard.capsules'), emoji: "💊" },
    { value: "gotas", label: t('wizard.drops'), emoji: "💧" },
    { value: "ml", label: t('wizard.ml'), emoji: "🧪" },
    { value: "unidades", label: t('wizard.units'), emoji: "📦" },
  ];

  // Step completion checks
  const isStep1Complete = data.continuousUse || (!data.continuousUse && data.startDate && data.endDate);
  const isStep2Complete = data.frequency !== undefined;
  const isStep3Complete = data.times.length > 0;
  const isStep4Complete = data.notificationType !== undefined;
  const isStep5Complete = !data.controlStock || (data.controlStock && data.unitsTotal > 0);

  // Summaries for collapsed steps
  const step1Summary = data.continuousUse 
    ? t('wizard.continuousUse') 
    : data.startDate && data.endDate 
      ? `${new Date(data.startDate).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' })} → ${new Date(data.endDate).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' })}`
      : '';

  const step2Summary = FREQUENCY_OPTIONS.find(f => f.value === data.frequency)?.label || '';
  
  const step3Summary = data.times.length > 0 
    ? data.times.join(', ') 
    : '';

  const step4Summary = {
    silent: t('wizard.silent') || 'Silencioso',
    push: t('wizard.push') || 'Notificação',
    alarm: t('wizard.alarm') || 'Alarme',
  }[data.notificationType || 'push'];

  const step5Summary = data.controlStock 
    ? `${data.unitsTotal} ${data.unitLabel}` 
    : language === 'pt' ? 'Não controlar' : 'Not tracking';

  // Handlers
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

  // Stock calculations
  const dosesPerDay = data.times.length || 1;
  const daysRemaining = data.unitsTotal > 0 ? Math.floor(data.unitsTotal / dosesPerDay) : 0;
  const percentRemaining = data.unitsTotal > 0 ? Math.min(100, (data.unitsTotal / (data.lowStockThreshold * 3)) * 100) : 0;
  const isLowStock = data.unitsTotal <= data.lowStockThreshold;

  const handleStepToggle = (stepNumber: number) => {
    setActiveStep(activeStep === stepNumber ? 0 : stepNumber);
  };

  const advanceToNextStep = (currentStep: number) => {
    setActiveStep(currentStep + 1);
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-1.5 mb-4 px-1">
        {[1, 2, 3, 4, 5].map((step) => {
          const isComplete = 
            step === 1 ? isStep1Complete :
            step === 2 ? isStep2Complete :
            step === 3 ? isStep3Complete :
            step === 4 ? isStep4Complete :
            isStep5Complete;
          
          const isVisible = 
            step === 1 ? true :
            step === 2 ? isStep1Complete :
            step === 3 ? isStep1Complete && isStep2Complete :
            step === 4 ? isStep1Complete && isStep2Complete && isStep3Complete :
            isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;

          return (
            <div
              key={step}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-all duration-500",
                isComplete ? "bg-primary" : isVisible ? "bg-primary/30" : "bg-muted/50"
              )}
            />
          );
        })}
      </div>

      <AnimatePresence mode="sync">
        {/* Step 1: Treatment Duration */}
        <ConditionalWizardStep
          stepNumber={1}
          title={t('wizard.treatmentDuration') || 'Duração do Tratamento'}
          description={language === 'pt' ? 'Defina se é uso contínuo ou por período específico' : 'Set if continuous use or for a specific period'}
          helpText={language === 'pt' ? 'Uso contínuo é para medicamentos de uso permanente. Temporário é para tratamentos com data de término.' : 'Continuous is for permanent medications. Temporary is for treatments with an end date.'}
          icon={<Calendar className="h-5 w-5" />}
          isComplete={!!isStep1Complete}
          isVisible={true}
          isActive={activeStep === 1}
          summary={step1Summary}
          onToggle={() => handleStepToggle(1)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Temporary */}
              <button
                type="button"
                onClick={() => {
                  updateData({ continuousUse: false, startDate: new Date().toISOString().split('T')[0] });
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  !data.continuousUse 
                    ? "border-primary bg-primary/10 shadow-md" 
                    : "border-border hover:border-primary/30 bg-background"
                )}
              >
                <Clock className={cn("h-6 w-6", !data.continuousUse ? "text-primary" : "text-muted-foreground")} />
                <div className="text-center">
                  <p className="font-semibold text-sm">{t('wizard.temporary') || 'Temporário'}</p>
                  <p className="text-xs text-muted-foreground">{t('wizard.temporaryDesc') || 'Por período'}</p>
                </div>
              </button>

              {/* Continuous */}
              <button
                type="button"
                onClick={() => {
                  updateData({ continuousUse: true });
                  advanceToNextStep(1);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  data.continuousUse 
                    ? "border-primary bg-primary/10 shadow-md" 
                    : "border-border hover:border-primary/30 bg-background"
                )}
              >
                <RefreshCw className={cn("h-6 w-6", data.continuousUse ? "text-primary" : "text-muted-foreground")} />
                <div className="text-center">
                  <p className="font-semibold text-sm">{t('wizard.continuousUse')}</p>
                  <p className="text-xs text-muted-foreground">{t('wizard.noEndDate')}</p>
                </div>
              </button>
            </div>

            {!data.continuousUse && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">{t('wizard.start')}</Label>
                    <Input
                      type="date"
                      value={data.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => updateData({ startDate: e.target.value })}
                      className="h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">{t('wizard.end')}</Label>
                    <Input
                      type="date"
                      value={data.endDate || ""}
                      onChange={(e) => {
                        updateData({ endDate: e.target.value });
                        if (e.target.value) advanceToNextStep(1);
                      }}
                      className="h-11 text-sm"
                    />
                  </div>
                </div>
                {data.startDate && data.endDate && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={() => advanceToNextStep(1)}
                  >
                    {language === 'pt' ? 'Continuar' : 'Continue'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </ConditionalWizardStep>

        {/* Step 2: Frequency */}
        <ConditionalWizardStep
          stepNumber={2}
          title={t('wizard.frequency')}
          description={language === 'pt' ? 'Escolha com que frequência tomar este medicamento' : 'Choose how often to take this medication'}
          helpText={language === 'pt' ? 'Diário significa todos os dias. Dias específicos permite escolher quais dias da semana.' : 'Daily means every day. Specific days lets you choose which days of the week.'}
          icon={<RefreshCw className="h-5 w-5" />}
          isComplete={!!isStep2Complete}
          isVisible={!!isStep1Complete}
          isActive={activeStep === 2}
          summary={step2Summary}
          onToggle={() => handleStepToggle(2)}
        >
          <div className="space-y-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                onClick={() => {
                  updateData({ frequency: opt.value as any });
                  if (opt.value !== "specific_days") {
                    advanceToNextStep(2);
                  }
                }}
                className={cn(
                  "p-3.5 cursor-pointer transition-all active:scale-[0.99]",
                  data.frequency === opt.value 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  {data.frequency === opt.value && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {/* Days of week selector */}
            {data.frequency === "specific_days" && (
              <div className="space-y-3 mt-4 p-4 bg-muted/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                <Label className="text-sm font-medium">{t('wizard.whichDays')}</Label>
                <div className="flex gap-1.5 justify-center">
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
                            ? "bg-primary text-primary-foreground shadow-md"
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
                  <Button
                    type="button"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => advanceToNextStep(2)}
                  >
                    {language === 'pt' ? 'Continuar' : 'Continue'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </ConditionalWizardStep>

        {/* Step 3: Times */}
        <ConditionalWizardStep
          stepNumber={3}
          title={t('wizard.times')}
          description={language === 'pt' ? 'Defina os horários para tomar o medicamento' : 'Set the times to take the medication'}
          helpText={language === 'pt' ? 'Adicione quantos horários forem necessários. Você pode usar os horários rápidos ou adicionar um personalizado.' : 'Add as many times as needed. You can use quick times or add a custom one.'}
          icon={<Clock className="h-5 w-5" />}
          isComplete={isStep3Complete}
          isVisible={isStep1Complete && isStep2Complete}
          isActive={activeStep === 3}
          summary={step3Summary}
          onToggle={() => handleStepToggle(3)}
        >
          <div className="space-y-4">
            {/* Selected times */}
            {data.times.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.times.map((time) => {
                  const TimeIcon = getTimeIcon(time);
                  return (
                    <div
                      key={time}
                      className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-full"
                    >
                      <TimeIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{time}</span>
                      <button
                        type="button"
                        onClick={() => removeTime(time)}
                        className="p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                        disabled={data.times.length === 1}
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick times */}
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
                    className="flex-col h-auto py-2.5 gap-1 px-1"
                  >
                    <Icon className={cn("w-4 h-4", !isAdded && qt.color)} />
                    <span className="text-[10px] font-medium">{qt.label}</span>
                    <span className="text-[9px] opacity-70">{qt.time}</span>
                  </Button>
                );
              })}
            </div>

            {/* Custom time */}
            {showCustomTime ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="flex-1 h-11"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={addCustomTime} disabled={!customTime} className="h-11 px-4">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowCustomTime(false)} className="h-11 px-3">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomTime(true)}
                className="w-full h-11"
              >
                <Clock className="w-4 h-4 mr-2" />
                {t('wizard.otherTime')}
              </Button>
            )}

            {data.times.length > 0 && (
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => advanceToNextStep(3)}
              >
                {language === 'pt' ? 'Continuar' : 'Continue'}
              </Button>
            )}
          </div>
        </ConditionalWizardStep>

        {/* Step 4: Notification Type */}
        <ConditionalWizardStep
          stepNumber={4}
          title={t('wizard.notificationType') || 'Tipo de Alerta'}
          description={language === 'pt' ? 'Como você quer ser lembrado?' : 'How do you want to be reminded?'}
          helpText={language === 'pt' ? 'Silencioso não faz som. Notificação toca o som padrão. Alarme toca um som alto e persistente.' : 'Silent makes no sound. Notification plays the default sound. Alarm plays a loud, persistent sound.'}
          icon={<Bell className="h-5 w-5" />}
          isComplete={isStep4Complete}
          isVisible={isStep1Complete && isStep2Complete && isStep3Complete}
          isActive={activeStep === 4}
          summary={step4Summary}
          onToggle={() => handleStepToggle(4)}
        >
          <div className="grid grid-cols-3 gap-2">
            {/* Silent */}
            <button
              type="button"
              onClick={() => {
                updateData({ notificationType: "silent" });
                advanceToNextStep(4);
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                data.notificationType === "silent"
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/30 bg-background"
              )}
            >
              <div className={cn(
                "p-3 rounded-full",
                data.notificationType === "silent" ? "bg-primary/20" : "bg-muted"
              )}>
                <BellOff className={cn("h-5 w-5", data.notificationType === "silent" ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-xs">{t('wizard.silent') || 'Silencioso'}</p>
                <p className="text-[10px] text-muted-foreground">{t('wizard.silentDesc') || 'Sem som'}</p>
              </div>
            </button>

            {/* Push */}
            <button
              type="button"
              onClick={() => {
                updateData({ notificationType: "push" });
                advanceToNextStep(4);
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                (data.notificationType === "push" || !data.notificationType)
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/30 bg-background"
              )}
            >
              <div className={cn(
                "p-3 rounded-full",
                (data.notificationType === "push" || !data.notificationType) ? "bg-primary/20" : "bg-muted"
              )}>
                <Bell className={cn("h-5 w-5", (data.notificationType === "push" || !data.notificationType) ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-xs">{t('wizard.push') || 'Notificação'}</p>
                <p className="text-[10px] text-muted-foreground">{t('wizard.pushDesc') || 'Som padrão'}</p>
              </div>
            </button>

            {/* Alarm */}
            <button
              type="button"
              onClick={() => {
                updateData({ notificationType: "alarm" });
                advanceToNextStep(4);
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                data.notificationType === "alarm"
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/30 bg-background"
              )}
            >
              <div className={cn(
                "p-3 rounded-full",
                data.notificationType === "alarm" ? "bg-primary/20" : "bg-muted"
              )}>
                <Volume2 className={cn("h-5 w-5", data.notificationType === "alarm" ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-xs">{t('wizard.alarm') || 'Alarme'}</p>
                <p className="text-[10px] text-muted-foreground">{t('wizard.alarmDesc') || 'Som alto'}</p>
              </div>
            </button>
          </div>
        </ConditionalWizardStep>

        {/* Step 5: Stock Control */}
        <ConditionalWizardStep
          stepNumber={5}
          title={language === 'pt' ? 'Controle de Estoque' : 'Stock Control'}
          description={language === 'pt' ? 'Receba alertas quando estiver acabando' : 'Get alerts when running low'}
          helpText={language === 'pt' ? 'Ative para receber lembretes de reposição antes de acabar seu medicamento.' : 'Enable to receive refill reminders before your medication runs out.'}
          icon={<Package className="h-5 w-5" />}
          isComplete={isStep5Complete}
          isVisible={isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete}
          isActive={activeStep === 5}
          summary={step5Summary}
          onToggle={() => handleStepToggle(5)}
        >
          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{language === 'pt' ? 'Controlar estoque' : 'Track stock'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Receber alertas de reposição' : 'Receive refill alerts'}</p>
                </div>
              </div>
              <Switch
                checked={data.controlStock}
                onCheckedChange={(checked) => updateData({ controlStock: checked })}
              />
            </div>

            {data.controlStock && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Quantity input */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('wizard.howMany')}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      value={data.unitsTotal || ""}
                      onChange={(e) => updateData({ unitsTotal: parseInt(e.target.value) || 0 })}
                      className="text-2xl h-14 text-center font-bold flex-1"
                      placeholder="0"
                    />
                    <Select value={data.unitLabel} onValueChange={(value) => updateData({ unitLabel: value })}>
                      <SelectTrigger className="h-14 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <span>{opt.emoji}</span>
                              <span className="text-sm">{opt.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Low stock threshold */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {t('wizard.alertWhenRemaining')}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      value={data.lowStockThreshold}
                      onChange={(e) => updateData({ lowStockThreshold: parseInt(e.target.value) || 5 })}
                      className="w-24 h-12 text-center text-lg font-medium"
                    />
                    <span className="text-sm text-muted-foreground">{data.unitLabel}</span>
                  </div>
                </div>

                {/* Stock preview */}
                {data.unitsTotal > 0 && (
                  <Card className={cn(
                    "p-4 space-y-3",
                    isLowStock 
                      ? "border-destructive/50 bg-destructive/5" 
                      : "border-green-500/50 bg-green-500/5"
                  )}>
                    <div className="flex items-center gap-3">
                      {isLowStock ? (
                        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {isLowStock ? t('wizard.lowStock') : t('wizard.stockOk')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.unitsTotal} {data.unitLabel} • ~{daysRemaining} {t('progress.days')}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={percentRemaining} 
                      className={cn(
                        "h-2",
                        isLowStock ? "[&>div]:bg-destructive" : "[&>div]:bg-green-500"
                      )}
                    />
                  </Card>
                )}
              </div>
            )}
          </div>
        </ConditionalWizardStep>
      </AnimatePresence>

      {/* Completion message */}
      {isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete && isStep5Complete && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-700 dark:text-green-400 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="h-5 w-5" />
          <p className="text-sm font-medium">
            {language === 'pt' ? 'Tudo pronto! Clique em salvar para concluir.' : 'All set! Click save to complete.'}
          </p>
        </div>
      )}
    </div>
  );
}
