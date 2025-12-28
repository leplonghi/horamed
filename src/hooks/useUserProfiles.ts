import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfileCache } from './useProfileCache';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string | null;
  birth_date?: string | null;
  relationship: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserProfiles() {
  // Initialize from localStorage immediately to avoid flash
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const cached = localStorage.getItem('cachedProfiles');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('cachedActiveProfile');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  
  const [loading, setLoading] = useState(!profiles.length);
  const { prefetchAllProfiles } = useProfileCache();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('name');

      if (error) throw error;

      const profilesList = data || [];
      setProfiles(profilesList);
      
      // Cache profiles in localStorage for instant load
      localStorage.setItem('cachedProfiles', JSON.stringify(profilesList));
      
      // Determine active profile
      const savedProfileId = localStorage.getItem('activeProfileId');
      let newActiveProfile: UserProfile | null = null;
      
      if (savedProfileId && profilesList.length > 0) {
        newActiveProfile = profilesList.find(p => p.id === savedProfileId) || null;
      }
      
      if (!newActiveProfile && profilesList.length > 0) {
        newActiveProfile = profilesList.find(p => p.is_primary) || profilesList[0];
      }
      
      if (newActiveProfile) {
        setActiveProfile(newActiveProfile);
        localStorage.setItem('activeProfileId', newActiveProfile.id);
        localStorage.setItem('cachedActiveProfile', JSON.stringify(newActiveProfile));
      }
      
      // Prefetch in background - don't await
      if (profilesList.length > 0) {
        prefetchAllProfiles(profilesList, user.id).catch(console.error);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profile: Partial<UserProfile> & { name: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: user.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          birth_date: profile.birth_date,
          relationship: profile.relationship || 'self',
          is_primary: profile.is_primary || false
        }])
        .select()
        .single();

      if (error) throw error;

      await loadProfiles();
      toast.success('Perfil criado com sucesso');
      return data;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Erro ao criar perfil');
      throw error;
    }
  };

  const updateProfile = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await loadProfiles();
      toast.success('Perfil atualizado');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (activeProfile?.id === id) {
        setActiveProfile(null);
        localStorage.removeItem('activeProfileId');
      }

      await loadProfiles();
      toast.success('Perfil removido');
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast.error(error.message || 'Erro ao remover perfil');
      throw error;
    }
  };

  const switchProfile = (profile: UserProfile) => {
    // Instant switch - data is already cached
    setActiveProfile(profile);
    localStorage.setItem('activeProfileId', profile.id);
    localStorage.setItem('cachedActiveProfile', JSON.stringify(profile));
    toast.success(`Perfil: ${profile.name}`, { duration: 1000 });
    
    // Notify components about profile switch
    window.dispatchEvent(new CustomEvent('profile-switched', { detail: profile }));
  };

  return {
    profiles,
    activeProfile,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    refresh: loadProfiles
  };
}