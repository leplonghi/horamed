import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useConsultationCard() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCard = async (profile_id?: string, hours: number = 48) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('consultation-card', {
        body: { action: 'create', profile_id, hours }
      });

      if (error) throw error;

      toast({
        title: 'Cartão de consulta criado',
        description: `Válido por ${hours}h. Link expira automaticamente.`
      });

      return data;
    } catch (error) {
      console.error('Error creating consultation card:', error);
      toast({
        title: 'Erro ao criar cartão',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const viewCard = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('consultation-card', {
        body: { action: 'view', token }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error viewing consultation card:', error);
      toast({
        title: 'Erro ao visualizar cartão',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const revokeCard = async (token: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('consultation-card', {
        body: { action: 'revoke', token }
      });

      if (error) throw error;

      toast({
        title: 'Cartão revogado',
        description: 'O link não está mais acessível'
      });
    } catch (error) {
      console.error('Error revoking consultation card:', error);
      toast({
        title: 'Erro ao revogar cartão',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createCard,
    viewCard,
    revokeCard
  };
}
