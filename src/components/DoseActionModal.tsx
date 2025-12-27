import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, SkipForward, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface DoseActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dose: {
    id: string;
    due_at: string;
    items: {
      name: string;
      dose_text: string | null;
    };
    stock?: {
      units_left: number;
    }[];
  } | null;
  onAction: (action: 'taken' | 'missed' | 'skipped' | 'custom-time') => void;
}

export default function DoseActionModal({ 
  open, 
  onOpenChange, 
  dose, 
  onAction 
}: DoseActionModalProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  
  if (!dose) return null;

  const dueTime = new Date(dose.due_at);
  const now = new Date();
  const minutesLate = Math.round((now.getTime() - dueTime.getTime()) / (1000 * 60));

  const handleAction = (action: 'taken' | 'missed' | 'skipped' | 'custom-time') => {
    onAction(action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dose.items.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Time Info */}
          <div className="space-y-2 text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {language === 'pt' ? 'Previsto' : 'Scheduled'}: {format(dueTime, "HH:mm", { locale: dateLocale })}
              </span>
            </div>
            <div className="text-lg font-semibold">
              {language === 'pt' ? 'Agora' : 'Now'}: {format(now, "HH:mm", { locale: dateLocale })}
              {minutesLate > 0 && (
                <span className="text-sm text-warning ml-2">
                  ({minutesLate} min {language === 'pt' ? 'atrasado' : 'late'})
                </span>
              )}
            </div>
          </div>

          {/* Dose Info */}
          {dose.items.dose_text && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">💊 {dose.items.dose_text}</p>
            </div>
          )}

          {/* Stock Info */}
          {dose.stock && dose.stock.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                📦 {t('dose.stock')}: {dose.stock[0].units_left} {t('dose.unitsShort')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => handleAction('taken')}
              className="w-full h-14 text-lg font-bold bg-success hover:bg-success/90 text-success-foreground"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              ✓ {language === 'pt' ? 'TOMEI AGORA' : 'TOOK IT NOW'} ({format(now, "HH:mm")})
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleAction('custom-time')}
                variant="outline"
                className="h-12"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {language === 'pt' ? 'Já tomei' : 'Already took'}
                <span className="text-xs block text-muted-foreground">
                  ({language === 'pt' ? 'escolher horário' : 'choose time'})
                </span>
              </Button>

              <Button
                onClick={() => handleAction('skipped')}
                variant="outline"
                className="h-12"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                {t('today.skip')}
              </Button>
            </div>

            <Button
              onClick={() => handleAction('missed')}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {language === 'pt' ? 'Esqueci / Não vou tomar' : "Forgot / Won't take"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
