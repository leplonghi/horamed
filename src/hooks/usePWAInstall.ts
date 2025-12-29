import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  showPrompt: boolean;
}

const STORAGE_KEYS = {
  DISMISSED_AT: 'horamed_pwa_dismissed_at',
  INSTALLED: 'horamed_pwa_installed',
  VISIT_COUNT: 'horamed_pwa_visit_count',
  LAST_VISIT: 'horamed_pwa_last_visit',
};

const DISMISS_DURATION_DAYS = 3;
const MIN_VISITS_BEFORE_PROMPT = 1;

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    showPrompt: false,
  });

  // Detect iOS
  const detectIOS = useCallback(() => {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  }, []);

  // Detect Android
  const detectAndroid = useCallback(() => {
    return /Android/.test(navigator.userAgent);
  }, []);

  // Check if running in standalone mode (installed PWA)
  const checkStandalone = useCallback(() => {
    // Check display-mode media query
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // Check display-mode fullscreen
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return true;
    }
    // Check iOS standalone mode
    if ((navigator as any).standalone === true) {
      return true;
    }
    // Check if opened from home screen (URL has source=pwa)
    if (window.location.search.includes('source=pwa')) {
      return true;
    }
    return false;
  }, []);

  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    // If running standalone, it's installed
    if (checkStandalone()) {
      return true;
    }
    // Check localStorage flag
    if (localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true') {
      return true;
    }
    return false;
  }, [checkStandalone]);

  // Check if should show prompt based on frequency rules
  const shouldShowPrompt = useCallback(() => {
    // Never show if already installed or standalone
    if (checkIfInstalled() || checkStandalone()) {
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

    return visitCount >= MIN_VISITS_BEFORE_PROMPT;
  }, [checkIfInstalled, checkStandalone]);

  // Initialize on mount
  useEffect(() => {
    const installed = checkIfInstalled();
    const iosDevice = detectIOS();
    const androidDevice = detectAndroid();
    const standalone = checkStandalone();

    setState(prev => ({
      ...prev,
      isInstalled: installed,
      isIOS: iosDevice,
      isAndroid: androidDevice,
      isStandalone: standalone,
    }));

    // Mark as installed if detected
    if (installed || standalone) {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
    }

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setState(prev => ({ ...prev, isStandalone: true, isInstalled: true }));
        localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [checkIfInstalled, detectIOS, detectAndroid, checkStandalone]);

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
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false, 
        showPrompt: false,
        isStandalone: true,
      }));
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      setDeferredPrompt(null);
      
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
          platform: state.isIOS ? 'ios' : state.isAndroid ? 'android' : 'other',
          userAgent: navigator.userAgent,
          standalone: state.isStandalone,
        },
      });
    } catch (error) {
      console.error('Error tracking PWA event:', error);
    }
  }, [state.isIOS, state.isAndroid, state.isStandalone]);

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
        setState(prev => ({ ...prev, showPrompt: false, isInstalled: true }));
        localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
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

  // Show custom prompt
  const requestShowPrompt = useCallback(() => {
    if (shouldShowPrompt() && (deferredPrompt || state.isIOS)) {
      setState(prev => ({ ...prev, showPrompt: true }));
      trackEvent('pwa_prompt_shown');
      return true;
    }
    return false;
  }, [shouldShowPrompt, deferredPrompt, state.isIOS, trackEvent]);

  // Dismiss prompt with cooldown
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
    isAndroid: state.isAndroid,
    isStandalone: state.isStandalone,
    showPrompt: state.showPrompt,
    triggerInstall,
    requestShowPrompt,
    dismissPrompt,
    hidePrompt,
    shouldShowPrompt,
  };
}