import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell, Smartphone, Watch, ChevronRight, Settings2, Bug } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { NotificationDiagnostics } from "@/components/NotificationDiagnostics";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { scheduleNotificationsForNextDay } = useMedicationAlarm();
  const [settings, setSettings] = useState({
    pushEnabled: true,
    localEnabled: true,
    wearableSync: true,
    sound: "beep",
    vibration: true,
    alertMinutes: [15, 5, 0],
  });
  const [loading, setLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          pushEnabled: data.push_enabled ?? true,
          localEnabled: true,
          wearableSync: true,
          sound: "beep",
          vibration: true,
          alertMinutes: [15, 5, 0],
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const checkPermissions = async () => {
    if (Capacitor.isNativePlatform()) {
      // Check local notifications
      const localPerm = await LocalNotifications.checkPermissions();
      if (localPerm.display !== 'granted') {
        toast.info("Configure as permissões de notificação para receber alertas");
      }

      // Check push notifications
      const pushPerm = await PushNotifications.checkPermissions();
      if (pushPerm.receive !== 'granted') {
        toast.info("Configure as notificações push para alertas mesmo com app fechado");
      }
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive === 'granted') {
          await PushNotifications.register();
          toast.success("Notificações push ativadas!");
          setSettings({ ...settings, pushEnabled: true });
        } else {
          toast.error("Permissão negada. Ative nas configurações do dispositivo.");
        }
      } else {
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            toast.success("Notificações web ativadas!");
            setSettings({ ...settings, pushEnabled: true });
          }
        }
      }
    } catch (error) {
      console.error("Error enabling push:", error);
      toast.error("Erro ao ativar notificações push");
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          push_enabled: settings.pushEnabled,
          email_enabled: false,
        });

      if (error) throw error;

      // Schedule notifications for next 24 hours
      await scheduleNotificationsForNextDay();

      toast.success("Configurações salvas! Notificações agendadas para as próximas 24 horas.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 pt-24 pb-6">
        <div className="flex items-start gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Configure quando e como ser alertado sobre suas doses
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Setup Banner for Mobile */}
          {Capacitor.isNativePlatform() && (
            <Card 
              className="p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/30 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate('/configurar-notificacoes')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Configurar para funcionar com app fechado</h3>
                  <p className="text-xs text-muted-foreground">
                    Passo a passo para garantir que os lembretes funcionem sempre
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          )}

          {!Capacitor.isNativePlatform() && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Para notificações mesmo com o app fechado, instale o HoraMed no seu celular.{' '}
                <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate('/install')}>
                  Como instalar →
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notificações Push</CardTitle>
                  <CardDescription className="text-xs">
                    Receba alertas mesmo com o app fechado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-primary/20">
                <div className="flex-1">
                  <Label htmlFor="push-enabled" className="text-sm font-semibold cursor-pointer">
                    Ativar notificações push
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Essencial para lembretes pontuais
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnablePushNotifications();
                    } else {
                      setSettings({ ...settings, pushEnabled: false });
                    }
                  }}
                />
              </div>

              {!settings.pushEnabled && (
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm text-warning-foreground">
                    <strong>⚠️ Atenção:</strong> Sem notificações push você pode perder seus horários de medicação.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Watch className="h-5 w-5 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">Sincronização com Wearables</CardTitle>
                  <CardDescription className="text-xs">
                    Apple Watch, Galaxy Watch, etc.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-success/20">
                <div className="flex-1">
                  <Label htmlFor="wearable-sync" className="text-sm font-semibold cursor-pointer">
                    Sincronizar com smartwatch
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Alertas no pulso
                  </p>
                </div>
                <Switch
                  id="wearable-sync"
                  checked={settings.wearableSync}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, wearableSync: checked })
                  }
                />
              </div>

              {settings.wearableSync && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-sm flex items-start gap-2">
                    <span className="text-2xl">⌚</span>
                    <span>Suas notificações aparecerão automaticamente no seu smartwatch quando conectado.</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <Bell className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Horários de Alerta</CardTitle>
                  <CardDescription className="text-xs">
                    Configure os momentos de notificação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Você será alertado nos seguintes momentos:</Label>
                <div className="space-y-3 p-4 bg-accent/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm font-medium">15 minutos antes</span>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                      <span className="text-sm font-medium">5 minutos antes</span>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Na hora exata</span>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border">
                <div className="flex-1">
                  <Label htmlFor="vibration" className="text-sm font-semibold cursor-pointer">
                    Vibração
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Feedback tátil nos alertas
                  </p>
                </div>
                <Switch
                  id="vibration"
                  checked={settings.vibration}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, vibration: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-20 z-10 mt-6">
            <Button 
              onClick={handleSaveSettings} 
              className="w-full shadow-lg" 
              size="lg"
              disabled={loading}
              variant={loading ? "secondary" : "default"}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                  Salvando configurações...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-5 w-5" />
                  Salvar e Agendar Notificações
                </>
              )}
            </Button>
          </div>

          {/* Diagnostics Section */}
          <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics}>
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-orange-500" />
                      <span className="font-medium text-sm">Diagnóstico de Notificações</span>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${showDiagnostics ? "rotate-90" : ""}`} />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <NotificationDiagnostics />
            </CollapsibleContent>
          </Collapsible>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-sm">Como funcionam as notificações:</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 ml-1">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Programadas automaticamente para as próximas 24 horas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Funcionam mesmo com o app fechado (precisa de permissão)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Email enviado como backup quando o push falha</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Reprogramadas automaticamente a cada hora</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
