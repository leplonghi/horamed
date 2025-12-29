import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Utensils, FileText, Pill, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationTypes, NotificationType, getNotificationTypeLabel, getNotificationTypeDescription } from "@/hooks/useNotificationTypes";

interface StepDetailsProps {
  doseText: string;
  withFood: boolean;
  notes: string;
  notificationType?: NotificationType;
  onDoseTextChange: (value: string) => void;
  onWithFoodChange: (value: boolean) => void;
  onNotesChange: (value: string) => void;
  onNotificationTypeChange?: (value: NotificationType) => void;
  onComplete: () => void;
}

export default function StepDetails({
  doseText,
  withFood,
  notes,
  notificationType = 'normal',
  onDoseTextChange,
  onWithFoodChange,
  onNotesChange,
  onNotificationTypeChange,
  onComplete
}: StepDetailsProps) {
  const { t, language } = useLanguage();
  const { getAllNotificationTypes } = useNotificationTypes();
  const notificationTypes = getAllNotificationTypes();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Dosagem */}
      <div className="space-y-2">
        <Label htmlFor="dose" className="flex items-center gap-2 text-sm font-medium">
          <Pill className="h-4 w-4 text-primary" />
          {t('addItem.concentration')}
        </Label>
        <Input
          id="dose"
          placeholder={t('addItem.concentrationPlaceholder')}
          value={doseText}
          onChange={(e) => onDoseTextChange(e.target.value)}
          className="h-12"
        />
        <p className="text-xs text-muted-foreground">
          {t('addItem.concentrationHint')}
        </p>
      </div>

      {/* Com alimentação */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-medium">{t('addItem.takeWithFood')}</p>
            <p className="text-xs text-muted-foreground">
              {t('addItem.takeWithFoodHint')}
            </p>
          </div>
        </div>
        <Switch
          checked={withFood}
          onCheckedChange={onWithFoodChange}
        />
      </div>

      {/* Tipo de Alerta */}
      {onNotificationTypeChange && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-primary" />
            {language === 'pt' ? 'Tipo de Alerta' : 'Alert Type'}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {notificationTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onNotificationTypeChange(type.value as NotificationType)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  notificationType === type.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-primary" />
          {t('addItem.observations')} ({t('wizard.optional')})
        </Label>
        <Textarea
          id="notes"
          placeholder={t('addItem.obsPlaceholder')}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>

      <Button onClick={onComplete} className="w-full h-12 gap-2">
        {t('common.next')}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
