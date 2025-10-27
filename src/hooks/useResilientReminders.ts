import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { useAuditLog } from "./useAuditLog";

interface ReminderData {
  doseId: string;
  itemId: string;
  title: string;
  body: string;
  scheduledAt: Date;
}

interface NotificationMetric {
  user_id: string;
  dose_id: string;
  notification_type: "push" | "local" | "web" | "sound";
  delivery_status: "sent" | "delivered" | "failed" | "fallback";
  error_message?: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = "local_reminders_backup";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 60000; // 1 minute

export const useResilientReminders = () => {
  const { logAction } = useAuditLog();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize local storage sync
  useEffect(() => {
    syncLocalRemindersWithBackend();
    
    // Check for pending retries every minute
    const interval = setInterval(() => {
      retryFailedReminders();
    }, RETRY_DELAY);

    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Schedule a reminder with automatic fallback and metrics
   */
  const scheduleReminder = async (data: ReminderData): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    let primarySuccess = false;
    let fallbackUsed = false;
    const errors: string[] = [];

    // Try primary method: Native notifications
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: data.title,
              body: data.body,
              id: generateNotificationId(data.doseId),
              schedule: { at: data.scheduledAt },
              sound: undefined,
              actionTypeId: "MEDICATION_REMINDER",
              extra: {
                doseId: data.doseId,
                itemId: data.itemId,
              },
            },
          ],
        });
        
        primarySuccess = true;
        await logMetric({
          user_id: user.id,
          dose_id: data.doseId,
          notification_type: "local",
          delivery_status: "sent",
          metadata: { method: "native_capacitor" },
        });

        await logAction({
          action: "schedule_reminder",
          resource: "reminder",
          resource_id: data.doseId,
          metadata: { type: "native", title: data.title },
        });
      } catch (error) {
        errors.push(`Native: ${error instanceof Error ? error.message : "Unknown error"}`);
        await logMetric({
          user_id: user.id,
          dose_id: data.doseId,
          notification_type: "local",
          delivery_status: "failed",
          error_message: errors[0],
        });
      }
    }

    // Try secondary method: Web notifications
    if (!primarySuccess && "Notification" in window) {
      try {
        if (Notification.permission === "granted") {
          // Schedule using setTimeout for web
          const delay = data.scheduledAt.getTime() - Date.now();
          if (delay > 0) {
            setTimeout(() => {
              new Notification(data.title, {
                body: data.body,
                icon: "/favicon.ico",
                tag: data.doseId,
                requireInteraction: true,
              });
            }, delay);
            
            primarySuccess = true;
            await logMetric({
              user_id: user.id,
              dose_id: data.doseId,
              notification_type: "web",
              delivery_status: "sent",
              metadata: { method: "web_api" },
            });
          }
        }
      } catch (error) {
        errors.push(`Web: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Fallback: Save to local storage and database
    if (!primarySuccess) {
      fallbackUsed = true;
      await saveFallbackReminder(user.id, data);
      
      await logMetric({
        user_id: user.id,
        dose_id: data.doseId,
        notification_type: "local",
        delivery_status: "fallback",
        error_message: errors.join("; "),
        metadata: { fallback_reason: "primary_methods_failed" },
      });

      await logAction({
        action: "fallback_reminder",
        resource: "reminder",
        resource_id: data.doseId,
        metadata: { errors, fallback: true },
      });

      console.warn("Using fallback reminder storage:", errors);
    }

    return primarySuccess || fallbackUsed;
  };

  /**
   * Save reminder to fallback storage (localStorage + database)
   */
  const saveFallbackReminder = async (userId: string, data: ReminderData) => {
    // Save to localStorage
    const localBackup = localStorage.getItem(STORAGE_KEY);
    const reminders = localBackup ? JSON.parse(localBackup) : [];
    reminders.push({
      ...data,
      userId,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));

    // Save to database
    try {
      await supabase.from("local_reminders").insert({
        user_id: userId,
        dose_id: data.doseId,
        scheduled_at: data.scheduledAt.toISOString(),
        notification_data: {
          title: data.title,
          body: data.body,
          itemId: data.itemId,
        },
        status: "pending",
      });
    } catch (error) {
      console.error("Error saving fallback to database:", error);
    }
  };

  /**
   * Sync local storage reminders with backend
   */
  const syncLocalRemindersWithBackend = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dbReminders } = await supabase
        .from("local_reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .lte("scheduled_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()); // Next 24h

      if (dbReminders && dbReminders.length > 0) {
        console.log(`Syncing ${dbReminders.length} pending reminders from backend`);
        
        for (const reminder of dbReminders) {
          const data = reminder.notification_data as any;
          await scheduleReminder({
            doseId: reminder.dose_id,
            itemId: data.itemId,
            title: data.title,
            body: data.body,
            scheduledAt: new Date(reminder.scheduled_at),
          });

          // Mark as sent
          await supabase
            .from("local_reminders")
            .update({ status: "sent" })
            .eq("id", reminder.id);
        }
      }
    } catch (error) {
      console.error("Error syncing local reminders:", error);
    }
  };

  /**
   * Retry failed reminders
   */
  const retryFailedReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: failedReminders } = await supabase
        .from("local_reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "failed")
        .lt("retry_count", MAX_RETRY_ATTEMPTS)
        .gte("scheduled_at", new Date().toISOString()); // Only future reminders

      if (failedReminders && failedReminders.length > 0) {
        console.log(`Retrying ${failedReminders.length} failed reminders`);

        for (const reminder of failedReminders) {
          const data = reminder.notification_data as any;
          const success = await scheduleReminder({
            doseId: reminder.dose_id,
            itemId: data.itemId,
            title: data.title,
            body: data.body,
            scheduledAt: new Date(reminder.scheduled_at),
          });

          await supabase
            .from("local_reminders")
            .update({
              status: success ? "sent" : "failed",
              retry_count: reminder.retry_count + 1,
              last_retry_at: new Date().toISOString(),
            })
            .eq("id", reminder.id);
        }
      }
    } catch (error) {
      console.error("Error retrying failed reminders:", error);
    }
  };

  /**
   * Log notification metric
   */
  const logMetric = async (metric: NotificationMetric) => {
    try {
      await supabase.from("notification_metrics").insert(metric);
    } catch (error) {
      console.error("Error logging notification metric:", error);
    }
  };

  /**
   * Get notification statistics
   */
  const getNotificationStats = async (days: number = 7) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await supabase
        .from("notification_metrics")
        .select("notification_type, delivery_status")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString());

      if (!data) return null;

      const stats = {
        total: data.length,
        sent: data.filter(m => m.delivery_status === "sent").length,
        delivered: data.filter(m => m.delivery_status === "delivered").length,
        failed: data.filter(m => m.delivery_status === "failed").length,
        fallback: data.filter(m => m.delivery_status === "fallback").length,
        byType: {
          push: data.filter(m => m.notification_type === "push").length,
          local: data.filter(m => m.notification_type === "local").length,
          web: data.filter(m => m.notification_type === "web").length,
          sound: data.filter(m => m.notification_type === "sound").length,
        },
        successRate: data.length > 0 
          ? ((data.filter(m => m.delivery_status === "sent" || m.delivery_status === "delivered").length / data.length) * 100).toFixed(1)
          : "0",
      };

      return stats;
    } catch (error) {
      console.error("Error getting notification stats:", error);
      return null;
    }
  };

  /**
   * Generate consistent notification ID from dose ID
   */
  const generateNotificationId = (doseId: string): number => {
    return parseInt(doseId.replace(/\D/g, "").slice(0, 8)) || Math.floor(Math.random() * 100000);
  };

  /**
   * Clear old completed reminders
   */
  const cleanupOldReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep 7 days of history

      await supabase
        .from("local_reminders")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "sent")
        .lt("scheduled_at", cutoffDate.toISOString());

      await supabase
        .from("notification_metrics")
        .delete()
        .eq("user_id", user.id)
        .lt("created_at", cutoffDate.toISOString());
    } catch (error) {
      console.error("Error cleaning up old reminders:", error);
    }
  };

  return {
    scheduleReminder,
    getNotificationStats,
    cleanupOldReminders,
    retryFailedReminders,
  };
};
