import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MedicationInteraction {
  id: string;
  drug_a: string;
  drug_b: string;
  severity: 'low' | 'moderate' | 'high' | 'contraindicated';
  description: string;
  recommendation: string | null;
  mechanism: string | null;
  item_a_name: string;
  item_b_name: string;
  item_a_id: string;
  item_b_id: string;
}

export interface InteractionAlert {
  id: string;
  interaction_id: string;
  item_a_id: string;
  item_b_id: string;
  severity: string;
  acknowledged_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

export function useMedicationInteractions(profileId?: string) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<MedicationInteraction[]>([]);
  const [alerts, setAlerts] = useState<InteractionAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInteractions = useCallback(async (newMedication?: string) => {
    if (!user) return { interactions: [], has_critical: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('check-interactions', {
        body: { 
          profile_id: profileId,
          new_medication: newMedication,
        }
      });

      if (fnError) throw fnError;

      setInteractions(data.interactions || []);
      return data;
    } catch (err: any) {
      console.error('Error checking interactions:', err);
      setError(err.message);
      return { interactions: [], has_critical: false };
    } finally {
      setLoading(false);
    }
  }, [user, profileId]);

  const loadAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const query = supabase
        .from('user_interaction_alerts')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false });

      if (profileId) {
        query.eq('profile_id', profileId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setAlerts((data || []) as InteractionAlert[]);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    }
  }, [user, profileId]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('user_interaction_alerts')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', alertId);

      if (updateError) throw updateError;
      
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err: any) {
      console.error('Error dismissing alert:', err);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('user_interaction_alerts')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', alertId);

      if (updateError) throw updateError;
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString() } : a
      ));
    } catch (err: any) {
      console.error('Error acknowledging alert:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkInteractions();
      loadAlerts();
    }
  }, [user, profileId, checkInteractions, loadAlerts]);

  return {
    interactions,
    alerts,
    loading,
    error,
    checkInteractions,
    dismissAlert,
    acknowledgeAlert,
    hasCritical: interactions.some(i => i.severity === 'contraindicated' || i.severity === 'high'),
    hasWarnings: interactions.length > 0,
  };
}