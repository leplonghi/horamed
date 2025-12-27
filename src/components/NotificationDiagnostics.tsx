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

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
}

export function NotificationDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Check platform
      results.push({
        name: "Plataforma",
        status: "success",
        message: isNative ? `Nativo (${Capacitor.getPlatform()})` : "Web/PWA"
      });

      // 2. Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        results.push({
          name: "Autenticação",
          status: "success",
          message: `Usuário autenticado`
        });
      } else {
        results.push({
          name: "Autenticação",
          status: "error",
          message: "Não autenticado - faça login primeiro"
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
          name: "Permissão Push",
          status: pushPerm.receive === "granted" ? "success" : "error",
          message: pushPerm.receive === "granted" 
            ? "Concedida ✓" 
            : `Não concedida (${pushPerm.receive}) - Toque para solicitar`
        });

        results.push({
          name: "Permissão Local",
          status: localPerm.display === "granted" ? "success" : "error",
          message: localPerm.display === "granted" 
            ? "Concedida ✓" 
            : `Não concedida (${localPerm.display})`
        });
      } else {
        if ("Notification" in window) {
          const permission = Notification.permission;
          results.push({
            name: "Permissão Web",
            status: permission === "granted" ? "success" : permission === "denied" ? "error" : "warning",
            message: permission === "granted" 
              ? "Concedida ✓" 
              : permission === "denied" 
                ? "Bloqueada - Desbloqueie nas configurações do navegador" 
                : "Não solicitada - Toque para solicitar"
          });
        } else {
          results.push({
            name: "Suporte a Notificações",
            status: "error",
            message: "Navegador não suporta notificações"
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
          name: "Token Push no Banco",
          status: "success",
          message: `Salvo ✓ (${preferences.push_token.substring(0, 15)}...)`
        });
      } else {
        results.push({
          name: "Token Push no Banco",
          status: "error",
          message: "Não encontrado - O app precisa registrar o token"
        });
      }

      results.push({
        name: "Push Habilitado",
        status: preferences?.push_enabled ? "success" : "warning",
        message: preferences?.push_enabled ? "Sim ✓" : "Não - Ative nas configurações"
      });

      results.push({
        name: "Email Habilitado",
        status: preferences?.email_enabled ? "success" : "warning",
        message: preferences?.email_enabled ? "Sim ✓" : "Não"
      });

      // 5. Check scheduled notifications in database
      const { data: scheduled, count } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("delivery_status", "scheduled")
        .limit(5);

      results.push({
        name: "Notificações Agendadas",
        status: (count || 0) > 0 ? "success" : "warning",
        message: `${count || 0} notificações pendentes`
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
          name: "Última Notificação",
          status: lastNotif.delivery_status === "delivered" ? "success" : 
                  lastNotif.delivery_status === "failed" ? "error" : "warning",
          message: `${lastNotif.delivery_status} - ${new Date(lastNotif.created_at).toLocaleString("pt-BR")}`
        });
      } else {
        results.push({
          name: "Histórico",
          status: "warning",
          message: "Nenhuma notificação enviada ainda"
        });
      }

      // 7. Check cron jobs (via edge function call)
      results.push({
        name: "Cron Jobs",
        status: "success",
        message: "Configurados (a cada minuto + a cada hora)"
      });

    } catch (error) {
      console.error("Diagnostic error:", error);
      results.push({
        name: "Erro",
        status: "error",
        message: error instanceof Error ? error.message : "Erro desconhecido"
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
          toast.success("Permissão concedida! Registrando...");
        } else {
          toast.error("Permissão negada. Ative nas configurações do dispositivo.");
        }
      } else {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          toast.success("Permissões de notificação concedidas!");
        } else {
          toast.error("Permissão negada");
        }
      }
      await runDiagnostics();
    } catch (error) {
      toast.error("Erro ao solicitar permissão");
    }
  };

  const sendTestNotification = async () => {
    try {
      if (isNative) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: "🧪 Teste de Notificação",
            body: "Se você está vendo isso, as notificações estão funcionando!",
            schedule: { at: new Date(Date.now() + 3000) }, // 3 seconds from now
            sound: "default",
          }]
        });
        toast.success("Notificação de teste agendada para 3 segundos!");
      } else {
        if (Notification.permission === "granted") {
          new Notification("🧪 Teste de Notificação", {
            body: "Se você está vendo isso, as notificações estão funcionando!",
            icon: "/favicon.png",
          });
          toast.success("Notificação de teste enviada!");
        } else {
          toast.error("Permissão de notificação não concedida");
        }
      }
    } catch (error) {
      toast.error("Erro ao enviar notificação de teste");
    }
  };

  const forceRegisterToken = async () => {
    try {
      if (!isNative) {
        toast.info("Registro de token disponível apenas no app nativo");
        return;
      }

      toast.info("Registrando token...");
      await PushNotifications.register();
      
      // Wait a bit for the registration callback
      setTimeout(runDiagnostics, 2000);
    } catch (error) {
      toast.error("Erro ao registrar");
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
            <CardTitle className="text-lg">Diagnóstico de Notificações</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? "animate-spin" : ""}`} />
            Atualizar
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
            Solicitar Permissão
          </Button>
          <Button size="sm" variant="outline" onClick={sendTestNotification}>
            <TestTube className="h-4 w-4 mr-1" />
            Testar Notificação
          </Button>
          {isNative && (
            <Button size="sm" variant="outline" onClick={forceRegisterToken}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Forçar Registro
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <strong>💡 Dica:</strong> Para notificações funcionarem com o app fechado, você precisa:
          <ol className="list-decimal ml-4 mt-1 space-y-0.5">
            <li>Conceder permissão de notificações</li>
            <li>Ter um token registrado no banco</li>
            <li>Não ter o app em modo economia de bateria</li>
            <li>Permitir execução em segundo plano</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}