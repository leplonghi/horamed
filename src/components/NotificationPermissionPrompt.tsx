import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";

interface NotificationPermissionPromptProps {
  onRequestPermission: () => Promise<boolean>;
}

export default function NotificationPermissionPrompt({ onRequestPermission }: NotificationPermissionPromptProps) {
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wasDenied, setWasDenied] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();
  
  useEffect(() => {
    const checkPermissions = async () => {
      // Check if user already dismissed
      const alreadyDismissed = localStorage.getItem('notification_prompt_dismissed');
      if (alreadyDismissed) {
        setDismissed(true);
        return;
      }
      
      if (isNative) {
        // Check native permissions - ALWAYS try to show prompt on mobile
        try {
          const pushStatus = await PushNotifications.checkPermissions();
          const localStatus = await LocalNotifications.checkPermissions();
          
          console.log("[NotificationPrompt] Native permissions - Push:", pushStatus.receive, "Local:", localStatus.display);
          
          // Show prompt if not granted
          if (pushStatus.receive !== 'granted' || localStatus.display !== 'granted') {
            // Show prompt immediately on native to ensure permission dialog appears
            console.log("[NotificationPrompt] Showing native permission prompt...");
            setShow(true);
            
            // If permission was denied before, show instructions
            if (pushStatus.receive === 'denied') {
              setWasDenied(true);
            }
          }
        } catch (error) {
          console.error("[NotificationPrompt] Error checking native permissions:", error);
          // Show prompt anyway on error - better to ask than miss
          setShow(true);
        }
      } else {
        // Web permissions
        if ('Notification' in window) {
          const permission = Notification.permission;
          if (permission === 'default') {
            // Never asked - show prompt after delay
            setTimeout(() => setShow(true), 3000);
          } else if (permission === 'denied') {
            // Was denied - show info about how to enable in settings
            setWasDenied(true);
            setTimeout(() => setShow(true), 3000);
          }
          // If 'granted', don't show anything
        }
      }
    };
    
    checkPermissions();
    
    // Listen for the event from usePushNotifications
    const handleNeedPermission = () => {
      if (!dismissed) {
        setShow(true);
      }
    };
    
    // Listen for denied event from native
    const handleNativeDenied = () => {
      setWasDenied(true);
      setShow(true);
    };
    
    window.addEventListener('notification-permission-needed', handleNeedPermission);
    window.addEventListener('native-notification-denied', handleNativeDenied);
    return () => {
      window.removeEventListener('notification-permission-needed', handleNeedPermission);
      window.removeEventListener('native-notification-denied', handleNativeDenied);
    };
  }, [isNative, dismissed]);
  
  const handleEnable = async () => {
    setLoading(true);
    
    try {
      if (isNative) {
        // Request native permissions
        const pushResult = await PushNotifications.requestPermissions();
        const localResult = await LocalNotifications.requestPermissions();
        
        if (pushResult.receive === 'granted' && localResult.display === 'granted') {
          await PushNotifications.register();
          toast.success(language === 'pt' ? "✓ Notificações ativadas!" : "✓ Notifications enabled!");
          setShow(false);
        } else {
          toast.error(language === 'pt' 
            ? "Permissão negada. Ative nas configurações do celular." 
            : "Permission denied. Enable in phone settings.");
        }
      } else {
        // Web permissions
        const granted = await onRequestPermission();
        if (granted) {
          setShow(false);
        }
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast.error(language === 'pt' ? "Erro ao ativar notificações" : "Error enabling notifications");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  };
  
  const handleLater = () => {
    setShow(false);
    // Will show again next session
  };
  
  if (!show || dismissed) return null;
  
  // If permission was denied, show different UI with instructions
  if (wasDenied) {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    
    return (
      <AnimatePresence>
        {show && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
          >
            <Card className="p-4 shadow-lg border-warning/30 bg-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-warning/10 shrink-0">
                  <Settings className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">
                      {language === 'pt' ? '🔔 Notificações bloqueadas' : '🔔 Notifications blocked'}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 -mt-1 -mr-2"
                      onClick={handleDismiss}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isNative ? (
                      language === 'pt' 
                        ? isAndroid
                          ? 'Para receber lembretes, vá em Configurações > Apps > HoraMed > Notificações e ative.' 
                          : isIOS
                            ? 'Para receber lembretes, vá em Ajustes > Notificações > HoraMed e ative.'
                            : 'Para receber lembretes, ative as notificações nas configurações do seu celular.'
                        : isAndroid
                          ? 'To receive reminders, go to Settings > Apps > HoraMed > Notifications and enable.'
                          : isIOS
                            ? 'To receive reminders, go to Settings > Notifications > HoraMed and enable.'
                            : 'To receive reminders, enable notifications in your phone settings.'
                    ) : (
                      language === 'pt' 
                        ? 'Para receber lembretes, ative as notificações nas configurações do navegador (clique no 🔒 na barra de endereço).' 
                        : 'To receive reminders, enable notifications in browser settings (click the 🔒 in the address bar).'
                    )}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={handleDismiss} className="flex-1">
                      {language === 'pt' ? 'Entendi' : 'Got it'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
  
  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <Card className="p-4 shadow-lg border-primary/20 bg-card">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 shrink-0 animate-pulse">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">
                    {language === 'pt' ? '🔔 Ativar lembretes?' : '🔔 Enable reminders?'}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 -mt-1 -mr-2"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'pt' 
                    ? 'Nunca esqueça de tomar seus medicamentos! Receba alertas nos horários certos.' 
                    : 'Never forget your medications! Get alerts at the right times.'}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleEnable} className="flex-1" disabled={loading}>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Bell className="h-3 w-3 mr-1" />
                        {language === 'pt' ? 'Ativar' : 'Enable'}
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleLater} disabled={loading}>
                    {language === 'pt' ? 'Depois' : 'Later'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}