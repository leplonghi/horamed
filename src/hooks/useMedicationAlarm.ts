import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { useResilientReminders } from "./useResilientReminders";

interface DoseInstance {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  items: {
    name: string;
    dose_text: string | null;
  };
}

interface AlarmSettings {
  enabled: boolean;
  sound: string;
  duration: number;
  alertMinutes: number;
}

const ALARM_SOUNDS = [
  { id: "beep", name: "Beep Simples", url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLTgjMGHm7A7+OZUQ0PVqzn7qxaFg1Lp+LyvmohBSx+zPLTgjIFHm3A7+GZUQ0PVqzn7qxaFg1" },
  { id: "bell", name: "Sino", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
  { id: "chime", name: "Chime Suave", url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
  { id: "alert", name: "Alerta Forte", url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3" },
];

export const useMedicationAlarm = () => {
  const notifiedDoses = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { scheduleReminder, getNotificationStats } = useResilientReminders();
  const [settings, setSettings] = useState<AlarmSettings>({
    enabled: true,
    sound: "beep",
    duration: 30,
    alertMinutes: 5,
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("alarmSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Initialize audio for alarm
  useEffect(() => {
    const sound = ALARM_SOUNDS.find(s => s.id === settings.sound);
    if (sound) {
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = true;
    }
  }, [settings.sound]);

  // Request notification permission
  useEffect(() => {
    const requestPermissions = async () => {
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        try {
          const permResult = await LocalNotifications.requestPermissions();
          if (permResult.display === "granted") {
            toast.success("Notificações nativas ativadas! Você será alertado sobre seus remédios.");
          }
        } catch (error) {
          console.error("Error requesting native notifications:", error);
        }
      } else {
        // Fallback to web notifications
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              toast.success("Notificações ativadas! Você será alertado sobre seus remédios.");
            }
          });
        }
      }
    };

    requestPermissions();
  }, []);

  // Check for upcoming doses every minute
  useEffect(() => {
    if (!settings.enabled) return;

    const checkUpcomingDoses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const alertWindow = new Date(now.getTime() + (settings.alertMinutes + 5) * 60000);

        const { data: doses } = await supabase
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
          .lte("due_at", alertWindow.toISOString())
          .order("due_at");

        if (doses && doses.length > 0) {
          doses.forEach((dose: DoseInstance) => {
            const doseKey = `${dose.id}-${dose.due_at}`;
            
            // Only notify if we haven't notified about this dose yet
            if (!notifiedDoses.current.has(doseKey)) {
              const dueTime = new Date(dose.due_at);
              const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / 60000);
              
              // Trigger alarm based on settings
              if (minutesUntil <= settings.alertMinutes && minutesUntil >= 0) {
                playAlarm();
                showNotification(dose, minutesUntil);
                notifiedDoses.current.add(doseKey);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error checking doses:", error);
      }
    };

    checkUpcomingDoses();
    const interval = setInterval(checkUpcomingDoses, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [settings]);

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing alarm:", error);
        toast.error("Erro ao tocar alarme. Toque na tela para ativar o áudio.");
      });

      // Stop alarm after configured duration
      setTimeout(() => {
        stopAlarm();
      }, settings.duration * 1000);
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const showNotification = async (dose: DoseInstance, minutesUntil: number) => {
    const title = minutesUntil === 0 
      ? "⏰ Hora do remédio!" 
      : `⏰ Remédio em ${minutesUntil} minutos`;
    
    const body = `${dose.items.name}${dose.items.dose_text ? ` - ${dose.items.dose_text}` : ""}`;

    // Use resilient reminder system with automatic fallback
    const success = await scheduleReminder({
      doseId: dose.id,
      itemId: dose.item_id,
      title,
      body,
      scheduledAt: new Date(Date.now() + 100), // Schedule immediately
    });

    if (!success) {
      console.error("Failed to schedule notification with fallback");
    }

    // Also show toast notification
    toast.info(title, {
      description: body,
      duration: 30000,
      action: {
        label: "Parar alarme",
        onClick: stopAlarm,
      },
    });
  };

  return { stopAlarm, getNotificationStats };
};
