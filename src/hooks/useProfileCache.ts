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

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache validity
const STORAGE_KEY = 'profileCacheStore';

// Load initial cache from localStorage
const loadCacheFromStorage = (): CacheStore => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use cache if less than 10 minutes old
      const now = Date.now();
      const validCache: CacheStore = {};
      for (const [key, value] of Object.entries(parsed)) {
        if ((value as ProfileCache).lastUpdated > now - 10 * 60 * 1000) {
          validCache[key] = value as ProfileCache;
        }
      }
      return validCache;
    }
  } catch (e) {
    console.error('Error loading cache from storage:', e);
  }
  return {};
};

export function useProfileCache() {
  const [cache, setCache] = useState<CacheStore>(loadCacheFromStorage);
  const isFetchingRef = useRef<Set<string>>(new Set());
  const cacheRef = useRef<CacheStore>(cache);
  
  // Keep ref in sync with state to avoid stale closures
  cacheRef.current = cache;

  const prefetchProfileData = useCallback(async (profileId: string, userId: string) => {
    // Use ref to get current cache (avoid stale closure)
    const existingCache = cacheRef.current[profileId];
    if (existingCache && Date.now() - existingCache.lastUpdated < CACHE_TTL) {
      return; // Skip if cache is still valid
    }

    // Avoid duplicate fetches
    if (isFetchingRef.current.has(profileId)) return;
    isFetchingRef.current.add(profileId);

    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;

      // Fetch all data in parallel
      const [
        medicationsRes,
        dosesRes,
        documentsRes,
        vitalSignsRes,
        consultationsRes,
        healthEventsRes
      ] = await Promise.all([
        supabase
          .from('items')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .eq('is_active', true),
        
        supabase
          .from('dose_instances')
          .select(`*, items!inner(id, name, dose_text, profile_id, user_id)`)
          .eq('items.user_id', userId)
          .eq('items.profile_id', profileId)
          .gte('due_at', startOfDay)
          .lte('due_at', endOfDay)
          .order('due_at'),
        
        supabase
          .from('documentos_saude')
          .select('id, title, created_at, categoria_id, mime_type')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('sinais_vitais')
          .select('id, data_medicao, peso_kg, pressao_sistolica, pressao_diastolica')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('data_medicao', { ascending: false })
          .limit(10),
        
        supabase
          .from('consultas_medicas')
          .select('id, data_consulta, medico_nome, especialidade, status')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('data_consulta', { ascending: false })
          .limit(10),
        
        supabase
          .from('eventos_saude')
          .select('id, title, due_date, type')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .is('completed_at', null)
          .order('due_date')
          .limit(10)
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

      setCache(prev => {
        const newCache = { ...prev, [profileId]: profileCache };
        // Persist to localStorage for faster reload
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newCache));
        } catch (e) {
          // Ignore storage errors
        }
        return newCache;
      });
    } catch (error) {
      console.error('Error prefetching profile data:', error);
    } finally {
      isFetchingRef.current.delete(profileId);
    }
  }, []); // Remove cache dependency - use ref instead

  const prefetchAllProfiles = useCallback(async (profiles: any[], userId: string) => {
    // Only prefetch active profile first for speed, others in background
    if (profiles.length === 0) return;
    
    const activeId = localStorage.getItem('activeProfileId');
    const activeProfile = profiles.find(p => p.id === activeId) || profiles[0];
    
    // Prefetch active profile immediately
    await prefetchProfileData(activeProfile.id, userId);
    
    // Prefetch others after delay to not block UI
    setTimeout(() => {
      profiles
        .filter(p => p.id !== activeProfile.id)
        .forEach(profile => prefetchProfileData(profile.id, userId));
    }, 2000);
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
    cacheRef.current = {};
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfileCache = useCallback((profileId: string, updates: Partial<ProfileCache>) => {
    setCache(prev => {
      const newCache = {
        ...prev,
        [profileId]: {
          ...prev[profileId],
          ...updates,
          lastUpdated: Date.now()
        }
      };
      // Also persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCache));
      } catch (e) {
        // Ignore storage errors
      }
      return newCache;
    });
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
