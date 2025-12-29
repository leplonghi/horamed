import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Moon, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotificationSettings() {
  const { quietHours, updateQuietHours, checkPermissions } = usePushNotifications();
  const { isSubscribed, isSupported, isLoading: pushLoading, subscribe, unsubscribe } = usePushSubscription();
  const [isEnabled, setIsEnabled] = useState(false);
  const [localQuietHours, setLocalQuietHours] = useState(quietHours);
  const { t } = useLanguage();

  useEffect(() => {
    const checkNotificationPermission = async () => {
      const hookResult = await checkPermissions();
      
      if ('Notification' in window) {
        const webPermission = Notification.permission === 'granted';
        setIsEnabled(hookResult || webPermission);
      } else {
        setIsEnabled(hookResult);
      }
    };
    
    checkNotificationPermission();
  }, []);

  const handleQuietHoursToggle = () => {
    const updated = { ...localQuietHours, enabled: !localQuietHours.enabled };
    setLocalQuietHours(updated);
    updateQuietHours(updated);
    toast.success(updated.enabled ? t('notifSettings.quietEnabled') : t('notifSettings.quietDisabled'));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const updated = { ...localQuietHours, [field]: value };
    setLocalQuietHours(updated);
    updateQuietHours(updated);
  };

  const handleWebPushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success('Notificações push do servidor desativadas');
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Notificações push do servidor ativadas! Agora você receberá alertas mesmo com o app fechado.');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('notifSettings.title')}
        </CardTitle>
        <CardDescription>
          {t('notifSettings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t('notifSettings.activeNotifications')}</Label>
            <p className="text-sm text-muted-foreground">
              {isEnabled ? t('notifSettings.activeDesc') : t('notifSettings.inactiveDesc')}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isEnabled 
              ? "bg-green-500/20 text-green-700 dark:text-green-400" 
              : "bg-muted text-muted-foreground"
          }`}>
            {isEnabled ? t('notifSettings.enabled') : t('notifSettings.disabled')}
          </div>
        </div>

        {/* Web Push Server-Side */}
        {isSupported && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Notificações Persistentes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba alertas mesmo com o app completamente fechado
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pushLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleWebPushToggle}
                  disabled={pushLoading}
                />
              </div>
            </div>
            {isSubscribed && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                ✓ Seu dispositivo está registrado para receber notificações do servidor
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                {t('notifSettings.quietMode')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('notifSettings.quietModeDesc')}
              </p>
            </div>
            <Switch
              checked={localQuietHours.enabled}
              onCheckedChange={handleQuietHoursToggle}
            />
          </div>

          {localQuietHours.enabled && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-xs">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {t('notifSettings.start')}
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={localQuietHours.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-xs">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {t('notifSettings.end')}
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={localQuietHours.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <div className="space-y-2">
            <Label>{t('notifSettings.quickActions')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('notifSettings.quickActionsDesc')}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <strong>{t('notifSettings.takeAction')}</strong> {t('notifSettings.takeDesc')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <strong>{t('notifSettings.snoozeAction')}</strong> {t('notifSettings.snoozeDesc')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                <strong>{t('notifSettings.skipAction')}</strong> {t('notifSettings.skipDesc')}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
            <p className="mb-2"><strong>{t('notifSettings.offlineTip')}</strong></p>
            <p>{t('notifSettings.offlineDesc')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
