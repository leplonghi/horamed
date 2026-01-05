/**
 * Hook de alarme nativo Android para HoraMed
 * 
 * Garante alarmes confiáveis mesmo com:
 * - App fechado
 * - Modo avião
 * - Economia de bateria
 * - Tela bloqueada
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Notification channel ID - CRITICAL for Android alarm behavior
export const ALARM_CHANNEL_ID = "horamed_alarm";
export const ALARM_CHANNEL_NAME = "Alarmes de Medicamentos";

interface AlarmConfig {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  doseId: string;
  itemId: string;
  sound?: string;
  extra?: Record<string, any>;
}

interface AlarmLog {
  type: "scheduled" | "triggered" | "failed" | "push_received" | "permission_granted" | "permission_denied";
  alarmId?: string;
  doseId?: string;
  timestamp: Date;
  details?: string;
  success: boolean;
}

interface AlarmDiagnostics {
  lastAlarmTriggered: boolean | null;
  lastAlarmTime: Date | null;
  permissionStatus: "granted" | "denied" | "unknown";
  batteryOptimizationExempt: boolean | null;
  totalScheduled: number;
  totalTriggered: number;
  totalFailed: number;
}

export const useAndroidAlarm = () => {
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === "android";
  const [diagnostics, setDiagnostics] = useState<AlarmDiagnostics>({
    lastAlarmTriggered: null,
    lastAlarmTime: null,
    permissionStatus: "unknown",
    batteryOptimizationExempt: null,
    totalScheduled: 0,
    totalTriggered: 0,
    totalFailed: 0,
  });
  const logsRef = useRef<AlarmLog[]>([]);
  const scheduledAlarmsRef = useRef<Set<string>>(new Set());

  /**
   * Log to Supabase notification_logs
   */
  const logToSupabase = useCallback(async (log: AlarmLog) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("notification_logs").insert({
        user_id: user.id,
        dose_id: log.doseId || null,
        notification_type: "local_alarm",
        title: log.type,
        body: log.details || "",
        scheduled_at: log.timestamp.toISOString(),
        delivery_status: log.success ? "delivered" : "failed",
        metadata: {
          alarmId: log.alarmId,
          platform: "android",
        },
      });
    } catch (error) {
      console.error("[AndroidAlarm] Error logging to Supabase:", error);
    }
  }, []);

  /**
   * Log alarm event for diagnostics
   */
  const logAlarmEvent = useCallback((log: AlarmLog) => {
    logsRef.current.push(log);
    
    // Keep only last 100 logs
    if (logsRef.current.length > 100) {
      logsRef.current = logsRef.current.slice(-100);
    }

    // Persist to localStorage
    try {
      localStorage.setItem("alarm_logs", JSON.stringify(logsRef.current));
    } catch (e) {
      // Ignore quota errors
    }

    // Also log to Supabase for analytics
    logToSupabase(log).catch(console.error);
  }, [logToSupabase]);

  /**
   * Initialize notification channel for Android
   * CRITICAL: Uses HIGH importance for alarm behavior
   */
  const initializeNotificationChannel = useCallback(async () => {
    if (!isNative || !isAndroid) return;

    try {
      // Create dedicated alarm channel with HIGH importance
      await LocalNotifications.createChannel({
        id: ALARM_CHANNEL_ID,
        name: ALARM_CHANNEL_NAME,
        description: "Alarmes importantes para lembrar de tomar medicamentos",
        importance: 5, // IMPORTANCE_HIGH - heads-up notification
        visibility: 1, // PUBLIC
        sound: "notification.wav",
        vibration: true,
        lights: true,
        lightColor: "#10B981",
      });

      console.log("[AndroidAlarm] ✓ Notification channel created:", ALARM_CHANNEL_ID);
      
      // Also create a critical channel for urgent alarms
      await LocalNotifications.createChannel({
        id: "horamed_critical",
        name: "Alertas Críticos",
        description: "Alertas críticos que não podem ser perdidos",
        importance: 5,
        visibility: 1,
        sound: "alarm.wav",
        vibration: true,
        lights: true,
        lightColor: "#EF4444",
      });

      console.log("[AndroidAlarm] ✓ Critical channel created");
    } catch (error) {
      console.error("[AndroidAlarm] Error creating notification channel:", error);
      logAlarmEvent({
        type: "failed",
        timestamp: new Date(),
        details: `Failed to create channel: ${error}`,
        success: false,
      });
    }
  }, [isNative, isAndroid, logAlarmEvent]);

  /**
   * Check and request all necessary permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      // Request local notification permissions
      const localResult = await LocalNotifications.requestPermissions();
      console.log("[AndroidAlarm] Local permissions:", localResult);

      // Request push notification permissions
      let pushGranted = false;
      try {
        const pushResult = await PushNotifications.requestPermissions();
        pushGranted = pushResult.receive === "granted";
        
        if (pushGranted) {
          await PushNotifications.register();
        }
      } catch (e) {
        console.log("[AndroidAlarm] Push notifications not available:", e);
      }

      const allGranted = localResult.display === "granted";
      
      setDiagnostics(prev => ({
        ...prev,
        permissionStatus: allGranted ? "granted" : "denied",
      }));

      logAlarmEvent({
        type: allGranted ? "permission_granted" : "permission_denied",
        timestamp: new Date(),
        success: allGranted,
        details: `Local: ${localResult.display}, Push: ${pushGranted}`,
      });

      if (allGranted) {
        await initializeNotificationChannel();
      }

      return allGranted;
    } catch (error) {
      console.error("[AndroidAlarm] Error requesting permissions:", error);
      setDiagnostics(prev => ({
        ...prev,
        permissionStatus: "denied",
      }));
      return false;
    }
  }, [isNative, initializeNotificationChannel, logAlarmEvent]);

  /**
   * Schedule a local alarm notification
   * Uses exact timing and high-priority channel
   */
  const scheduleAlarm = useCallback(async (config: AlarmConfig): Promise<boolean> => {
    if (!isNative) {
      console.log("[AndroidAlarm] Not on native platform, skipping");
      return false;
    }

    const alarmKey = `${config.doseId}-${config.scheduledAt.getTime()}`;
    
    // Prevent duplicate scheduling
    if (scheduledAlarmsRef.current.has(alarmKey)) {
      console.log("[AndroidAlarm] Alarm already scheduled:", alarmKey);
      return true;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: config.id,
            title: config.title,
            body: config.body,
            schedule: {
              at: config.scheduledAt,
              allowWhileIdle: true, // CRITICAL: Works in Doze mode
            },
            channelId: ALARM_CHANNEL_ID,
            smallIcon: "ic_stat_icon",
            largeIcon: "ic_launcher",
            sound: config.sound || "notification.wav",
            actionTypeId: "MEDICATION_ALARM",
            extra: {
              doseId: config.doseId,
              itemId: config.itemId,
              scheduledAt: config.scheduledAt.toISOString(),
              ...config.extra,
            },
            autoCancel: false,
          },
        ],
      });
      
      scheduledAlarmsRef.current.add(alarmKey);
      
      setDiagnostics(prev => ({
        ...prev,
        totalScheduled: prev.totalScheduled + 1,
      }));

      logAlarmEvent({
        type: "scheduled",
        alarmId: String(config.id),
        doseId: config.doseId,
        timestamp: new Date(),
        success: true,
        details: `Scheduled for ${config.scheduledAt.toISOString()}`,
      });

      console.log("[AndroidAlarm] ✓ Alarm scheduled:", {
        id: config.id,
        title: config.title,
        scheduledAt: config.scheduledAt,
      });

      return true;
    } catch (error) {
      console.error("[AndroidAlarm] Error scheduling alarm:", error);
      
      setDiagnostics(prev => ({
        ...prev,
        totalFailed: prev.totalFailed + 1,
      }));

      logAlarmEvent({
        type: "failed",
        alarmId: String(config.id),
        doseId: config.doseId,
        timestamp: new Date(),
        success: false,
        details: `Error: ${error}`,
      });

      return false;
    }
  }, [isNative, logAlarmEvent]);

  /**
   * Schedule alarms for all pending doses
   */
  const scheduleAllPendingDoses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: doses, error } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items (
            name,
            dose_text
          )
        `)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .lte("due_at", next24h.toISOString())
        .order("due_at");

      if (error) {
        console.error("[AndroidAlarm] Error fetching doses:", error);
        return;
      }

      if (doses && doses.length > 0) {
        console.log(`[AndroidAlarm] Scheduling ${doses.length} doses`);

        for (const dose of doses) {
          const item = dose.items as { name: string; dose_text: string | null };
          const dueAt = new Date(dose.due_at);
          
          // Generate unique ID from dose ID
          const notificationId = parseInt(dose.id.replace(/\D/g, "").slice(0, 8)) || 
            Math.floor(Math.random() * 100000);

          await scheduleAlarm({
            id: notificationId,
            title: "⏰ Hora do remédio!",
            body: `${item.name}${item.dose_text ? ` - ${item.dose_text}` : ""}`,
            scheduledAt: dueAt,
            doseId: dose.id,
            itemId: dose.item_id,
          });
        }
      }
    } catch (error) {
      console.error("[AndroidAlarm] Error scheduling all doses:", error);
    }
  }, [scheduleAlarm]);

  /**
   * Cancel a scheduled alarm
   */
  const cancelAlarm = useCallback(async (notificationId: number) => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      console.log("[AndroidAlarm] Alarm cancelled:", notificationId);
    } catch (error) {
      console.error("[AndroidAlarm] Error cancelling alarm:", error);
    }
  }, [isNative]);

  /**
   * Cancel all scheduled alarms
   */
  const cancelAllAlarms = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        console.log("[AndroidAlarm] Cancelled all alarms:", pending.notifications.length);
      }
      scheduledAlarmsRef.current.clear();
    } catch (error) {
      console.error("[AndroidAlarm] Error cancelling all alarms:", error);
    }
  }, [isNative]);

  /**
   * Get alarm logs for diagnostics
   */
  const getAlarmLogs = useCallback((): AlarmLog[] => {
    return [...logsRef.current];
  }, []);

  /**
   * Get diagnostics status
   */
  const getDiagnostics = useCallback((): AlarmDiagnostics => {
    return { ...diagnostics };
  }, [diagnostics]);

  /**
   * Send test alarm (for testing purposes)
   */
  const sendTestAlarm = useCallback(async (delaySeconds: number = 10): Promise<boolean> => {
    const testTime = new Date(Date.now() + delaySeconds * 1000);
    const testId = Math.floor(Math.random() * 100000);

    console.log(`[AndroidAlarm] Scheduling test alarm for ${testTime.toISOString()}`);

    const success = await scheduleAlarm({
      id: testId,
      title: "🧪 Teste de Alarme",
      body: "Se você recebeu isso, o alarme está funcionando!",
      scheduledAt: testTime,
      doseId: `test-${testId}`,
      itemId: `test-item-${testId}`,
    });

    if (success) {
      toast.info(`Alarme de teste agendado para ${delaySeconds} segundos`, {
        description: "Feche o app e aguarde...",
      });
    }

    return success;
  }, [scheduleAlarm]);

  /**
   * Check battery optimization status (Android specific)
   */
  const checkBatteryOptimization = useCallback(async (): Promise<boolean | null> => {
    if (!isAndroid) return null;
    // This would require a custom Capacitor plugin to check
    // For now, we'll assume it's not exempt and show the warning
    return false;
  }, [isAndroid]);

  // Initialize on mount
  useEffect(() => {
    if (!isNative || !isAndroid) return;

    // Load saved logs
    try {
      const savedLogs = localStorage.getItem("alarm_logs");
      if (savedLogs) {
        logsRef.current = JSON.parse(savedLogs);
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Initialize channel and check permissions
    const init = async () => {
      const permissions = await LocalNotifications.checkPermissions();
      setDiagnostics(prev => ({
        ...prev,
        permissionStatus: permissions.display === "granted" ? "granted" : "denied",
      }));

      if (permissions.display === "granted") {
        await initializeNotificationChannel();
      }
    };

    init();

    // Listen for notification events
    const setupListeners = async () => {
      await LocalNotifications.addListener("localNotificationReceived", (notification) => {
        console.log("[AndroidAlarm] Notification received:", notification);
        
        setDiagnostics(prev => ({
          ...prev,
          lastAlarmTriggered: true,
          lastAlarmTime: new Date(),
          totalTriggered: prev.totalTriggered + 1,
        }));

        logAlarmEvent({
          type: "triggered",
          alarmId: String(notification.id),
          doseId: notification.extra?.doseId,
          timestamp: new Date(),
          success: true,
          details: notification.title,
        });
      });

      await LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
        console.log("[AndroidAlarm] Action performed:", action);
        
        // Handle action button clicks
        const doseId = action.notification.extra?.doseId;
        if (doseId) {
          // Dispatch event for other components to handle
          window.dispatchEvent(new CustomEvent("alarm-action", {
            detail: {
              doseId,
              actionId: action.actionId,
            },
          }));
        }
      });
    };

    setupListeners();

    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, [isNative, isAndroid, initializeNotificationChannel, logAlarmEvent]);

  return {
    // State
    isAndroid,
    isNative,
    diagnostics,
    
    // Actions
    requestPermissions,
    scheduleAlarm,
    scheduleAllPendingDoses,
    cancelAlarm,
    cancelAllAlarms,
    sendTestAlarm,
    checkBatteryOptimization,
    
    // Diagnostics
    getAlarmLogs,
    getDiagnostics,
  };
};

export default useAndroidAlarm;
