import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const usePushNotifications = () => {
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
        (notification) => {
          console.log("Push action performed: ", notification);
          // Navigate to Today page or open the app
          window.location.href = "/hoje";
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
