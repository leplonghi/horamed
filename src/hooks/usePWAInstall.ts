import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showPrompt: boolean;
}

const STORAGE_KEYS = {
  DISMISSED_AT: 'horamed_pwa_dismissed_at',
  INSTALLED: 'horamed_pwa_installed',
  VISIT_COUNT: 'horamed_pwa_visit_count',
  LAST_VISIT: 'horamed_pwa_last_visit',
};

const DISMISS_DURATION_DAYS = 3; // Show again after 3 days
const MIN_VISITS_BEFORE_PROMPT = 1; // Show on first visit

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    isIOS: false,
    showPrompt: false,
  });

  // Detect iOS
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    // Check display-mode for standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // Check for iOS standalone
    if ((navigator as any).standalone === true) {
      return true;
    }
    // Check localStorage flag
    if (localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true') {
      return true;
    }
    return false;
  }, []);

  // Check if should show prompt based on frequency rules
  const shouldShowPrompt = useCallback(() => {
    // Never show if already installed
    if (checkIfInstalled()) {
      return false;
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    if (dismissedAt) {
      const dismissedDate = new Date(parseInt(dismissedAt, 10));
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < DISMISS_DURATION_DAYS) {
        return false;
      }
    }

    // Check visit count
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);
    let visitCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);

    // Increment visit count if new day
    if (lastVisit !== today) {
      visitCount += 1;
      localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, visitCount.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, today);
    }

    // Only show after minimum visits
    return visitCount >= MIN_VISITS_BEFORE_PROMPT;
  }, [checkIfInstalled]);

  // Initialize on mount
  useEffect(() => {
    const installed = checkIfInstalled();
    const iosDevice = isIOS();

    setState(prev => ({
      ...prev,
      isInstalled: installed,
      isIOS: iosDevice,
    }));

    // Mark as installed if detected
    if (installed) {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
    }
  }, [checkIfInstalled, isIOS]);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed
    const installedHandler = () => {
      setState(prev => ({ ...prev, isInstalled: true, canInstall: false, showPrompt: false }));
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      setDeferredPrompt(null);
      
      // Track analytics
      trackEvent('pwa_installed');
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  // Track analytics event
  const trackEvent = useCallback(async (eventName: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('app_metrics').insert({
        event_name: eventName,
        user_id: user?.id || null,
        event_data: {
          platform: state.isIOS ? 'ios' : 'other',
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error('Error tracking PWA event:', error);
    }
  }, [state.isIOS]);

  // Trigger install prompt
  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        trackEvent('pwa_install_accepted');
        setState(prev => ({ ...prev, showPrompt: false }));
      } else {
        trackEvent('pwa_install_dismissed');
        localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
        setState(prev => ({ ...prev, showPrompt: false }));
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error triggering install:', error);
      return false;
    }
  }, [deferredPrompt, trackEvent]);

  // Show custom prompt (call this when you want to display the UI)
  const requestShowPrompt = useCallback(() => {
    if (shouldShowPrompt() && (deferredPrompt || state.isIOS)) {
      setState(prev => ({ ...prev, showPrompt: true }));
      trackEvent('pwa_prompt_shown');
      return true;
    }
    return false;
  }, [shouldShowPrompt, deferredPrompt, state.isIOS, trackEvent]);

  // Dismiss prompt
  const dismissPrompt = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
    setState(prev => ({ ...prev, showPrompt: false }));
    trackEvent('pwa_prompt_dismissed');
  }, [trackEvent]);

  // Hide prompt without long-term dismissal
  const hidePrompt = useCallback(() => {
    setState(prev => ({ ...prev, showPrompt: false }));
  }, []);

  return {
    canInstall: state.canInstall || state.isIOS,
    isInstalled: state.isInstalled,
    isIOS: state.isIOS,
    showPrompt: state.showPrompt,
    triggerInstall,
    requestShowPrompt,
    dismissPrompt,
    hidePrompt,
    shouldShowPrompt,
  };
}
