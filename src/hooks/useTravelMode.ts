import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, differenceInDays, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

interface TravelCalculation {
  medication: {
    id: string;
    name: string;
    dose_text: string;
    category: string;
  };
  dailyDoses: number;
  totalRequired: number;
  currentStock: number;
  needsToBuy: number;
  packingNotes: string;
}

export function useTravelMode() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<TravelCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const calculateTravelNeeds = async (
    tripDays: number,
    destinationTimezone: string,
    bufferDays: number = 2
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch active medications with schedules and stock
      const { data: items, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          dose_text,
          category,
          schedules (
            times,
            freq_type,
            days_of_week
          ),
          stock (
            units_left,
            unit_label
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const totalDays = tripDays + bufferDays;
      const results: TravelCalculation[] = [];

      for (const item of items || []) {
        // Calculate daily doses based on schedule
        const schedule = item.schedules?.[0];
        let dailyDoses = 0;

        if (schedule) {
          const times = Array.isArray(schedule.times) ? schedule.times : [];
          
          if (schedule.freq_type === 'daily') {
            dailyDoses = times.length;
          } else if (schedule.freq_type === 'specific_days') {
            const daysOfWeek = schedule.days_of_week || [];
            dailyDoses = (times.length * daysOfWeek.length) / 7;
          } else if (schedule.freq_type === 'interval') {
            dailyDoses = times.length;
          }
        }

        const totalRequired = Math.ceil(dailyDoses * totalDays);
        const currentStock = item.stock?.[0]?.units_left || 0;
        const needsToBuy = Math.max(0, totalRequired - currentStock);

        let packingNotes = '';
        if (item.category === 'medicamento') {
          packingNotes = 'Manter na embalagem original com receita';
        } else if (item.category === 'suplemento') {
          packingNotes = 'Pode ser transportado em organizador';
        }

        results.push({
          medication: {
            id: item.id,
            name: item.name,
            dose_text: item.dose_text || '',
            category: item.category || 'medicamento'
          },
          dailyDoses,
          totalRequired,
          currentStock,
          needsToBuy,
          packingNotes
        });
      }

      setCalculations(results);
    } catch (error) {
      console.error('Error calculating travel needs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const adjustSchedulesForTimezone = async (
    destinationTimezone: string,
    startDate: Date,
    endDate: Date
  ) => {
    if (!user) return;

    try {
      // Get current timezone
      const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Fetch all active medications with schedules
      const { data: items } = await supabase
        .from('items')
        .select('id, schedules(id, times)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!items) return;

      // For each medication, adjust dose times
      for (const item of items) {
        const schedule = item.schedules?.[0];
        if (!schedule) continue;

        const times = Array.isArray(schedule.times) ? schedule.times : [];
        const adjustedTimes = times.map((time: string) => {
          // Parse time in current timezone
          const [hours, minutes] = time.split(':');
          const currentTime = new Date();
          currentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Convert to destination timezone
          const zonedTime = toZonedTime(currentTime, destinationTimezone);
          return formatInTimeZone(zonedTime, destinationTimezone, 'HH:mm');
        });

        // Update schedule with adjusted times
        await supabase
          .from('schedules')
          .update({ times: adjustedTimes })
          .eq('id', schedule.id);
      }

      // Regenerate dose instances for travel period
      await supabase.functions.invoke('generate-travel-doses', {
        body: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          timezone: destinationTimezone
        }
      });

    } catch (error) {
      console.error('Error adjusting schedules:', error);
    }
  };

  return {
    calculations,
    isLoading,
    calculateTravelNeeds,
    adjustSchedulesForTimezone
  };
}
