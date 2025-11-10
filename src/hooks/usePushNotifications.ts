import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const usePushNotifications = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === "granted") {
        // Register with APNs / FCM
        await PushNotifications.register();
        
        toast.success("Notificações push ativadas! Você receberá lembretes mesmo com o app fechado.");
      } else {
        toast.error("Permissão de notificações negada. Ative nas configurações do dispositivo.");
      }

      // Handle registration success
      await PushNotifications.addListener("registration", (token) => {
        console.log("Push registration success, token: " + token.value);
        // Save token to Supabase for future use
        savePushToken(token.value);
      });

      // Handle registration errors
      await PushNotifications.addListener("registrationError", (error) => {
        console.error("Push registration error: ", error);
        toast.error("Erro ao registrar notificações push");
      });

      // Handle push notifications received
      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("Push received: ", notification);
          toast.info(notification.title || "Notificação", {
            description: notification.body,
          });
        }
      );

      // Handle notification action (when user taps notification)
      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        async (action) => {
          console.log("Push action performed: ", action);
          
          const actionId = action.actionId;
          const doseId = action.notification.data?.doseId;

          if (actionId === 'taken' && doseId) {
            // Mark dose as taken directly from notification
            try {
              const { data, error } = await supabase.functions.invoke('handle-dose-action', {
                body: { doseId, action: 'taken' }
              });

              if (error) throw error;

              toast.success(data.message || '✅ Dose marcada!', {
                description: data.streak > 3 ? `🔥 ${data.streak} dias seguidos!` : undefined
              });
            } catch (error) {
              console.error('Error marking dose as taken:', error);
              toast.error('Erro ao marcar dose');
            }
          } else if (actionId === 'snooze' && doseId) {
            // Snooze dose
            try {
              const { data, error } = await supabase.functions.invoke('handle-dose-action', {
                body: { doseId, action: 'snooze' }
              });

              if (error) throw error;

              toast.info(data.message || '⏰ Lembrete adiado');
            } catch (error) {
              console.error('Error snoozing dose:', error);
              toast.error('Erro ao adiar lembrete');
            }
          } else {
            // Default action - navigate to today
            navigate("/hoje");
          }
        }
      );
    } catch (error) {
      console.error("Error initializing push notifications:", error);
    }
  };

  const savePushToken = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store token in user metadata or a separate table
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          push_token: token,
          push_enabled: true,
        });

      if (error) {
        console.error("Error saving push token:", error);
      }
    } catch (error) {
      console.error("Error in savePushToken:", error);
    }
  };

  const checkPermissions = async () => {
    const permStatus = await PushNotifications.checkPermissions();
    return permStatus.receive === "granted";
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    scheduleAt: Date,
    id?: number
  ) => {
    try {
      // For local notifications, you would use the Local Notifications plugin
      // This is a placeholder for the concept
      console.log("Scheduling notification:", { title, body, scheduleAt, id });
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  };

  return {
    checkPermissions,
    scheduleLocalNotification,
  };
};
