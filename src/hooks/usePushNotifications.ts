import { useEffect, useState, useCallback } from "react";
import { PushNotifications, ActionPerformed } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { addMinutes, addHours } from "date-fns";
import { useNotificationTypes, NotificationType, NOTIFICATION_CONFIGS } from "./useNotificationTypes";

// Check if running on native platform
const isNativePlatform = Capacitor.isNativePlatform();

interface QuietHours {
  enabled: boolean;
  startTime: string; // "22:00"
  endTime: string; // "06:00"
}

interface OfflineAction {
  id: string;
  doseId: string;
  action: 'taken' | 'snooze' | 'skip';
  timestamp: string;
  synced: boolean;
}

// Notification channel ID for Android
const CHANNEL_ID = "horamed-medicamentos";

export const usePushNotifications = () => {
  const navigate = useNavigate();
  const { getNotificationType } = useNotificationTypes();
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    startTime: "22:00",
    endTime: "06:00"
  });
  
  useEffect(() => {
    const initializeNotifications = async () => {
      console.log("[Notifications] Starting initialization...");
      console.log("[Notifications] Platform:", isNativePlatform ? "Native" : "Web");
      
      // Setup channels first (for Android)
      await setupNotificationChannels();
      
      // Initialize push notifications (this will request permissions)
      await initializePushNotifications();
      
      // Sync any offline actions
      await syncOfflineActions();
      
      console.log("[Notifications] ✓ Initialization complete");
    };

    initializeNotifications();
    
    // Reschedule every 30 minutes
    const scheduleInterval = setInterval(() => {
      console.log("[Notifications] Rescheduling notifications...");
      scheduleNext48Hours();
    }, 30 * 60 * 1000);
    
    // Sync offline actions every 2 minutes
    const syncInterval = setInterval(() => {
      syncOfflineActions();
    }, 2 * 60 * 1000);
    
    return () => {
      clearInterval(scheduleInterval);
      clearInterval(syncInterval);
    };
  }, []);

  // Setup Android notification channels and iOS action categories
  const setupNotificationChannels = async () => {
    // Skip on web - channels are only for native
    if (!isNativePlatform) {
      console.log("ℹ️ Skipping native notification channels on web");
      return;
    }
    
    try {
      // Create notification channel for Android
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: "Lembretes de Medicamentos",
        description: "Notificações para lembrar de tomar medicamentos",
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // PUBLIC
        sound: "default",
        vibration: true,
        lights: true,
        lightColor: "#10B981", // Green
      });

      // Register action types for notification buttons
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: "DOSE_REMINDER",
            actions: [
              {
                id: "taken",
                title: "✓ Tomei",
                foreground: true,
              },
              {
                id: "snooze",
                title: "⏰ 15 min",
                foreground: false,
              },
              {
                id: "skip",
                title: "→ Pular",
                foreground: false,
                destructive: true,
              },
            ],
          },
          {
            id: "DAILY_SUMMARY",
            actions: [
              {
                id: "view",
                title: "📊 Ver Resumo",
                foreground: true,
              },
            ],
          },
        ],
      });

      console.log("✓ Notification channels and action types configured");
    } catch (error) {
      console.error("Error setting up notification channels:", error);
    }
  };

  const isInQuietHours = (date: Date): boolean => {
    if (!quietHours.enabled) return false;
    
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    const [startH, startM] = quietHours.startTime.split(':').map(Number);
    const [endH, endM] = quietHours.endTime.split(':').map(Number);
    
    const currentMinutes = hour * 60 + minute;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  // Initialize Web Push notifications
  const initializeWebPushNotifications = async () => {
    try {
      if (!('Notification' in window)) {
        console.log("ℹ️ Browser doesn't support notifications");
        return;
      }

      // Check current permission status
      const currentPermission = Notification.permission;
      console.log("[Web Push] Current permission:", currentPermission);
      
      if (currentPermission === 'granted') {
        // Already have permission, just schedule
        console.log('✓ Web notifications already granted');
        scheduleWebNotifications();
      } else if (currentPermission === 'denied') {
        console.log('⚠️ Web notifications were previously denied');
        // Don't prompt - user already denied
      } else {
        // Permission is 'default' - we need to ask, but NOT automatically
        // Browser will block automatic permission requests
        // We'll prompt the user with a UI element instead
        console.log('ℹ️ Web notifications need permission - waiting for user action');
        
        // Dispatch event so UI can show a prompt
        window.dispatchEvent(new CustomEvent('notification-permission-needed'));
      }
    } catch (error) {
      console.error("Error initializing web notifications:", error);
    }
  };
  
  // Public method to request permission (must be called from user interaction)
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        toast.error("Seu navegador não suporta notificações");
        return false;
      }
      
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✓ Web notifications permission granted');
        toast.success("✓ Notificações ativadas!", { duration: 2000 });
        scheduleWebNotifications();
        return true;
      } else {
        console.log('⚠️ Web notifications denied by user');
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  // Schedule web notifications using the browser API with time-based types
  const scheduleWebNotifications = async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get doses for next 24 hours
      const now = new Date();
      const end24h = addHours(now, 24);

      const { data: doses, error } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          items (
            id,
            name,
            dose_text,
            user_id,
            category,
            notes,
            notification_type
          )
        `)
        .eq("items.user_id", user.id)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .lte("due_at", end24h.toISOString())
        .order("due_at", { ascending: true });

      if (error) throw error;
      if (!doses || doses.length === 0) return;

      // Clear any existing scheduled notifications in memory
      const scheduledNotifications: number[] = [];

      // Schedule notifications using setTimeout (simple approach for web)
      doses.forEach((dose) => {
        const dueDate = new Date(dose.due_at);
        const timeUntilDue = dueDate.getTime() - now.getTime();
        
        // Only schedule if in the future and not in quiet hours
        if (timeUntilDue > 0 && !isInQuietHours(dueDate)) {
          const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;
          if (!itemData) return;

          // Get notification type based on time and medication
          const notificationConfig = getNotificationType(dueDate, {
            category: itemData.category,
            notes: itemData.notes,
            notification_type: itemData.notification_type,
          });

          const hour = dueDate.getHours();
          const timeEmoji = hour >= 5 && hour < 12 ? '🌅' : 
                           hour >= 12 && hour < 18 ? '☀️' : 
                           hour >= 18 && hour < 21 ? '🌆' : '🌙';

          const timeoutId = setTimeout(() => {
            if (Notification.permission === 'granted' && !isInQuietHours(new Date())) {
              const notification = new Notification(`${timeEmoji} ${notificationConfig.title}`, {
                body: `${itemData.name}${itemData.dose_text ? ` - ${itemData.dose_text}` : ''}`,
                icon: '/favicon.png',
                tag: `dose-${dose.id}`,
                requireInteraction: notificationConfig.type === 'urgent' || notificationConfig.type === 'critical',
                silent: notificationConfig.type === 'gentle',
              });

              notification.onclick = () => {
                window.focus();
                navigate("/hoje");
                notification.close();
              };

              // For critical/urgent notifications, show a follow-up reminder
              if (notificationConfig.repeatInterval) {
                setTimeout(() => {
                  // Check if dose is still pending before repeating
                  checkAndRepeatNotification(dose.id, itemData.name, notificationConfig);
                }, notificationConfig.repeatInterval * 60 * 1000);
              }
            }
          }, timeUntilDue);

          scheduledNotifications.push(timeoutId as unknown as number);
        }
      });

      console.log(`✓ Scheduled ${doses.length} web notifications for next 24h`);
    } catch (error) {
      console.error("Error scheduling web notifications:", error);
    }
  };

  // Check if dose is still pending and repeat notification
  const checkAndRepeatNotification = async (
    doseId: string, 
    itemName: string, 
    config: { title: string; type: string; repeatInterval?: number }
  ) => {
    try {
      const { data: dose } = await supabase
        .from("dose_instances")
        .select("status")
        .eq("id", doseId)
        .single();

      if (dose?.status === 'scheduled') {
        // Dose still not taken, repeat notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(`⚠️ Lembrete: ${config.title}`, {
            body: `Você ainda não tomou ${itemName}`,
            icon: '/favicon.png',
            tag: `dose-repeat-${doseId}`,
            requireInteraction: true,
          });

          notification.onclick = () => {
            window.focus();
            navigate("/hoje");
            notification.close();
          };

          // Schedule another repeat if still critical
          if (config.repeatInterval) {
            setTimeout(() => {
              checkAndRepeatNotification(doseId, itemName, config);
            }, config.repeatInterval * 60 * 1000);
          }
        }
      }
    } catch (error) {
      console.error("Error checking dose status for repeat:", error);
    }
  };

  const initializePushNotifications = async () => {
    // Use web notifications for browsers, native for apps
    if (!isNativePlatform) {
      await initializeWebPushNotifications();
      return;
    }

    try {
      console.log("[Push] Initializing native push notifications...");
      
      // Check current permission status first
      const currentPushStatus = await PushNotifications.checkPermissions();
      const currentLocalStatus = await LocalNotifications.checkPermissions();
      
      console.log("[Push] Current permissions - Push:", currentPushStatus.receive, "Local:", currentLocalStatus.display);

      // Request Push Notifications permission if not granted
      if (currentPushStatus.receive !== "granted") {
        console.log("[Push] Requesting push notification permission...");
        const pushPermStatus = await PushNotifications.requestPermissions();
        
        if (pushPermStatus.receive === "granted") {
          console.log("[Push] ✓ Permission granted!");
          await PushNotifications.register();
          toast.success("✓ Notificações push ativadas!", { duration: 2000 });
        } else {
          console.warn("[Push] Permission denied by user");
          toast.error("Permissão negada. Ative nas Configurações do celular.", { duration: 4000 });
        }
      } else {
        // Already have permission, just register
        console.log("[Push] Already have permission, registering...");
        await PushNotifications.register();
      }
      
      // Request Local Notifications permission if not granted
      if (currentLocalStatus.display !== "granted") {
        console.log("[Push] Requesting local notification permission...");
        const localPermStatus = await LocalNotifications.requestPermissions();
        if (localPermStatus.display !== "granted") {
          console.warn("[Push] Local notifications permission not granted");
        } else {
          console.log("[Push] ✓ Local notifications permission granted!");
        }
      }

      // Handle registration success - THIS IS CRITICAL FOR SAVING THE TOKEN
      await PushNotifications.addListener("registration", async (token) => {
        console.log("[Push] ✓ Registration success! Token:", token.value.substring(0, 20) + "...");
        
        // Save the token immediately
        await savePushToken(token.value);
        
        // Also schedule notifications right after successful registration
        await scheduleNext48Hours();
      });

      // Handle registration errors
      await PushNotifications.addListener("registrationError", (error) => {
        console.error("[Push] Registration error:", error);
        toast.error("Erro ao registrar notificações. Tente novamente.", { duration: 3000 });
      });

      // Handle push notifications received (foreground)
      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("[Push] Received (foreground):", notification);
          // Don't show toast if in quiet hours
          if (!isInQuietHours(new Date())) {
            toast.info(notification.title || "💊 Lembrete de Medicamento", {
              description: notification.body,
              duration: 5000,
            });
          }
        }
      );

      // Handle notification action (when user taps notification)
      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        async (action: ActionPerformed) => {
          console.log("[Push] Action performed:", action);
          handleNotificationAction(action);
        }
      );
      
      // Handle local notification actions
      await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        async (action) => {
          console.log("[Local] Notification action:", action);
          handleNotificationAction(action as any);
        }
      );
      
      console.log("[Push] ✓ All listeners registered successfully");
    } catch (error) {
      console.error("[Push] Error initializing:", error);
      toast.error("Erro ao inicializar notificações", { duration: 3000 });
    }
  };

  const handleNotificationAction = async (action: ActionPerformed) => {
    const actionId = action.actionId;
    const doseId = action.notification.data?.doseId;

    if (actionId === 'taken' && doseId) {
      await handleDoseAction(doseId, 'taken');
    } else if (actionId === 'snooze' && doseId) {
      await handleDoseAction(doseId, 'snooze');
    } else if (actionId === 'skip' && doseId) {
      await handleDoseAction(doseId, 'skip');
    } else {
      // Default - navigate to today
      navigate("/hoje");
    }
  };

  const handleDoseAction = async (doseId: string, action: 'taken' | 'snooze' | 'skip') => {
    try {
      // Check if online
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        // Save to offline queue
        saveOfflineAction(doseId, action);
        toast.info(`⏸️ Ação salva (offline). Sincronizará quando conectar.`, { duration: 3000 });
        return;
      }

      const { data, error } = await supabase.functions.invoke('handle-dose-action', {
        body: { doseId, action }
      });

      if (error) throw error;

      if (action === 'taken') {
        toast.success(data.message || '✅ Dose marcada!', {
          description: data.streak > 3 ? `🔥 ${data.streak} dias seguidos!` : undefined,
          duration: 3000
        });
      } else if (action === 'snooze') {
        toast.info(data.message || '⏰ Lembrete adiado 15 minutos', { duration: 2000 });
        // Reschedule notification
        await scheduleSnoozeNotification(doseId, 15);
      } else if (action === 'skip') {
        toast.info('→ Dose pulada', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error handling dose action:', error);
      // Save to offline queue on error
      saveOfflineAction(doseId, action);
      toast.error('Erro. Salvamos sua ação e tentaremos novamente.', { duration: 3000 });
    }
  };

  const saveOfflineAction = (doseId: string, action: 'taken' | 'snooze' | 'skip') => {
    const actions = getOfflineActions();
    const newAction: OfflineAction = {
      id: Date.now().toString(),
      doseId,
      action,
      timestamp: new Date().toISOString(),
      synced: false
    };
    actions.push(newAction);
    localStorage.setItem('offline_dose_actions', JSON.stringify(actions));
  };

  const getOfflineActions = (): OfflineAction[] => {
    const stored = localStorage.getItem('offline_dose_actions');
    return stored ? JSON.parse(stored) : [];
  };

  const syncOfflineActions = async () => {
    if (!navigator.onLine) return;

    const actions = getOfflineActions();
    const unsyncedActions = actions.filter(a => !a.synced);

    if (unsyncedActions.length === 0) return;

    console.log(`Syncing ${unsyncedActions.length} offline actions...`);

    for (const action of unsyncedActions) {
      try {
        const { error } = await supabase.functions.invoke('handle-dose-action', {
          body: { 
            doseId: action.doseId, 
            action: action.action,
            timestamp: action.timestamp // Send original timestamp
          }
        });

        if (!error) {
          // Mark as synced
          action.synced = true;
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }

    // Update localStorage
    localStorage.setItem('offline_dose_actions', JSON.stringify(actions));

    // Clean up old synced actions (older than 7 days)
    const cleanedActions = actions.filter(a => {
      if (a.synced) {
        const actionDate = new Date(a.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return actionDate > weekAgo;
      }
      return true;
    });
    localStorage.setItem('offline_dose_actions', JSON.stringify(cleanedActions));
  };

  const scheduleNext48Hours = async () => {
    // On web, use the web notification scheduler
    if (!isNativePlatform) {
      await scheduleWebNotifications();
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get doses for next 48 hours
      const now = new Date();
      const end48h = addHours(now, 48);

      const { data: doses, error } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          items (
            id,
            name,
            dose_text,
            user_id
          )
        `)
        .eq("items.user_id", user.id)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .lte("due_at", end48h.toISOString())
        .order("due_at", { ascending: true });

      if (error) throw error;
      if (!doses || doses.length === 0) return;

      // Cancel all pending local notifications first
      const pending = await LocalNotifications.getPending();
      if (pending.notifications && pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      // Schedule new notifications with time-based types
      const notifications = doses.map((dose, index) => {
        const dueDate = new Date(dose.due_at);
        
        // Skip if in quiet hours
        if (isInQuietHours(dueDate)) {
          return null;
        }

        const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;
        if (!itemData) return null;

        // Get notification type based on time and medication
        const notificationConfig = getNotificationType(dueDate, {
          category: (itemData as any).category || null,
          notes: (itemData as any).notes || null,
          notification_type: (itemData as any).notification_type || null,
        });

        const hour = dueDate.getHours();
        const timeEmoji = hour >= 5 && hour < 12 ? '🌅' : 
                         hour >= 12 && hour < 18 ? '☀️' : 
                         hour >= 18 && hour < 21 ? '🌆' : '🌙';

        return {
          id: index + 1,
          title: `${timeEmoji} ${notificationConfig.title}`,
          body: `${itemData.name}${itemData.dose_text ? ` - ${itemData.dose_text}` : ''}`,
          largeBody: `Está na hora de tomar ${itemData.name}.${itemData.dose_text ? `\nDose: ${itemData.dose_text}` : ''}`,
          summaryText: "HoraMed",
          schedule: { at: dueDate },
          channelId: CHANNEL_ID,
          actionTypeId: "DOSE_REMINDER",
          extra: {
            doseId: dose.id,
            itemName: itemData.name,
            type: "dose_reminder",
            notificationType: notificationConfig.type,
          },
          smallIcon: "ic_stat_pill",
          largeIcon: "ic_launcher",
          iconColor: notificationConfig.color,
          sound: notificationConfig.sound === 'default' ? 'default' : notificationConfig.sound,
          ongoing: notificationConfig.type === 'critical',
          autoCancel: notificationConfig.type !== 'critical',
          group: "dose-reminders",
        };
      }).filter(Boolean);

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications: notifications as any[] });
        console.log(`✓ Scheduled ${notifications.length} notifications for next 48h`);
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  };

  const scheduleSnoozeNotification = async (doseId: string, minutes: number) => {
    try {
      const { data: dose } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          items (
            name,
            dose_text
          )
        `)
        .eq("id", doseId)
        .single();

      if (!dose) return;

      const snoozeTime = addMinutes(new Date(), minutes);
      const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;

      // Handle web snooze notifications
      if (!isNativePlatform) {
        const timeUntilSnooze = snoozeTime.getTime() - Date.now();
        setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`⏰ Lembrete Adiado`, {
              body: `${itemData?.name || 'Medicamento'}${itemData?.dose_text ? ` - ${itemData.dose_text}` : ''}`,
              icon: '/favicon.png',
              tag: `snooze-${doseId}`,
              requireInteraction: true,
            });
            notification.onclick = () => {
              window.focus();
              navigate("/hoje");
              notification.close();
            };
          }
        }, timeUntilSnooze);
        console.log(`✓ Scheduled web snooze notification for ${minutes} minutes`);
        return;
      }
      
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: `⏰ Lembrete Adiado`,
          body: `${itemData?.name || 'Medicamento'}${itemData?.dose_text ? ` - ${itemData.dose_text}` : ''}`,
          largeBody: `Você adiou este lembrete. Hora de tomar ${itemData?.name || 'seu medicamento'}.`,
          summaryText: "HoraMed",
          schedule: { at: snoozeTime },
          channelId: CHANNEL_ID,
          actionTypeId: "DOSE_REMINDER",
          extra: {
            doseId: dose.id,
            itemName: itemData?.name,
            type: "dose_reminder_snooze",
          },
          smallIcon: "ic_stat_pill",
          iconColor: "#F59E0B",
          sound: "default",
          autoCancel: true,
        }]
      });

      console.log(`✓ Snoozed notification for ${minutes} minutes`);
    } catch (error) {
      console.error("Error scheduling snooze notification:", error);
    }
  };

  const savePushToken = async (token: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("[PushToken] No user found, will retry on auth change");
        return;
      }

      console.log(`[PushToken] Saving token for user ${user.id}...`);

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            push_token: token,
            push_enabled: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error("[PushToken] Error saving:", error);
        
        // Retry on failure
        if (retryCount < MAX_RETRIES) {
          console.log(`[PushToken] Retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          setTimeout(() => savePushToken(token, retryCount + 1), RETRY_DELAY);
        }
        return;
      }

      console.log("[PushToken] ✓ Token saved successfully");
      
      // Verify save
      const { data: verify } = await supabase
        .from("notification_preferences")
        .select("push_token")
        .eq("user_id", user.id)
        .single();
      
      if (verify?.push_token === token) {
        console.log("[PushToken] ✓ Verified in database");
      } else {
        console.warn("[PushToken] Token mismatch after save, retrying...");
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => savePushToken(token, retryCount + 1), RETRY_DELAY);
        }
      }
    } catch (error) {
      console.error("[PushToken] Exception:", error);
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => savePushToken(token, retryCount + 1), RETRY_DELAY);
      }
    }
  };

  const checkPermissions = async (): Promise<boolean> => {
    // On web, check browser Notification API
    if (!isNativePlatform) {
      if (!('Notification' in window)) {
        return false;
      }
      return Notification.permission === 'granted';
    }
    
    // On native, use Capacitor
    try {
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive === "granted";
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  };

  const scheduleDailySummary = async () => {
    try {
      // Schedule daily summary at 8 PM
      const today = new Date();
      const summaryTime = new Date(today);
      summaryTime.setHours(20, 0, 0, 0);
      
      // If time passed, schedule for tomorrow
      if (summaryTime < today) {
        summaryTime.setDate(summaryTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: 999999,
          title: "📊 Resumo do Dia",
          body: "Veja seu progresso e doses pendentes",
          largeBody: "Confira como foi seu dia com os medicamentos e veja se há doses pendentes.",
          summaryText: "HoraMed",
          schedule: { at: summaryTime, repeats: true, every: "day" as any },
          channelId: CHANNEL_ID,
          actionTypeId: "DAILY_SUMMARY",
          extra: { type: "daily_summary" },
          smallIcon: "ic_stat_chart",
          iconColor: "#6366F1",
          sound: "default",
          autoCancel: true,
        }]
      });

      console.log("✓ Daily summary scheduled for 8 PM");
    } catch (error) {
      console.error("Error scheduling daily summary:", error);
    }
  };

  const updateQuietHours = (newQuietHours: QuietHours) => {
    setQuietHours(newQuietHours);
    localStorage.setItem('quiet_hours', JSON.stringify(newQuietHours));
    // Reschedule notifications
    scheduleNext48Hours();
  };

  return {
    checkPermissions,
    scheduleNext48Hours,
    scheduleDailySummary,
    quietHours,
    updateQuietHours,
    syncOfflineActions,
    requestNotificationPermission,
  };
};
