/**
 * Alarm Diagnostics Page
 * 
 * Shows status of alarms, permissions, and allows testing
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Battery,
  Smartphone,
  RefreshCw,
  Play,
  Clock,
  Activity,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAndroidAlarm, ALARM_CHANNEL_ID } from "@/hooks/useAndroidAlarm";
import { useLanguage } from "@/contexts/LanguageContext";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { BatteryInstructionsContent } from "@/components/BatteryOptimizationPrompt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AlarmDiagnostics() {
  const { language } = useLanguage();
  const {
    isAndroid,
    isNative,
    diagnostics,
    requestPermissions,
    sendTestAlarm,
    scheduleAllPendingDoses,
    getAlarmLogs,
    getDiagnostics,
  } = useAndroidAlarm();

  const [pendingNotifications, setPendingNotifications] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [showBatteryInstructions, setShowBatteryInstructions] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // Load pending notifications and logs
  useEffect(() => {
    const loadData = async () => {
      if (!isNative) return;

      try {
        const pending = await LocalNotifications.getPending();
        setPendingNotifications(pending.notifications.length);
        setLogs(getAlarmLogs());
      } catch (error) {
        console.error("Error loading diagnostics data:", error);
      }
    };

    loadData();
  }, [isNative, getAlarmLogs]);

  const handleRequestPermissions = async () => {
    setIsLoading(true);
    const granted = await requestPermissions();
    setIsLoading(false);
    
    if (granted) {
      toast.success(language === "pt" ? "Permissões concedidas!" : "Permissions granted!");
    } else {
      toast.error(language === "pt" ? "Permissões negadas" : "Permissions denied");
    }
  };

  const handleTestAlarm = async () => {
    setTestInProgress(true);
    
    const testDelaySeconds = 120; // 2 minutes
    const success = await sendTestAlarm(testDelaySeconds);
    
    if (success) {
      toast.info(
        language === "pt" 
          ? `Alarme agendado para ${testDelaySeconds / 60} minutos` 
          : `Alarm scheduled for ${testDelaySeconds / 60} minutes`,
        {
          description: language === "pt"
            ? "Feche o app completamente e aguarde. Se você ouvir o som, está funcionando!"
            : "Close the app completely and wait. If you hear the sound, it's working!",
          duration: 10000,
        }
      );
    } else {
      toast.error(
        language === "pt" 
          ? "Erro ao agendar alarme de teste" 
          : "Error scheduling test alarm"
      );
    }
    
    setTestInProgress(false);
  };

  const handleScheduleAll = async () => {
    setIsLoading(true);
    await scheduleAllPendingDoses();
    
    // Refresh pending count
    const pending = await LocalNotifications.getPending();
    setPendingNotifications(pending.notifications.length);
    
    toast.success(
      language === "pt" 
        ? "Alarmes agendados!" 
        : "Alarms scheduled!"
    );
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    
    if (isNative) {
      const pending = await LocalNotifications.getPending();
      setPendingNotifications(pending.notifications.length);
    }
    
    setLogs(getAlarmLogs());
    setIsLoading(false);
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === true) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === false) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={language === "pt" ? "Diagnóstico de Alarmes" : "Alarm Diagnostics"}
        showBack
      />

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Platform Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {language === "pt" ? "Plataforma" : "Platform"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {language === "pt" ? "Tipo" : "Type"}
              </span>
              <Badge variant={isNative ? "default" : "secondary"}>
                {isNative 
                  ? (isAndroid ? "Android Nativo" : "iOS Nativo")
                  : "Web"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {language === "pt" ? "Canal de Notificação" : "Notification Channel"}
              </span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {ALARM_CHANNEL_ID}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Permission Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {language === "pt" ? "Permissões" : "Permissions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {diagnostics.permissionStatus === "granted" 
                  ? <CheckCircle className="h-5 w-5 text-green-500" />
                  : <XCircle className="h-5 w-5 text-red-500" />
                }
                <span className="text-sm">
                  {language === "pt" ? "Notificações" : "Notifications"}
                </span>
              </div>
              <Badge 
                variant={diagnostics.permissionStatus === "granted" ? "default" : "destructive"}
              >
                {diagnostics.permissionStatus === "granted" 
                  ? (language === "pt" ? "Permitido" : "Granted")
                  : diagnostics.permissionStatus === "denied"
                    ? (language === "pt" ? "Negado" : "Denied")
                    : (language === "pt" ? "Desconhecido" : "Unknown")
                }
              </Badge>
            </div>

            {diagnostics.permissionStatus !== "granted" && (
              <Button 
                onClick={handleRequestPermissions} 
                disabled={isLoading}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                {language === "pt" ? "Solicitar Permissões" : "Request Permissions"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Battery Optimization (Android only) */}
        {isAndroid && (
          <Card className="border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                <Battery className="h-4 w-4" />
                {language === "pt" ? "Economia de Bateria" : "Battery Optimization"}
              </CardTitle>
              <CardDescription>
                {language === "pt" 
                  ? "Importante para alarmes funcionarem com app fechado"
                  : "Important for alarms to work with app closed"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-amber-500/30"
                onClick={() => setShowBatteryInstructions(true)}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                {language === "pt" ? "Ver Instruções" : "View Instructions"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {language === "pt" ? "Estatísticas" : "Statistics"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {pendingNotifications}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "pt" ? "Agendados" : "Pending"}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {diagnostics.totalTriggered}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "pt" ? "Disparados" : "Triggered"}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">
                  {diagnostics.totalScheduled}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "pt" ? "Total Agendados" : "Total Scheduled"}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-red-500">
                  {diagnostics.totalFailed}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "pt" ? "Falhas" : "Failed"}
                </div>
              </div>
            </div>

            {diagnostics.lastAlarmTime && (
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {language === "pt" ? "Último alarme:" : "Last alarm:"}{" "}
                  {new Date(diagnostics.lastAlarmTime).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4" />
              {language === "pt" ? "Teste de Alarme" : "Alarm Test"}
            </CardTitle>
            <CardDescription>
              {language === "pt"
                ? "Agende um alarme de teste para verificar se está funcionando"
                : "Schedule a test alarm to verify it's working"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">
                {language === "pt" ? "Procedimento de Teste:" : "Test Procedure:"}
              </h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>{language === "pt" ? "Toque em 'Testar Alarme'" : "Tap 'Test Alarm'"}</li>
                <li>{language === "pt" ? "Feche o app completamente" : "Close the app completely"}</li>
                <li>{language === "pt" ? "Ative modo avião (opcional)" : "Enable airplane mode (optional)"}</li>
                <li>{language === "pt" ? "Bloqueie a tela" : "Lock the screen"}</li>
                <li>{language === "pt" ? "Aguarde 2 minutos" : "Wait 2 minutes"}</li>
              </ol>
            </div>

            <Button 
              onClick={handleTestAlarm}
              disabled={testInProgress || diagnostics.permissionStatus !== "granted"}
              className="w-full"
            >
              {testInProgress ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              {language === "pt" ? "Testar Alarme (2 min)" : "Test Alarm (2 min)"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {language === "pt"
                ? "Se o alarme tocar com o app fechado, está funcionando corretamente!"
                : "If the alarm sounds with the app closed, it's working correctly!"}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {language === "pt" ? "Ações" : "Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleScheduleAll}
              disabled={isLoading}
            >
              <Clock className="h-4 w-4 mr-2" />
              {language === "pt" 
                ? "Reagendar Todos os Alarmes" 
                : "Reschedule All Alarms"}
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {language === "pt" ? "Atualizar Status" : "Refresh Status"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {language === "pt" ? "Logs Recentes" : "Recent Logs"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "pt" ? "Nenhum log disponível" : "No logs available"}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {logs.slice(-10).reverse().map((log, index) => (
                  <div 
                    key={index}
                    className={`text-xs p-2 rounded ${
                      log.success ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <Badge variant={log.success ? "default" : "destructive"} className="text-xs">
                        {log.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="mt-1 text-muted-foreground truncate">
                        {log.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Battery Instructions Dialog */}
      <Dialog open={showBatteryInstructions} onOpenChange={setShowBatteryInstructions}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "pt" 
                ? "Instruções de Economia de Bateria" 
                : "Battery Optimization Instructions"}
            </DialogTitle>
          </DialogHeader>
          <BatteryInstructionsContent />
        </DialogContent>
      </Dialog>
    </div>
  );
}
