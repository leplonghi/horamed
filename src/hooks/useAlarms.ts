/**
 * Hook for managing scheduled alarms and notifications
 * Works with Service Worker for background execution
 * Syncs with Supabase for cloud backup and multi-device access
 */

import { useState, useEffect, useCallback } from 'react';
import { alarmDB, Alarm } from '@/lib/alarmDB';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseAlarmsReturn {
  alarms: Alarm[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  createAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => Promise<string>;
  updateAlarm: (alarm: Alarm) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  testNotification: (title?: string, message?: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  permissionStatus: NotificationPermission | 'unsupported';
  isSupported: boolean;
  syncWithServiceWorker: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
}

// Check if notifications are supported
const checkSupport = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Generate unique ID (UUID format for Supabase compatibility)
const generateId = () => {
  return crypto.randomUUID();
};

export function useAlarms(): UseAlarmsReturn {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    checkSupport() ? Notification.permission : 'unsupported'
  );

  const isSupported = checkSupport();

  // Load alarms from IndexedDB
  const loadLocalAlarms = useCallback(async () => {
    try {
      const storedAlarms = await alarmDB.getAll();
      const sorted = storedAlarms.sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      setAlarms(sorted);
      setError(null);
      return sorted;
    } catch (err) {
      console.error('[useAlarms] Error loading alarms:', err);
      setError('Erro ao carregar alarmes');
      return [];
    }
  }, []);

  // Sync alarms from Supabase to local IndexedDB
  const syncFromCloud = useCallback(async () => {
    if (!user) return;

    try {
      setSyncing(true);
      
      const { data: cloudAlarms, error: fetchError } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (fetchError) {
        console.error('[useAlarms] Error fetching cloud alarms:', fetchError);
        return;
      }

      if (!cloudAlarms || cloudAlarms.length === 0) {
        // If no cloud alarms, push local alarms to cloud
        const localAlarms = await alarmDB.getAll();
        for (const alarm of localAlarms) {
          await syncToCloud(alarm);
        }
        return;
      }

      // Convert Supabase format to local format
      const formattedAlarms: Alarm[] = cloudAlarms.map(alarm => ({
        id: alarm.id,
        title: alarm.title,
        message: alarm.message || undefined,
        scheduledAt: alarm.scheduled_at,
        enabled: alarm.enabled,
        recurrence: alarm.recurrence as Alarm['recurrence'],
        sound: alarm.sound,
        vibrate: alarm.vibrate,
        silent: alarm.silent,
        requireInteraction: alarm.require_interaction,
        url: alarm.url || undefined,
        action: alarm.action || undefined,
        createdAt: alarm.created_at,
        lastTriggered: alarm.last_triggered || undefined,
        category: alarm.category as Alarm['category'],
        metadata: (alarm.metadata as Record<string, unknown>) || undefined,
      }));

      // Get local alarms for comparison
      const localAlarms = await alarmDB.getAll();
      const cloudIds = new Set(formattedAlarms.map(a => a.id));

      // Update local IndexedDB with cloud data
      for (const alarm of formattedAlarms) {
        await alarmDB.save(alarm);
      }

      // Remove local alarms that don't exist in cloud (were deleted on another device)
      for (const localAlarm of localAlarms) {
        if (!cloudIds.has(localAlarm.id)) {
          await alarmDB.delete(localAlarm.id);
        }
      }

      // Reload from IndexedDB
      await loadLocalAlarms();
      
      console.log('[useAlarms] Synced', formattedAlarms.length, 'alarms from cloud');
    } catch (err) {
      console.error('[useAlarms] Cloud sync error:', err);
    } finally {
      setSyncing(false);
    }
  }, [user, loadLocalAlarms]);

  // Sync a single alarm to cloud
  const syncToCloud = useCallback(async (alarm: Alarm) => {
    if (!user) return;

    try {
      const { error: upsertError } = await supabase
        .from('alarms')
        .upsert({
          id: alarm.id,
          user_id: user.id,
          title: alarm.title,
          message: alarm.message || null,
          scheduled_at: alarm.scheduledAt,
          enabled: alarm.enabled,
          recurrence: alarm.recurrence,
          sound: alarm.sound,
          vibrate: alarm.vibrate,
          silent: alarm.silent,
          require_interaction: alarm.requireInteraction,
          url: alarm.url || null,
          action: alarm.action || null,
          category: alarm.category || 'reminder',
          metadata: alarm.metadata || {},
          last_triggered: alarm.lastTriggered || null,
        }, { onConflict: 'id' });

      if (upsertError) {
        console.error('[useAlarms] Error syncing to cloud:', upsertError);
      }
    } catch (err) {
      console.error('[useAlarms] Cloud sync error:', err);
    }
  }, [user]);

  // Delete alarm from cloud
  const deleteFromCloud = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('alarms')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('[useAlarms] Error deleting from cloud:', deleteError);
      }
    } catch (err) {
      console.error('[useAlarms] Cloud delete error:', err);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      // Load local alarms first (offline-first)
      await loadLocalAlarms();
      
      // Then sync from cloud if authenticated
      if (user) {
        await syncFromCloud();
      }
      
      setLoading(false);
    };

    init();
  }, [loadLocalAlarms, syncFromCloud, user]);

  // Listen for messages from service worker
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, alarmId } = event.data || {};
      
      if (type === 'ALARM_COMPLETED') {
        loadLocalAlarms();
        toast.success('Alarme concluído!');
      }
      
      if (type === 'NOTIFICATION_CLOSED') {
        console.log('[useAlarms] Notification closed:', alarmId);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported, loadLocalAlarms]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast.success('Notificações ativadas!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Notificações bloqueadas. Ative nas configurações do navegador.');
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('[useAlarms] Error requesting permission:', err);
      toast.error('Erro ao solicitar permissão');
      return false;
    }
  }, [isSupported]);

  // Send message to service worker
  const sendToServiceWorker = useCallback(async (type: string, payload: unknown) => {
    if (!isSupported) return null;

    const registration = await navigator.serviceWorker.ready;
    
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error || 'Unknown error'));
        }
      };

      registration.active?.postMessage(
        { type, payload },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  }, [isSupported]);

  // Create new alarm
  const createAlarm = useCallback(async (
    alarmData: Omit<Alarm, 'id' | 'createdAt'>
  ): Promise<string> => {
    try {
      // Check permission first
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) throw new Error('Permissão negada');
      }

      const alarm: Alarm = {
        ...alarmData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      // Save to IndexedDB
      await alarmDB.save(alarm);

      // Sync to cloud
      await syncToCloud(alarm);

      // Notify service worker
      try {
        await sendToServiceWorker('SCHEDULE_ALARM', alarm);
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available, alarm saved locally');
      }

      // Update state
      setAlarms(prev => [...prev, alarm].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));

      toast.success('Alarme criado com sucesso!');
      return alarm.id;
    } catch (err) {
      console.error('[useAlarms] Error creating alarm:', err);
      toast.error('Erro ao criar alarme');
      throw err;
    }
  }, [permissionStatus, requestPermission, sendToServiceWorker, syncToCloud]);

  // Update existing alarm
  const updateAlarm = useCallback(async (alarm: Alarm) => {
    try {
      await alarmDB.save(alarm);

      // Sync to cloud
      await syncToCloud(alarm);

      try {
        await sendToServiceWorker('UPDATE_ALARM', alarm);
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available');
      }

      setAlarms(prev => prev.map(a => a.id === alarm.id ? alarm : a));
      toast.success('Alarme atualizado!');
    } catch (err) {
      console.error('[useAlarms] Error updating alarm:', err);
      toast.error('Erro ao atualizar alarme');
      throw err;
    }
  }, [sendToServiceWorker, syncToCloud]);

  // Delete alarm
  const deleteAlarm = useCallback(async (id: string) => {
    try {
      await alarmDB.delete(id);

      // Delete from cloud
      await deleteFromCloud(id);

      try {
        await sendToServiceWorker('CANCEL_ALARM', { id });
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available');
      }

      setAlarms(prev => prev.filter(a => a.id !== id));
      toast.success('Alarme excluído!');
    } catch (err) {
      console.error('[useAlarms] Error deleting alarm:', err);
      toast.error('Erro ao excluir alarme');
      throw err;
    }
  }, [sendToServiceWorker, deleteFromCloud]);

  // Toggle alarm enabled state
  const toggleAlarm = useCallback(async (id: string) => {
    try {
      const alarm = await alarmDB.toggleEnabled(id);
      if (alarm) {
        // Sync to cloud
        await syncToCloud(alarm);

        try {
          await sendToServiceWorker('UPDATE_ALARM', alarm);
        } catch (swError) {
          console.warn('[useAlarms] Service worker not available');
        }

        setAlarms(prev => prev.map(a => a.id === id ? alarm : a));
        toast.success(alarm.enabled ? 'Alarme ativado!' : 'Alarme desativado!');
      }
    } catch (err) {
      console.error('[useAlarms] Error toggling alarm:', err);
      toast.error('Erro ao alterar alarme');
    }
  }, [sendToServiceWorker, syncToCloud]);

  // Test notification
  const testNotification = useCallback(async (
    title = '🔔 Teste de Notificação',
    message = 'Esta é uma notificação de teste do HoraMed!'
  ) => {
    try {
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }

      // Try service worker first
      try {
        await sendToServiceWorker('TEST_NOTIFICATION', { title, message });
        return;
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available, using Notification API');
      }

      // Fallback to direct Notification API
      if ('Notification' in window) {
        const options: NotificationOptions = {
          body: message,
          icon: '/icons/icon-192.png',
          badge: '/favicon.png',
        };
        new Notification(title, options);
      }
    } catch (err) {
      console.error('[useAlarms] Error testing notification:', err);
      toast.error('Erro ao enviar notificação de teste');
    }
  }, [permissionStatus, requestPermission, sendToServiceWorker]);

  // Sync with service worker
  const syncWithServiceWorker = useCallback(async () => {
    if (!isSupported) return;

    try {
      await sendToServiceWorker('CHECK_ALARMS', {});
      await loadLocalAlarms();
    } catch (err) {
      console.error('[useAlarms] Error syncing with service worker:', err);
    }
  }, [isSupported, sendToServiceWorker, loadLocalAlarms]);

  // Public method to force cloud sync
  const syncWithCloud = useCallback(async () => {
    await syncFromCloud();
  }, [syncFromCloud]);

  return {
    alarms,
    loading,
    syncing,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    testNotification,
    requestPermission,
    permissionStatus,
    isSupported,
    syncWithServiceWorker,
    syncWithCloud,
  };
}
