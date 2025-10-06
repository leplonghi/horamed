import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const useMedicationAlarm = () => {
  const notifiedDoses = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for alarm
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    // Using a data URI for a simple beep sound
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLTgjMGHm7A7+OZUQ0PVqzn7qxaFg1Lp+LyvmohBSx+zPLTgjIFHm3A7+GZUQ0PVqzn7qxaFg1";
  }, []);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast.success("Notificações ativadas! Você será alertado sobre seus remédios.");
        }
      });
    }
  }, []);

  // Check for upcoming doses every minute
  useEffect(() => {
    const checkUpcomingDoses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);

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
          .lte("due_at", fifteenMinutesLater.toISOString())
          .order("due_at");

        if (doses && doses.length > 0) {
          doses.forEach((dose: DoseInstance) => {
            const doseKey = `${dose.id}-${dose.due_at}`;
            
            // Only notify if we haven't notified about this dose yet
            if (!notifiedDoses.current.has(doseKey)) {
              const dueTime = new Date(dose.due_at);
              const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / 60000);
              
              // Trigger alarm for doses within 5 minutes
              if (minutesUntil <= 5 && minutesUntil >= 0) {
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
  }, []);

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing alarm:", error);
      });

      // Stop alarm after 30 seconds
      setTimeout(() => {
        stopAlarm();
      }, 30000);
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const showNotification = (dose: DoseInstance, minutesUntil: number) => {
    const title = minutesUntil === 0 
      ? "⏰ Hora do remédio!" 
      : `⏰ Remédio em ${minutesUntil} minutos`;
    
    const body = `${dose.items.name}${dose.items.dose_text ? ` - ${dose.items.dose_text}` : ""}`;

    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: dose.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        stopAlarm();
      };
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

  return { stopAlarm };
};
