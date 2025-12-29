import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'premium_individual' | 'premium_family';
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

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isPremium: boolean;
  isFree: boolean;
  isExpired: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number | null;
  daysLeft: number | null;
  canAddMedication: boolean;
  hasFeature: (feature: 'ocr' | 'charts' | 'unlimited_meds' | 'no_ads') => boolean;
  refresh: () => Promise<void>;
  syncWithStripe: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      } else if (data) {
        setSubscription(data as Subscription);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
    
    // Refresh every 5 minutes instead of 30 seconds
    const interval = setInterval(loadSubscription, 300000);
    return () => clearInterval(interval);
  }, []);

  const syncWithStripe = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('sync-subscription');
      
      if (error && !error.message?.includes('not authenticated')) {
        throw error;
      }
      
      if (data?.synced) {
        await loadSubscription();
        toast({
          title: 'Assinatura sincronizada',
          description: data.subscribed ? 'Sua assinatura Premium está ativa!' : 'Nenhuma assinatura ativa encontrada',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Erro ao sincronizar',
        description: 'Não foi possível sincronizar com o Stripe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if on trial - either explicit trial status OR trial_ends_at in the future
  const isOnTrial = (subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()) || 
    (subscription?.status === 'trial');
  
  // Premium status - includes trial period (trial users get FULL premium features)
  const isPremium = (
    subscription?.plan_type === 'premium' || 
    subscription?.plan_type === 'premium_individual' || 
    subscription?.plan_type === 'premium_family' ||
    isOnTrial // Trial users are treated as premium
  ) && (subscription?.status === 'active' || subscription?.status === 'trial' || isOnTrial);
  
  const isFree = subscription?.plan_type === 'free' && !isOnTrial;
  
  const trialDaysLeft = subscription?.trial_ends_at && isOnTrial
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  
  const daysLeft = subscription?.expires_at 
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpired = subscription?.status === 'expired' || (daysLeft !== null && daysLeft <= 0 && !isOnTrial);

  // Users can add medications if premium, on trial, or within free tier limits
  const canAddMedication = isPremium || isOnTrial || (isFree && !isExpired);
  
  // Trial users get ALL premium features
  const hasFeature = (feature: 'ocr' | 'charts' | 'unlimited_meds' | 'no_ads') => {
    if (isPremium || isOnTrial) return true;
    if (isExpired) return false;
    return false;
  };

  return (
    <SubscriptionContext.Provider
      value={{
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
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
