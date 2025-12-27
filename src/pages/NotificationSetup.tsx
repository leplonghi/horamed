import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Bell, 
  BellRing, 
  Check, 
  ChevronRight, 
  Smartphone, 
  Settings, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

interface PermissionStatus {
  push: 'granted' | 'denied' | 'prompt' | 'unknown';
  local: 'granted' | 'denied' | 'prompt' | 'unknown';
  battery: 'unknown' | 'optimized' | 'unrestricted';
}

export default function NotificationSetup() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<PermissionStatus>({
    push: 'unknown',
    local: 'unknown',
    battery: 'unknown'
  });
  const [loading, setLoading] = useState(true);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setLoading(true);
    
    try {
      if (isNative) {
        const pushStatus = await PushNotifications.checkPermissions();
        const localStatus = await LocalNotifications.checkPermissions();
        
        setPermissions({
          push: pushStatus.receive as any,
          local: localStatus.display as any,
          battery: 'unknown'
        });
      } else {
        if ('Notification' in window) {
          setPermissions({
            push: Notification.permission as any,
            local: Notification.permission as any,
            battery: 'unknown'
          });
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      if (isNative) {
        const pushResult = await PushNotifications.requestPermissions();
        const localResult = await LocalNotifications.requestPermissions();
        
        if (pushResult.receive === 'granted' && localResult.display === 'granted') {
          await PushNotifications.register();
          toast.success(t('notifSetup.notifEnabled'));
          await checkPermissions();
        } else {
          toast.error(t('notifSetup.permissionDenied'));
        }
      } else {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          toast.success(t('notifSetup.notifEnabled'));
        }
        await checkPermissions();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast.error(t('notifSetup.permissionError'));
    }
  };

  const sendTestNotification = async () => {
    try {
      if (isNative) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 99999,
              title: '🔔 ' + t('notifSetup.testNotif'),
              body: t('notifSetup.testDesc'),
              schedule: { at: new Date(Date.now() + 3000) },
              channelId: 'horamed-medicamentos'
            }
          ]
        });
        toast.success(t('notifSetup.testScheduled'));
      } else {
        if (Notification.permission === 'granted') {
          new Notification('🔔 ' + t('notifSetup.testNotif'), {
            body: t('notifSetup.testDesc'),
            icon: '/favicon.png'
          });
          toast.success(t('notifSetup.testSentSuccess'));
        }
      }
      setTestSent(true);
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error(t('notifSetup.testError'));
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'granted') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (status === 'denied') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  const allPermissionsGranted = permissions.push === 'granted' && permissions.local === 'granted';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-blue-500/10 to-cyan-500/10 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('notifSetup.title')}</h1>
          </div>
          
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <BellRing className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">
              {t('notifSetup.neverMiss')}
            </h2>
            <p className="text-muted-foreground">
              {t('notifSetup.configureDesc')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">
        {/* Status Card */}
        <Card className={`p-4 ${allPermissionsGranted ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'}`}>
          <div className="flex items-center gap-3">
            {allPermissionsGranted ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">{t('notifSetup.active')}</h3>
                  <p className="text-sm text-green-600 dark:text-green-500">{t('notifSetup.activeDesc')}</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-amber-700 dark:text-amber-400">{t('notifSetup.configNeeded')}</h3>
                  <p className="text-sm text-amber-600 dark:text-amber-500">{t('notifSetup.configNeededDesc')}</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Step 1: Permission */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${permissions.local === 'granted' ? 'bg-green-100 dark:bg-green-900' : 'bg-primary/20'}`}>
              {permissions.local === 'granted' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <span className="font-bold text-primary">1</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{t('notifSetup.allowNotif')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('notifSetup.authorizeApp')}
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(permissions.local)}
                <span className="text-sm">
                  {permissions.local === 'granted' ? t('notifSetup.allowed') : 
                   permissions.local === 'denied' ? t('notifSetup.denied') : 
                   t('notifSetup.notConfigured')}
                </span>
              </div>

              {permissions.local !== 'granted' && (
                <Button onClick={requestPermissions} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  {t('notifSetup.allowBtn')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Step 2: Battery Optimization (Android only) */}
        {platform === 'android' && (
          <Card className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{t('notifSetup.disableBattery')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>{t('notifSetup.batteryImportant')}</strong> {t('notifSetup.batteryDesc')}
                </p>
                
                <Alert className="mb-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {t('notifSetup.batteryPath')}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium">{t('notifSetup.stepByStep')}</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>{t('notifSetup.step1')}</li>
                    <li>{t('notifSetup.step2')}</li>
                    <li>{t('notifSetup.step3')}</li>
                    <li>{t('notifSetup.step4')}</li>
                    <li>{t('notifSetup.step5')}</li>
                  </ol>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => {
                    toast.info(t('notifSetup.openSettingsInfo'));
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('notifSetup.openSettings')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3 (or 2 on iOS): Test */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${testSent ? 'bg-green-100 dark:bg-green-900' : 'bg-primary/20'}`}>
              {testSent ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <span className="font-bold text-primary">{platform === 'android' ? '3' : '2'}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{t('notifSetup.testNotif')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('notifSetup.testDesc')}
              </p>
              
              <Button 
                onClick={sendTestNotification} 
                variant={testSent ? "outline" : "default"}
                className="w-full"
                disabled={permissions.local !== 'granted'}
              >
                <BellRing className="h-4 w-4 mr-2" />
                {testSent ? t('notifSetup.sendAgain') : t('notifSetup.sendTest')}
              </Button>

              {testSent && (
                <p className="text-xs text-green-600 mt-2 text-center">
                  {t('notifSetup.testSent')}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Tips for iOS */}
        {platform === 'ios' && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t('notifSetup.iosTips')}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('notifSetup.iosTip1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('notifSetup.iosTip2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('notifSetup.iosTip3')}</span>
              </li>
            </ul>
          </Card>
        )}

        {/* Web instructions */}
        {!isNative && (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              {t('notifSetup.webInfo')}{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/install')}>
                {t('notifSetup.learnInstall')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Done button */}
        <Button 
          onClick={() => navigate('/configuracoes/notificacoes')} 
          className="w-full"
          size="lg"
        >
          {allPermissionsGranted ? t('notifSetup.advancedSettings') : t('notifSetup.continue')}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
