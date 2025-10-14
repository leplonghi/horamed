import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('name');

      if (error) throw error;

      setProfiles(data || []);
      
      // Se não houver perfil ativo, definir o primário ou o primeiro
      if (!activeProfile && data && data.length > 0) {
        const primary = data.find(p => p.is_primary) || data[0];
        setActiveProfile(primary);
        localStorage.setItem('activeProfileId', primary.id);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Erro ao carregar perfis');
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
    setActiveProfile(profile);
    localStorage.setItem('activeProfileId', profile.id);
    toast.success(`Perfil alterado para ${profile.name}`);
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