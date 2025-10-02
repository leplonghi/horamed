import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription:', error);
        toast({
          title: 'Erro ao carregar assinatura',
          description: error.message,
          variant: 'destructive',
        });
      } else if (data) {
        setSubscription(data as Subscription);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscription?.plan_type === 'premium' && subscription?.status === 'active';
  const isFree = subscription?.plan_type === 'free';
  
  const daysLeft = subscription?.expires_at 
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpired = subscription?.status === 'expired' || (daysLeft !== null && daysLeft <= 0);

  const canAddMedication = isPremium || (isFree && !isExpired);
  
  const hasFeature = (feature: 'ocr' | 'charts' | 'unlimited_meds' | 'no_ads') => {
    if (isPremium) return true;
    if (isExpired) return false;
    
    // Free users don't have these features
    if (feature === 'ocr' || feature === 'charts' || feature === 'unlimited_meds' || feature === 'no_ads') {
      return false;
    }
    
    return false;
  };

  return {
    subscription,
    loading,
    isPremium,
    isFree,
    isExpired,
    daysLeft,
    canAddMedication,
    hasFeature,
    refresh: loadSubscription,
  };
}
