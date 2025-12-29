import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Check, Loader2, AlertCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "testing" | "success";

export default function OnboardingStepNotifications({ onComplete, onSkip }: Props) {
  const { t, language } = useLanguage();
  const [state, setState] = useState<PermissionState>("idle");
  const [testReceived, setTestReceived] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const requestPermission = async () => {
    setState("requesting");
    
    try {
      if (isNative) {
        // Request push notification permission
        const pushResult = await PushNotifications.requestPermissions();
        
        if (pushResult.receive === "granted") {
          await PushNotifications.register();
          
          // Also request local notifications
          const localResult = await LocalNotifications.requestPermissions();
          
          if (localResult.display === "granted") {
            setState("granted");
            // Save preference to database
            await saveNotificationPreference(true);
          } else {
            setState("denied");
          }
        } else {
          setState("denied");
        }
      } else {
        // Web notification
        if (!("Notification" in window)) {
          toast.error(language === 'pt' ? "Seu navegador não suporta notificações" : "Your browser doesn't support notifications");
          setState("denied");
          return;
        }
        
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          setState("granted");
          await saveNotificationPreference(true);
        } else {
          setState("denied");
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setState("denied");
    }
  };

  const saveNotificationPreference = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert notification preferences
      await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          push_enabled: enabled,
          email_enabled: true,
        }, { onConflict: "user_id" });
    } catch (error) {
      console.error("Error saving notification preference:", error);
    }
  };

  const sendTestNotification = async () => {
    setState("testing");
    
    try {
      if (isNative) {
        // Send local notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 99999,
              title: language === 'pt' ? "🎉 Notificações funcionando!" : "🎉 Notifications working!",
              body: language === 'pt' ? "Você receberá lembretes assim para seus medicamentos" : "You'll receive reminders like this for your medications",
              schedule: { at: new Date(Date.now() + 1000) },
              sound: "notification.wav",
              extra: { type: "test" },
            },
          ],
        });
        
        // Wait a bit and show success
        setTimeout(() => {
          setTestReceived(true);
          setState("success");
        }, 2000);
      } else {
        // Web notification
        new Notification(language === 'pt' ? "🎉 Notificações funcionando!" : "🎉 Notifications working!", {
          body: language === 'pt' ? "Você receberá lembretes assim para seus medicamentos" : "You'll receive reminders like this for your medications",
          icon: "/favicon.png",
        });
        
        setTimeout(() => {
          setTestReceived(true);
          setState("success");
        }, 1500);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error(language === 'pt' ? "Erro ao enviar notificação de teste" : "Error sending test notification");
      setState("granted");
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className={`p-6 rounded-full ${state === "success" ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"}`}>
            {state === "success" ? (
              <Check className="h-16 w-16 text-green-600 dark:text-green-400" />
            ) : (
              <Bell className="h-16 w-16 text-primary" />
            )}
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {state === "success" 
            ? (language === 'pt' ? "Perfeito! Tudo pronto" : "Perfect! All set")
            : (language === 'pt' ? "Nunca esqueça um remédio" : "Never forget a medication")
          }
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {state === "success" 
            ? (language === 'pt' ? "Você receberá lembretes no horário certo para cada medicamento" : "You'll receive reminders at the right time for each medication")
            : (language === 'pt' ? "Ative as notificações para receber lembretes nos horários dos seus medicamentos" : "Enable notifications to receive reminders at your medication times")
          }
        </motion.p>
      </div>

      <motion.div
        className="max-w-md mx-auto space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Main action card */}
        <Card className="p-6 space-y-6">
          {state === "idle" && (
            <>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'pt' ? "Lembretes inteligentes" : "Smart reminders"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' 
                      ? "Receba alertas personalizados para cada dose" 
                      : "Get personalized alerts for each dose"}
                  </p>
                </div>
              </div>
              
              <Button
                size="lg"
                className="w-full"
                onClick={requestPermission}
              >
                <Bell className="h-4 w-4 mr-2" />
                {language === 'pt' ? "Ativar notificações" : "Enable notifications"}
              </Button>
            </>
          )}

          {state === "requesting" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-muted-foreground">
                {language === 'pt' ? "Solicitando permissão..." : "Requesting permission..."}
              </p>
            </div>
          )}

          {state === "granted" && (
            <>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    {language === 'pt' ? "Permissão concedida!" : "Permission granted!"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' 
                      ? "Vamos fazer um teste rápido" 
                      : "Let's do a quick test"}
                  </p>
                </div>
              </div>
              
              <Button
                size="lg"
                className="w-full"
                onClick={sendTestNotification}
              >
                <Bell className="h-4 w-4 mr-2" />
                {language === 'pt' ? "Testar notificação" : "Test notification"}
              </Button>
            </>
          )}

          {state === "testing" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-muted-foreground">
                {language === 'pt' ? "Enviando notificação de teste..." : "Sending test notification..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'pt' ? "Verifique sua tela de bloqueio" : "Check your lock screen"}
              </p>
            </div>
          )}

          {state === "success" && (
            <>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    {language === 'pt' ? "Notificação recebida!" : "Notification received!"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' 
                      ? "Tudo funcionando perfeitamente" 
                      : "Everything working perfectly"}
                  </p>
                </div>
              </div>
              
              <Button
                size="lg"
                className="w-full"
                onClick={onComplete}
              >
                {language === 'pt' ? "Continuar" : "Continue"}
              </Button>
            </>
          )}

          {state === "denied" && (
            <>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                    {language === 'pt' ? "Permissão negada" : "Permission denied"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' 
                      ? "Você pode ativar depois nas configurações" 
                      : "You can enable this later in settings"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={requestPermission}
                >
                  {language === 'pt' ? "Tentar novamente" : "Try again"}
                </Button>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={onComplete}
                >
                  {language === 'pt' ? "Continuar sem notificações" : "Continue without notifications"}
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Benefits list */}
        {(state === "idle" || state === "denied") && (
          <div className="space-y-3 px-2">
            <p className="text-sm font-medium text-muted-foreground">
              {language === 'pt' ? "Com notificações você recebe:" : "With notifications you get:"}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {language === 'pt' ? "Lembrete 15 min antes da dose" : "Reminder 15 min before dose"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {language === 'pt' ? "Alerta na hora exata" : "Alert at the exact time"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {language === 'pt' ? "Aviso de estoque baixo" : "Low stock warning"}
              </li>
            </ul>
          </div>
        )}
      </motion.div>

      {/* Skip option */}
      {state !== "success" && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button variant="ghost" onClick={onSkip}>
            {language === 'pt' ? "Configurar depois" : "Set up later"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
