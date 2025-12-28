import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Infinity, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

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
  const { t, language } = useLanguage();
  const locale = language === 'pt' ? ptBR : enUS;

  const durationPresets = [
    { days: 5, label: t('wizard.5days'), description: t('wizard.shortTreatment') },
    { days: 7, label: t('wizard.7days'), description: t('wizard.1week') },
    { days: 10, label: t('wizard.10days'), description: t('wizard.commonAntibiotics') },
    { days: 14, label: t('wizard.14days'), description: t('wizard.2weeks') },
    { days: 21, label: t('wizard.21days'), description: t('wizard.3weeks') },
    { days: 30, label: t('wizard.30days'), description: t('wizard.1month') },
  ];

  const today = new Date().toISOString().split('T')[0];

  // Calculate end date
  const endDate = startDate && treatmentDays 
    ? format(new Date(new Date(startDate).getTime() + treatmentDays * 24 * 60 * 60 * 1000), 'PP', { locale })
    : null;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StepTooltip type="info">
          <span dangerouslySetInnerHTML={{ __html: t('wizard.continuousInfo') }} />
        </StepTooltip>

        <div className="grid grid-cols-2 gap-3">
          {/* Temporary - now first and more prominent */}
          <button
            type="button"
            onClick={() => onContinuousChange(false)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              !isContinuous 
                ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                : "border-border hover:border-primary/30 bg-background"
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">{t('wizard.temporaryTooltip')}</p>
              </TooltipContent>
            </Tooltip>
            <div className={cn(
              "p-3 rounded-full",
              !isContinuous ? "bg-primary/20" : "bg-muted"
            )}>
              <Calendar className={cn("h-6 w-6", !isContinuous ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">{t('wizard.temporaryLabel')}</p>
              <p className="text-xs text-muted-foreground">{t('wizard.temporaryForXDays')}</p>
            </div>
            {!isContinuous && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            )}
          </button>

          {/* Continuous */}
          <button
            type="button"
            onClick={() => onContinuousChange(true)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              isContinuous 
                ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                : "border-border hover:border-primary/30 bg-background"
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">{t('wizard.continuousTooltip')}</p>
              </TooltipContent>
            </Tooltip>
            <div className={cn(
              "p-3 rounded-full",
              isContinuous ? "bg-primary/20" : "bg-muted"
            )}>
              <Infinity className={cn("h-6 w-6", isContinuous ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">{t('wizard.continuousLabel')}</p>
              <p className="text-xs text-muted-foreground">{t('wizard.noEndDateLabel')}</p>
            </div>
            {isContinuous && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            )}
          </button>
        </div>

        {/* Temporary treatment options */}
        {!isContinuous && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Duration presets */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                {t('wizard.treatmentDurationLabel')}
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{t('wizard.chooseQuickOrType')}</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {durationPresets.map((preset) => (
                  <Tooltip key={preset.days}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onTreatmentDaysChange(preset.days)}
                        className={cn(
                          "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                          treatmentDays === preset.days
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-background border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {preset.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">{preset.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm flex items-center gap-2">
                  {t('wizard.startDate')}
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('wizard.whenStarted')}</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm flex items-center gap-2">
                  {t('wizard.orTypeDays')}
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('wizard.totalDays')}</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
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

            {endDate && treatmentDays && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">{t('wizard.expectedEnd')}:</span>
                </div>
                <span className="font-bold text-primary">{endDate}</span>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={onComplete}
          className="w-full h-12 text-base font-semibold"
        >
          {t('wizard.continue')}
        </Button>
      </div>
    </TooltipProvider>
  );
}