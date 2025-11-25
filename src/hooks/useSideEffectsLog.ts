import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SideEffectLog {
  id: string;
  user_id: string;
  profile_id: string | null;
  dose_id: string | null;
  item_id: string | null;
  recorded_at: string;
  overall_feeling: number | null;
  energy_level: number | null;
  pain_level: number | null;
  nausea_level: number | null;
  sleep_quality: number | null;
  side_effect_tags: string[];
  notes: string | null;
  created_at: string;
  items?: {
    name: string;
    dose_text: string | null;
  };
}

export interface SideEffectInput {
  dose_id?: string;
  item_id: string;
  profile_id?: string;
  overall_feeling?: number;
  energy_level?: number;
  pain_level?: number;
  nausea_level?: number;
  sleep_quality?: number;
  side_effect_tags?: string[];
  notes?: string;
}

export const COMMON_SIDE_EFFECTS = [
  'Dor de cabeça',
  'Náusea',
  'Tontura',
  'Sonolência',
  'Insônia',
  'Boca seca',
  'Diarreia',
  'Constipação',
  'Fadiga',
  'Ansiedade',
  'Perda de apetite',
  'Aumento de apetite',
  'Tremores',
  'Suor excessivo',
  'Palpitações',
];

export function useSideEffectsLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SideEffectLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async (itemId?: string, startDate?: Date, endDate?: Date) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('side_effects_log')
        .select(`
          *,
          items (
            name,
            dose_text
          )
        `)
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (itemId) {
        query = query.eq('item_id', itemId);
      }

      if (startDate) {
        query = query.gte('recorded_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('recorded_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching side effects logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createLog = async (input: SideEffectInput) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('side_effects_log')
      .insert({
        user_id: user.id,
        profile_id: input.profile_id,
        dose_id: input.dose_id,
        item_id: input.item_id,
        overall_feeling: input.overall_feeling,
        energy_level: input.energy_level,
        pain_level: input.pain_level,
        nausea_level: input.nausea_level,
        sleep_quality: input.sleep_quality,
        side_effect_tags: input.side_effect_tags || [],
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateLog = async (logId: string, updates: Partial<SideEffectInput>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('side_effects_log')
      .update(updates)
      .eq('id', logId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteLog = async (logId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('side_effects_log')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  const getCorrelationData = async (itemId: string, metric: keyof SideEffectLog) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('side_effects_log')
      .select('recorded_at, ' + metric)
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .not(metric, 'is', null)
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('Error fetching correlation data:', error);
      return [];
    }

    return data || [];
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  return {
    logs,
    isLoading,
    fetchLogs,
    createLog,
    updateLog,
    deleteLog,
    getCorrelationData,
  };
}
