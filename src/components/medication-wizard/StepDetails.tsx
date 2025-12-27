import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Utensils, FileText, Pill } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface StepDetailsProps {
  doseText: string;
  withFood: boolean;
  notes: string;
  onDoseTextChange: (value: string) => void;
  onWithFoodChange: (value: boolean) => void;
  onNotesChange: (value: string) => void;
  onComplete: () => void;
}

export default function StepDetails({
  doseText,
  withFood,
  notes,
  onDoseTextChange,
  onWithFoodChange,
  onNotesChange,
  onComplete
}: StepDetailsProps) {
  const { t, language } = useLanguage();

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
          {language === 'pt' ? 'Dosagem' : 'Dosage'}
        </Label>
        <Input
          id="dose"
          placeholder={language === 'pt' ? 'Ex: 500mg, 1 comprimido, 10 gotas...' : 'E.g.: 500mg, 1 tablet, 10 drops...'}
          value={doseText}
          onChange={(e) => onDoseTextChange(e.target.value)}
          className="h-12"
        />
        <p className="text-xs text-muted-foreground">
          {language === 'pt' ? 'Informe a dose que você toma por vez' : 'Enter the dose you take each time'}
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
              {language === 'pt' ? 'Ajuda a lembrar de comer antes' : 'Helps remember to eat beforehand'}
            </p>
          </div>
        </div>
        <Switch
          checked={withFood}
          onCheckedChange={onWithFoodChange}
        />
      </div>

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
