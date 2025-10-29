import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Caregiver {
  id: string;
  email_or_phone: string;
  role: 'viewer' | 'helper';
  invited_at: string;
  accepted_at: string | null;
  caregiver_user_id: string | null;
}

export function useCaregivers() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCaregivers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('caregiver-invite', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setCaregivers(data.caregivers || []);
    } catch (error) {
      console.error('Error loading caregivers:', error);
      toast({
        title: 'Erro ao carregar cuidadores',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaregivers();
  }, []);

  const inviteCaregiver = async (email_or_phone: string, role: 'viewer' | 'helper' = 'viewer') => {
    try {
      const { data, error } = await supabase.functions.invoke('caregiver-invite', {
        body: { action: 'create', email_or_phone, role }
      });

      if (error) throw error;

      toast({
        title: 'Convite enviado',
        description: 'O link de convite foi gerado com sucesso'
      });

      await loadCaregivers();
      return data;
    } catch (error) {
      console.error('Error inviting caregiver:', error);
      toast({
        title: 'Erro ao convidar cuidador',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const revokeCaregiver = async (caregiver_id: string) => {
    try {
      const { error } = await supabase.functions.invoke('caregiver-invite', {
        body: { action: 'revoke', caregiver_id }
      });

      if (error) throw error;

      toast({
        title: 'Cuidador removido',
        description: 'O acesso foi revogado com sucesso'
      });

      await loadCaregivers();
    } catch (error) {
      console.error('Error revoking caregiver:', error);
      toast({
        title: 'Erro ao remover cuidador',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const acceptInvite = async (token: string) => {
    try {
      const { error } = await supabase.functions.invoke('caregiver-invite', {
        body: { action: 'accept', token }
      });

      if (error) throw error;

      toast({
        title: 'Convite aceito',
        description: 'Você agora é um cuidador autorizado'
      });

      return true;
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: 'Erro ao aceitar convite',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    caregivers,
    loading,
    inviteCaregiver,
    revokeCaregiver,
    acceptInvite,
    refresh: loadCaregivers
  };
}
