import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Cache for VAPID key
let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;

  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error) {
      console.error('[PushSubscription] Error fetching VAPID key:', error);
      return null;
    }
    cachedVapidKey = data?.vapidPublicKey || null;
    return cachedVapidKey;
  } catch (err) {
    console.error('[PushSubscription] Error fetching VAPID key:', err);
    return null;
  }
}

export interface UsePushSubscriptionReturn {
  isSubscribed: boolean;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Check current subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // Verify it's saved in our database
          const { data } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint)
            .single();

          setIsSubscribed(!!data);
        } else {
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error('[PushSubscription] Error checking subscription:', err);
        setError('Erro ao verificar assinatura push');
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSupported, user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      setError('Push notifications não suportadas');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get VAPID key from server
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        setError('VAPID key não configurada');
        setIsLoading(false);
        return false;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permissão de notificação negada');
        setIsLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const subscriptionJSON = subscription.toJSON();

      // Save to database
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJSON.endpoint!,
          p256dh: subscriptionJSON.keys!.p256dh,
          auth: subscriptionJSON.keys!.auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (dbError) {
        console.error('[PushSubscription] Error saving subscription:', dbError);
        throw dbError;
      }

      console.log('[PushSubscription] Subscription saved successfully');
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[PushSubscription] Error subscribing:', err);
      setError('Erro ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        // Unsubscribe from push
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('[PushSubscription] Error unsubscribing:', err);
      setError('Erro ao desativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  return {
    isSubscribed,
    isSupported,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}