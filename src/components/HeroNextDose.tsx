import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { memo, useCallback, useState } from "react";

interface HeroNextDoseProps {
  dose?: {
    id: string;
    item_id: string;
    due_at: string;
    status: string;
    items: {
      name: string;
      dose_text: string | null;
    };
  } | null;
  nextDayDose?: {
    time: string;
    name: string;
  } | null;
  onTake: (doseId: string, itemId: string, itemName: string) => void;
  onSnooze?: (doseId: string, itemName: string) => void;
  allDoneToday?: boolean;
}

function HeroNextDose({ dose, nextDayDose, onTake, onSnooze, allDoneToday }: HeroNextDoseProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticTaken, setOptimisticTaken] = useState(false);

  const handleTake = useCallback(async () => {
    if (!dose || isSubmitting || optimisticTaken) return;
    
    // Optimistic update - instant feedback
    setIsSubmitting(true);
    setOptimisticTaken(true);
    
    try {
      await onTake(dose.id, dose.item_id, dose.items.name);
    } catch {
      // Rollback on error
      setOptimisticTaken(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [dose, isSubmitting, optimisticTaken, onTake]);

  const handleSnooze = useCallback(() => {
    if (!dose || !onSnooze || isSubmitting) return;
    onSnooze(dose.id, dose.items.name);
  }, [dose, onSnooze, isSubmitting]);

  // Show success state immediately after optimistic update
  if (optimisticTaken) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/40">
          <div className="flex flex-col items-center text-center gap-3">
            <motion.div 
              className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Check className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-green-600 dark:text-green-400">
              {language === 'pt' ? 'Dose registrada com sucesso.' : 'Dose recorded successfully.'}
            </h2>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ✅ ESTADO: Tudo certo por hoje
  if (allDoneToday || (!dose && !nextDayDose)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="p-8 bg-gradient-to-br from-green-500/15 to-emerald-500/5 border-green-500/30">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {language === 'pt' ? 'Tudo certo por hoje 👍' : 'All good for today 👍'}
              </h2>
              {nextDayDose ? (
                <p className="text-base text-muted-foreground mt-2">
                  {language === 'pt' 
                    ? `Próxima dose amanhã às ${nextDayDose.time}`
                    : `Next dose tomorrow at ${nextDayDose.time}`
                  }
                </p>
              ) : (
                <p className="text-base text-muted-foreground mt-2">
                  {language === 'pt' 
                    ? 'Dia concluído 🎉'
                    : 'Day completed 🎉'
                  }
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // 📅 ESTADO: Próxima dose amanhã (sem doses hoje)
  if (!dose && nextDayDose) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                {language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE'}
              </p>
              <h2 className="text-2xl font-bold text-foreground">{nextDayDose.name}</h2>
              <p className="text-base text-muted-foreground mt-1">
                {language === 'pt' 
                  ? `Amanhã às ${nextDayDose.time}`
                  : `Tomorrow at ${nextDayDose.time}`
                }
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // 💊 ESTADO: Dose pendente - AÇÃO PRINCIPAL
  if (dose) {
    const dueTime = new Date(dose.due_at);
    const now = new Date();
    const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / (1000 * 60));
    const isNow = minutesUntil <= 15 && minutesUntil >= -30;
    const isOverdue = minutesUntil < -5;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className={cn(
          "p-6 transition-all",
          isOverdue 
            ? "bg-gradient-to-br from-destructive/15 to-orange-500/5 border-destructive/40 ring-2 ring-destructive/30 shadow-lg"
            : isNow 
              ? "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40 ring-2 ring-primary/30 shadow-lg"
              : "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
        )}>
          <div className="space-y-5">
            {/* Header com status e horário */}
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full",
                isOverdue 
                  ? "bg-destructive/20 text-destructive"
                  : isNow 
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {isOverdue 
                  ? (language === 'pt' ? '⚠️ ATRASADA' : '⚠️ OVERDUE')
                  : isNow 
                    ? (language === 'pt' ? '🔔 AGORA' : '🔔 NOW')
                    : (language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE')
                }
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {format(dueTime, "HH:mm", { locale: dateLocale })}
                </span>
              </div>
            </div>

            {/* Nome do medicamento - Grande e claro */}
            <div className="text-center py-2">
              <h2 className="text-3xl font-bold text-foreground leading-tight">
                {dose.items.name}
              </h2>
              {dose.items.dose_text && (
                <p className="text-lg text-muted-foreground mt-1">
                  {dose.items.dose_text}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {/* Botão principal: Marcar como tomado */}
              <Button 
                size="lg" 
                onClick={handleTake}
                disabled={isSubmitting}
                className={cn(
                  "w-full h-16 text-lg font-bold rounded-2xl shadow-md transition-all active:scale-[0.98]",
                  isOverdue 
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                <Check className="h-6 w-6 mr-2" />
                {language === 'pt' ? '✓ Marcar como tomado' : '✓ Mark as taken'}
              </Button>

              {/* Botão secundário: Adiar */}
              {onSnooze && (
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={handleSnooze}
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-medium rounded-xl border-2 hover:bg-muted/50 transition-all active:scale-[0.98]"
                >
                  <Clock className="h-5 w-5 mr-2" />
                  {language === 'pt' ? '⏰ Adiar' : '⏰ Snooze'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
}

// Memoizado para evitar re-render desnecessário
export default memo(HeroNextDose);
