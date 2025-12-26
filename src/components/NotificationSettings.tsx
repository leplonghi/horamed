import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Moon } from "lucide-react";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationSettings() {
  const { quietHours, updateQuietHours, checkPermissions } = usePushNotifications();
  const [isEnabled, setIsEnabled] = useState(false);
  const [localQuietHours, setLocalQuietHours] = useState(quietHours);

  useEffect(() => {
    const checkNotificationPermission = async () => {
      // First try the hook's check
      const hookResult = await checkPermissions();
      
      // On web, also do a direct check as fallback
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
    toast.success(updated.enabled ? "Modo silencioso ativado" : "Modo silencioso desativado");
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const updated = { ...localQuietHours, [field]: value };
    setLocalQuietHours(updated);
    updateQuietHours(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações
        </CardTitle>
        <CardDescription>
          Configure quando e como receber lembretes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notificações Ativas</Label>
            <p className="text-sm text-muted-foreground">
              {isEnabled ? "Você receberá lembretes de medicamentos" : "Ative nas configurações do dispositivo"}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isEnabled 
              ? "bg-green-500/20 text-green-700 dark:text-green-400" 
              : "bg-muted text-muted-foreground"
          }`}>
            {isEnabled ? "Ativado" : "Desativado"}
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Modo Silencioso
              </Label>
              <p className="text-sm text-muted-foreground">
                Silenciar notificações durante horários específicos
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
                  Início
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
                  Término
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
            <Label>Ações Rápidas</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Responda diretamente das notificações:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <strong>Tomar:</strong> Marca como tomado e atualiza estoque
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <strong>Adiar:</strong> Recebe outro lembrete em 15 minutos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                <strong>Pular:</strong> Marca como pulado
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
            <p className="mb-2">💡 <strong>Funciona offline:</strong></p>
            <p>Suas ações são salvas automaticamente e sincronizadas quando você voltar online.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
