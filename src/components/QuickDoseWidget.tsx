import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFeedbackToast } from '@/hooks/useFeedbackToast';
import { cn } from '@/lib/utils';

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
export default function QuickDoseWidget({ className }: { className?: string }) {
  const [nextDose, setNextDose] = useState<NextDose | null>(null);
  const [loading, setLoading] = useState(true);
  const { showFeedback } = useFeedbackToast();

  useEffect(() => {
    loadNextDose();

    // Reload every minute
    const interval = setInterval(loadNextDose, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadNextDose = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('dose_instances')
        .select(`
          id,
          due_at,
          item_id,
          items!inner (
            user_id,
            name,
            dose_text
          )
        `)
        .eq('status', 'scheduled')
        .gte('due_at', now.toISOString())
        .lte('due_at', next2Hours.toISOString())
        .order('due_at', { ascending: true })
        .limit(1)
        .single();

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
      const { error } = await supabase.functions.invoke('handle-dose-action', {
        body: { doseId: nextDose.id, action: 'taken' }
      });

      if (error) throw error;

      const itemData = Array.isArray(nextDose.items) ? nextDose.items[0] : nextDose.items;
      showFeedback('dose-taken', { medicationName: itemData.name });
      
      // Reload next dose
      loadNextDose();
    } catch (error) {
      console.error('Error marking dose as taken:', error);
      showFeedback('dose-missed');
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-4 animate-pulse", className)}>
        <div className="h-16 bg-muted rounded" />
      </Card>
    );
  }

  if (!nextDose) {
    return (
      <Card className={cn("p-6 bg-gradient-to-br from-primary/5 to-primary/10", className)}>
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
          <h3 className="font-semibold text-lg">Sem doses pendentes</h3>
          <p className="text-sm text-muted-foreground">Você está em dia! 🎉</p>
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
      "p-6 transition-all",
      isNow ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/50 shadow-lg" : "",
      className
    )}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Clock className={cn("h-5 w-5", isNow ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium text-muted-foreground">
                {isNow ? "Agora" : format(dueTime, "HH:mm", { locale: ptBR })}
              </span>
            </div>
            <h3 className="font-semibold text-xl">{itemData.name}</h3>
            {itemData.dose_text && (
              <p className="text-sm text-muted-foreground">{itemData.dose_text}</p>
            )}
          </div>
        </div>

        <Button 
          onClick={handleQuickTake}
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm hover:scale-105 transition-all"
          size="lg"
        >
          <CheckCircle2 className="h-5 w-5" />
          ✓ Tomei agora
        </Button>
      </div>
    </Card>
  );
}
