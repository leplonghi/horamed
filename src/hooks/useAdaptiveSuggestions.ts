import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

interface AdaptiveSuggestion {
  type: 'reschedule' | 'extra_reminder' | 'streak_motivation';
  message: string;
  itemId?: string;
  itemName?: string;
  suggestedTime?: string;
}

/**
 * Hook para gerar sugestões adaptativas baseadas no comportamento do usuário
 */
export const useAdaptiveSuggestions = () => {
  const [suggestions, setSuggestions] = useState<AdaptiveSuggestion[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    const analyzeBehavior = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get recent dose history - fixed query without invalid 'time' column
        const { data: doses, error } = await supabase
          .from('dose_instances')
          .select(`
            id,
            due_at,
            taken_at,
            status,
            item_id,
            items!inner (
              user_id,
              name
            )
          `)
          .gte('due_at', sevenDaysAgo.toISOString())
          .order('due_at', { ascending: false })
          .limit(100);

        if (error || !doses || !isMounted) {
          if (error) console.error('Error fetching dose history:', error);
          return;
        }

        const newSuggestions: AdaptiveSuggestion[] = [];

        // Group by medication
        const byMedication = doses.reduce((acc, dose) => {
          const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;
          if (!itemData) return acc;
          if (!acc[dose.item_id]) {
            acc[dose.item_id] = { doses: [], name: itemData.name };
          }
          acc[dose.item_id].doses.push(dose);
          return acc;
        }, {} as Record<string, { doses: any[], name: string }>);

        // Analyze each medication
        Object.entries(byMedication).forEach(([itemId, { doses: medDoses, name }]) => {
          // Check for consistent delays
          const delays = medDoses
            .filter(d => d.status === 'taken' && d.taken_at && d.due_at)
            .map(d => {
              const due = new Date(d.due_at);
              const taken = new Date(d.taken_at);
              return (taken.getTime() - due.getTime()) / (1000 * 60); // minutes
            })
            .filter(delay => delay > 30); // Only significant delays

          if (delays.length >= 3) {
            const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
            const avgDelayHours = Math.floor(avgDelay / 60);
            const avgDelayMinutes = Math.floor(avgDelay % 60);

            newSuggestions.push({
              type: 'reschedule',
              message: `Você costuma tomar ${name} com ${avgDelayHours}h${avgDelayMinutes}min de atraso. Quer ajustar o horário?`,
              itemId,
              itemName: name,
            });
          }

          // Check for frequent misses
          const missedCount = medDoses.filter(d => d.status === 'missed').length;
          if (missedCount >= 3) {
            newSuggestions.push({
              type: 'extra_reminder',
              message: `${name} foi esquecido ${missedCount} vezes esta semana. Quer um lembrete extra?`,
              itemId,
              itemName: name,
            });
          }

          // Check for good streaks
          let currentStreak = 0;
          for (const dose of medDoses) {
            if (dose.status === 'taken') currentStreak++;
            else break;
          }

          if (currentStreak >= 7 && currentStreak % 7 === 0) {
            newSuggestions.push({
              type: 'streak_motivation',
              message: `🔥 Incrível! ${currentStreak} doses seguidas de ${name}. Continue assim!`,
              itemId,
              itemName: name,
            });
          }
        });

        if (isMounted) {
          setSuggestions(newSuggestions);
        }
      } catch (error) {
        console.error('Error analyzing behavior:', error);
      }
    };

    // Delay initial analysis to avoid blocking initial load
    const timeout = setTimeout(analyzeBehavior, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return { suggestions };
};
