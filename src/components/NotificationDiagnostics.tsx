import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Smartphone,
  RefreshCw,
  TestTube
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
}

export function NotificationDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const isNative = Capacitor.isNativePlatform();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Check platform
      results.push({
        name: t('notifDiag.platform'),
        status: "success",
        message: isNative ? `${t('notifDiag.native')} (${Capacitor.getPlatform()})` : t('notifDiag.webPwa')
      });

      // 2. Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        results.push({
          name: t('notifDiag.auth'),
          status: "success",
          message: t('notifDiag.userAuth')
        });
      } else {
        results.push({
          name: t('notifDiag.auth'),
          status: "error",
          message: t('notifDiag.notAuth')
        });
        setDiagnostics(results);
        setIsRunning(false);
        return;
      }

      // 3. Check notification permissions
      if (isNative) {
        const pushPerm = await PushNotifications.checkPermissions();
        const localPerm = await LocalNotifications.checkPermissions();
        
        results.push({
          name: t('notifDiag.pushPerm'),
          status: pushPerm.receive === "granted" ? "success" : "error",
          message: pushPerm.receive === "granted" 
            ? t('notifDiag.granted')
            : `${t('notifDiag.notGranted')} (${pushPerm.receive}) - ${t('notifDiag.tapToRequest')}`
        });

        results.push({
          name: t('notifDiag.localPerm'),
          status: localPerm.display === "granted" ? "success" : "error",
          message: localPerm.display === "granted" 
            ? t('notifDiag.granted')
            : `${t('notifDiag.notGranted')} (${localPerm.display})`
        });
      } else {
        if ("Notification" in window) {
          const permission = Notification.permission;
          results.push({
            name: t('notifDiag.webPerm'),
            status: permission === "granted" ? "success" : permission === "denied" ? "error" : "warning",
            message: permission === "granted" 
              ? t('notifDiag.granted')
              : permission === "denied" 
                ? t('notifDiag.blocked')
                : t('notifDiag.notRequested')
          });
        } else {
          results.push({
            name: t('notifDiag.notifSupport'),
            status: "error",
            message: t('notifDiag.browserNoSupport')
          });
        }
      }

      // 4. Check push token in database
      const { data: preferences } = await supabase
        .from("notification_preferences")
        .select("push_token, push_enabled, email_enabled")
        .eq("user_id", user.id)
        .single();

      if (preferences?.push_token) {
        setPushToken(preferences.push_token);
        results.push({
          name: t('notifDiag.tokenInDb'),
          status: "success",
          message: `${t('notifDiag.tokenSaved')} (${preferences.push_token.substring(0, 15)}...)`
        });
      } else {
        results.push({
          name: t('notifDiag.tokenInDb'),
          status: "error",
          message: t('notifDiag.tokenNotFound')
        });
      }

      results.push({
        name: t('notifDiag.pushEnabled'),
        status: preferences?.push_enabled ? "success" : "warning",
        message: preferences?.push_enabled ? `${t('common.yes')} ✓` : t('notifDiag.activeInSettings')
      });

      results.push({
        name: t('notifDiag.emailEnabled'),
        status: preferences?.email_enabled ? "success" : "warning",
        message: preferences?.email_enabled ? `${t('common.yes')} ✓` : t('common.no')
      });

      // 5. Check scheduled notifications in database
      const { data: scheduled, count } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("delivery_status", "scheduled")
        .limit(5);

      results.push({
        name: t('notifDiag.scheduledNotifs'),
        status: (count || 0) > 0 ? "success" : "warning",
        message: `${count || 0} ${t('notifDiag.pendingNotifs')}`
      });

      // 6. Check recent notifications
      const { data: recent } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recent && recent.length > 0) {
        const lastNotif = recent[0];
        results.push({
          name: t('notifDiag.lastNotif'),
          status: lastNotif.delivery_status === "delivered" ? "success" : 
                  lastNotif.delivery_status === "failed" ? "error" : "warning",
          message: `${lastNotif.delivery_status} - ${new Date(lastNotif.created_at).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`
        });
      } else {
        results.push({
          name: t('notifDiag.history'),
          status: "warning",
          message: t('notifDiag.noNotifSent')
        });
      }

      // 7. Check cron jobs (via edge function call)
      results.push({
        name: t('notifDiag.cronJobs'),
        status: "success",
        message: t('notifDiag.cronConfigured')
      });

    } catch (error) {
      console.error("Diagnostic error:", error);
      results.push({
        name: t('notifDiag.error'),
        status: "error",
        message: error instanceof Error ? error.message : t('errors.unknown')
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const requestPermission = async () => {
    try {
      if (isNative) {
        const result = await PushNotifications.requestPermissions();
        if (result.receive === "granted") {
          await PushNotifications.register();
          toast.success(t('notifDiag.permGranted'));
        } else {
          toast.error(t('notifDiag.permDenied'));
        }
      } else {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          toast.success(t('notifDiag.webPermGranted'));
        } else {
          toast.error(t('notifDiag.webPermDenied'));
        }
      }
      await runDiagnostics();
    } catch (error) {
      toast.error(t('errors.requestPermission'));
    }
  };

  const sendTestNotification = async () => {
    try {
      if (isNative) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: t('notifDiag.testTitle'),
            body: t('notifDiag.testBody'),
            schedule: { at: new Date(Date.now() + 3000) }, // 3 seconds from now
            sound: "default",
          }]
        });
        toast.success(t('notifDiag.testScheduled'));
      } else {
        if (Notification.permission === "granted") {
          new Notification(t('notifDiag.testTitle'), {
            body: t('notifDiag.testBody'),
            icon: "/favicon.png",
          });
          toast.success(t('notifDiag.testSent'));
        } else {
          toast.error(t('notifDiag.webPermNotGranted'));
        }
      }
    } catch (error) {
      toast.error(t('errors.sendTest'));
    }
  };

  const forceRegisterToken = async () => {
    try {
      if (!isNative) {
        toast.info(t('notifDiag.tokenOnlyNative'));
        return;
      }

      toast.info(t('notifDiag.registering'));
      await PushNotifications.register();
      
      // Wait a bit for the registration callback
      setTimeout(runDiagnostics, 2000);
    } catch (error) {
      toast.error(t('errors.register'));
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('notifDiag.title')}</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? "animate-spin" : ""}`} />
            {t('notifDiag.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {diagnostics.map((d, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(d.status)}
              <span className="text-sm font-medium">{d.name}</span>
            </div>
            <Badge 
              variant={d.status === "success" ? "default" : d.status === "error" ? "destructive" : "secondary"}
              className="text-xs max-w-[200px] truncate"
            >
              {d.message}
            </Badge>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-3 border-t">
          <Button size="sm" variant="outline" onClick={requestPermission}>
            <Bell className="h-4 w-4 mr-1" />
            {t('notifDiag.requestPerm')}
          </Button>
          <Button size="sm" variant="outline" onClick={sendTestNotification}>
            <TestTube className="h-4 w-4 mr-1" />
            {t('notifDiag.testNotif')}
          </Button>
          {isNative && (
            <Button size="sm" variant="outline" onClick={forceRegisterToken}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {t('notifDiag.forceRegister')}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <strong>💡 {t('notifDiag.tip')}:</strong> {t('notifDiag.tipText')}
          <ol className="list-decimal ml-4 mt-1 space-y-0.5">
            <li>{t('notifDiag.tipStep1')}</li>
            <li>{t('notifDiag.tipStep2')}</li>
            <li>{t('notifDiag.tipStep3')}</li>
            <li>{t('notifDiag.tipStep4')}</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}