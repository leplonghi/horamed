import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, ArrowLeft, AlertTriangle, Smartphone, Battery } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { trackNotificationEvent, NotificationEvents } from "@/hooks/useNotificationMetrics";
import { useAndroidAlarm, ALARM_CHANNEL_ID } from "@/hooks/useAndroidAlarm";

interface Props {
  onGranted: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function OnboardingPermissions({ onGranted, onSkip, onBack }: Props) {
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === "android";

  const { requestPermissions: requestAndroidPermissions, scheduleAllPendingDoses } = useAndroidAlarm();

  const requestPermission = async () => {
    setRequesting(true);
    
    try {
      await trackNotificationEvent(NotificationEvents.PERMISSION_REQUESTED);

      if (isNative) {
        if (isAndroid) {
          // Use Android-specific alarm hook
          const granted = await requestAndroidPermissions();
          
          if (granted) {
            await trackNotificationEvent(NotificationEvents.PERMISSION_GRANTED);
            
            // Schedule all pending doses
            await scheduleAllPendingDoses();
            
            toast.success("Notificações e alarmes ativados!");
            onGranted();
          } else {
            setDenied(true);
            await trackNotificationEvent(NotificationEvents.PERMISSION_DENIED);
          }
        } else {
          // iOS - standard permission flow
          const localResult = await LocalNotifications.requestPermissions();
          
          let pushGranted = false;
          try {
            const pushResult = await PushNotifications.requestPermissions();
            pushGranted = pushResult.receive === "granted";
            if (pushGranted) {
              await PushNotifications.register();
            }
          } catch (e) {
            console.log("Push notifications not available:", e);
          }

          if (localResult.display === "granted" || pushGranted) {
            await trackNotificationEvent(NotificationEvents.PERMISSION_GRANTED);
            toast.success("Notificações ativadas!");
            onGranted();
          } else {
            setDenied(true);
            await trackNotificationEvent(NotificationEvents.PERMISSION_DENIED);
          }
        }
      } else {
        // Web notification permission
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          
          if (permission === "granted") {
            await trackNotificationEvent(NotificationEvents.PERMISSION_GRANTED);
            toast.success("Notificações ativadas!");
            onGranted();
          } else {
            setDenied(true);
            await trackNotificationEvent(NotificationEvents.PERMISSION_DENIED);
          }
        } else {
          // Notifications not supported
          onGranted();
        }
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      setDenied(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Bell className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Permita notificações
        </h1>
        <p className="text-muted-foreground">
          Precisamos dessas permissões para tocar o alarme no horário certo, mesmo com o app fechado.
        </p>
      </motion.div>

      {/* Android-specific warning */}
      {isAndroid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Celulares Android
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Alguns celulares limitam notificações em segundo plano. Se necessário, vamos te ajudar a ajustar isso.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Battery className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Economia de Bateria
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Após permitir, você pode precisar remover restrições de bateria para o HoraMed funcionar perfeitamente.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Denied state */}
      {denied && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20"
        >
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Notificações não permitidas
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Você pode permitir depois nas configurações do seu celular. Sem elas, você terá que lembrar sozinho.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 pt-4"
      >
        <Button
          size="lg"
          onClick={requestPermission}
          disabled={requesting}
          className="w-full h-14 text-lg font-semibold"
        >
          <Bell className="w-5 h-5 mr-2" />
          {requesting ? "Solicitando..." : "Permitir notificações"}
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button 
            variant="ghost" 
            onClick={onSkip}
            className="flex-1 text-muted-foreground"
          >
            <BellOff className="w-4 h-4 mr-2" />
            Decidir depois
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
