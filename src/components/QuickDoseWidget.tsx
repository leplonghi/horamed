import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useFeedbackToast } from '@/hooks/useFeedbackToast';
import { useOverdueDoses } from '@/hooks/useOverdueDoses';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface NextDose {
  id: string;
  due_at: string;
  item_id: string;
  items: {
    name: string;
    dose_text?: string;
  };
}

/**
 * Widget rápido para marcar próxima dose
 * Ideal para tela inicial ou widget nativo
 */
export default function QuickDoseWidget({
  className
}: {
  className?: string;
}) {
  const [nextDose, setNextDose] = useState<NextDose | null>(null);
  const [loading, setLoading] = useState(true);
  const { overdueDoses, markAsTaken: markOverdueAsTaken, hasOverdue } = useOverdueDoses();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const {
    showFeedback
  } = useFeedbackToast();

  useEffect(() => {
    loadNextDose();

    // Reload every minute
    const interval = setInterval(loadNextDose, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNextDose = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const {
        data,
        error
      } = await supabase.from('dose_instances').select(`
          id,
          due_at,
          item_id,
          items!inner (
            user_id,
            name,
            dose_text
          )
        `).eq('status', 'scheduled').gte('due_at', now.toISOString()).lte('due_at', next2Hours.toISOString()).order('due_at', {
        ascending: true
      }).limit(1).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading next dose:', error);
        return;
      }
      setNextDose(data);
    } catch (error) {
      console.error('Error in loadNextDose:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTake = async () => {
    if (!nextDose) return;
    try {
      const {
        error
      } = await supabase.functions.invoke('handle-dose-action', {
        body: {
          doseId: nextDose.id,
          action: 'taken'
        }
      });
      if (error) throw error;
      const itemData = Array.isArray(nextDose.items) ? nextDose.items[0] : nextDose.items;
      showFeedback('dose-taken', {
        medicationName: itemData.name
      });

      // Reload next dose
      loadNextDose();
    } catch (error) {
      console.error('Error marking dose as taken:', error);
      showFeedback('dose-missed');
    }
  };

  const handleOverdueTake = async (doseId: string, itemName: string) => {
    await markOverdueAsTaken(doseId);
    showFeedback('dose-taken', { medicationName: itemName });
    loadNextDose();
  };

  if (loading) {
    return (
      <Card className={cn("p-3 animate-pulse", className)}>
        <div className="h-12 bg-muted rounded" />
      </Card>
    );
  }

  // Show overdue doses with priority
  if (hasOverdue) {
    const firstOverdue = overdueDoses[0];
    return (
      <Card className={cn(
        "p-4 bg-gradient-to-br from-red-500/15 to-red-500/5 border-red-500/30 shadow-lg shadow-red-500/10",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                {t('quickDose.late')} {firstOverdue.minutesOverdue}min
              </span>
              {overdueDoses.length > 1 && (
                <span className="text-xs text-red-500/70">
                  +{overdueDoses.length - 1} {overdueDoses.length - 1 === 1 ? t('quickDose.other') : t('quickDose.others')}
                </span>
              )}
            </div>
            <h3 className="font-semibold truncate">{firstOverdue.itemName}</h3>
            {firstOverdue.doseText && (
              <p className="text-xs text-muted-foreground truncate">{firstOverdue.doseText}</p>
            )}
          </div>
          <Button
            onClick={() => handleOverdueTake(firstOverdue.id, firstOverdue.itemName)}
            size="sm"
            className="shrink-0 font-semibold bg-red-500 hover:bg-red-600 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {t('quickDose.tookIt')}
          </Button>
        </div>
      </Card>
    );
  }

  if (!nextDose) {
    return (
      <Card className={cn("p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20", className)}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-green-600 dark:text-green-400">{t('quickDose.allGood')}</h3>
            <p className="text-xs text-muted-foreground">{t('quickDose.noPending2h')}</p>
          </div>
        </div>
      </Card>
    );
  }

  const itemData = Array.isArray(nextDose.items) ? nextDose.items[0] : nextDose.items;
  const dueTime = new Date(nextDose.due_at);
  const minutesUntil = Math.round((dueTime.getTime() - new Date().getTime()) / 60000);
  const isNow = minutesUntil <= 5 && minutesUntil >= -5;

  return (
    <Card className={cn(
      "p-4 transition-all",
      isNow 
        ? "bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/10" 
        : "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
          isNow ? "bg-amber-500/20" : "bg-primary/20"
        )}>
          <Clock className={cn("h-5 w-5", isNow ? "text-amber-600 dark:text-amber-400" : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-semibold",
              isNow ? "text-amber-600 dark:text-amber-400" : "text-primary"
            )}>
              {isNow ? t('quickDose.now') : format(dueTime, "HH:mm", { locale: dateLocale })}
            </span>
          </div>
          <h3 className="font-semibold truncate">{itemData.name}</h3>
          {itemData.dose_text && (
            <p className="text-xs text-muted-foreground truncate">{itemData.dose_text}</p>
          )}
        </div>
        <Button
          onClick={handleQuickTake}
          size="sm"
          className={cn(
            "shrink-0 font-semibold",
            isNow && "bg-amber-500 hover:bg-amber-600"
          )}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          {t('quickDose.tookIt')}
        </Button>
      </div>
    </Card>
  );
}