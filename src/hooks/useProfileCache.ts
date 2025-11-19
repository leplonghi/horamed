import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCache {
  medications: any[];
  todayDoses: any[];
  documents: any[];
  vitalSigns: any[];
  consultations: any[];
  healthEvents: any[];
  lastUpdated: number;
}

interface CacheStore {
  [profileId: string]: ProfileCache;
}

export function useProfileCache() {
  const [cache, setCache] = useState<CacheStore>({});
  const isFetchingRef = useRef<Set<string>>(new Set());

  const prefetchProfileData = useCallback(async (profileId: string, userId: string) => {
    // Evitar múltiplas requisições simultâneas para o mesmo perfil
    if (isFetchingRef.current.has(profileId)) return;
    
    isFetchingRef.current.add(profileId);

    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;

      // Buscar todos os dados em paralelo
      const [
        medicationsRes,
        dosesRes,
        documentsRes,
        vitalSignsRes,
        consultationsRes,
        healthEventsRes
      ] = await Promise.all([
        // Medicamentos ativos
        supabase
          .from('items')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .eq('is_active', true),
        
        // Doses de hoje
        supabase
          .from('dose_instances')
          .select(`
            *,
            items!inner(
              id,
              name,
              profile_id,
              user_id
            )
          `)
          .eq('items.user_id', userId)
          .eq('items.profile_id', profileId)
          .gte('due_at', startOfDay)
          .lte('due_at', endOfDay)
          .order('due_at'),
        
        // Documentos recentes (últimos 30 dias)
        supabase
          .from('documentos_saude')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Sinais vitais recentes (últimos 30 dias)
        supabase
          .from('sinais_vitais')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('data_medicao', { ascending: false })
          .limit(30),
        
        // Consultas futuras e recentes
        supabase
          .from('consultas_medicas')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('data_consulta', { ascending: false })
          .limit(20),
        
        // Eventos de saúde pendentes
        supabase
          .from('eventos_saude')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .is('completed_at', null)
          .order('due_date')
      ]);

      const profileCache: ProfileCache = {
        medications: medicationsRes.data || [],
        todayDoses: dosesRes.data || [],
        documents: documentsRes.data || [],
        vitalSigns: vitalSignsRes.data || [],
        consultations: consultationsRes.data || [],
        healthEvents: healthEventsRes.data || [],
        lastUpdated: Date.now()
      };

      setCache(prev => ({
        ...prev,
        [profileId]: profileCache
      }));
    } catch (error) {
      console.error('Error prefetching profile data:', error);
    } finally {
      isFetchingRef.current.delete(profileId);
    }
  }, []);

  const prefetchAllProfiles = useCallback(async (profiles: any[], userId: string) => {
    // Pré-carregar dados de todos os perfis em paralelo
    await Promise.all(
      profiles.map(profile => prefetchProfileData(profile.id, userId))
    );
  }, [prefetchProfileData]);

  const getProfileCache = useCallback((profileId: string): ProfileCache | null => {
    return cache[profileId] || null;
  }, [cache]);

  const invalidateProfileCache = useCallback((profileId: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[profileId];
      return newCache;
    });
  }, []);

  const invalidateAllCache = useCallback(() => {
    setCache({});
  }, []);

  const updateProfileCache = useCallback((profileId: string, updates: Partial<ProfileCache>) => {
    setCache(prev => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        ...updates,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  return {
    cache,
    prefetchProfileData,
    prefetchAllProfiles,
    getProfileCache,
    invalidateProfileCache,
    invalidateAllCache,
    updateProfileCache
  };
}
