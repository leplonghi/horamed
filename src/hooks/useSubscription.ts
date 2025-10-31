import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium_individual' | 'premium_family';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  trial_used: boolean;
  price_variant: 'A' | 'B' | 'C';
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // First load the subscription
      await loadSubscription();
      
      // Only sync if user is authenticated
      if (user?.email) {
        console.log('Auto-syncing with Stripe after authentication...');
        await syncWithStripeInternal();
        
        // Reload subscription after sync
        await loadSubscription();
      }
    };
    
    initializeSubscription();
    
    // Auto-refresh subscription every 30 seconds (only if user is logged in)
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadSubscription();
      }
    }, 30000);
    return () => clearInterval(interval);
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
        console.log('Subscription loaded:', data);
        setSubscription(data as Subscription);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithStripeInternal = async (showToast = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Don't try to sync if user is not authenticated
      if (!user) {
        console.log('Skipping sync - user not authenticated');
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-subscription');
      
      if (error) {
        // Silently ignore authentication errors
        if (error.message?.includes('not authenticated')) {
          console.log('Skipping sync - authentication error');
          return;
        }
        throw error;
      }
      
      console.log('Sync result:', data);
      
      if (data?.synced) {
        await loadSubscription();
        if (showToast) {
          toast({
            title: 'Assinatura sincronizada',
            description: data.subscribed ? 'Sua assinatura Premium está ativa!' : 'Nenhuma assinatura ativa encontrada',
          });
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      if (showToast) {
        toast({
          title: 'Erro ao sincronizar',
          description: 'Não foi possível sincronizar com o Stripe',
          variant: 'destructive',
        });
      }
    }
  };

  const syncWithStripe = async () => {
    try {
      setLoading(true);
      await syncWithStripeInternal(true);
      // Reload subscription after manual sync
      await loadSubscription();
    } finally {
      setLoading(false);
    }
  };

  const isPremium = (subscription?.plan_type === 'premium_individual' || subscription?.plan_type === 'premium_family') 
    && (subscription?.status === 'active' || subscription?.status === 'trial');
  const isFree = subscription?.plan_type === 'free';
  
  const isOnTrial = subscription?.status === 'trial' && subscription?.trial_ends_at 
    ? new Date(subscription.trial_ends_at) > new Date()
    : false;
  
  const trialDaysLeft = subscription?.trial_ends_at && isOnTrial
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  
  const daysLeft = subscription?.expires_at 
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpired = subscription?.status === 'expired' || (daysLeft !== null && daysLeft <= 0 && !isOnTrial);

  const canAddMedication = isPremium || isOnTrial || (isFree && !isExpired);
  
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
    isOnTrial,
    trialDaysLeft,
    daysLeft,
    canAddMedication,
    hasFeature,
    refresh: loadSubscription,
    syncWithStripe,
  };
}
