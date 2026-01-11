import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellRing, Smartphone, CheckCircle2, XCircle, Loader2, AlertTriangle, Settings, ChevronRight } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NotificationSetupWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type StepStatus = 'pending' | 'loading' | 'success' | 'error';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  errorMessage?: string;
}

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

export default function NotificationSetupWizard({ open, onClose, onComplete }: NotificationSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'permission',
      title: 'Permissão de Notificações',
      description: isNative 
        ? `Permitir que o HoraMed envie notificações no seu ${platform === 'ios' ? 'iPhone' : 'Android'}`
        : 'Permitir notificações no navegador',
      status: 'pending'
    },
    {
      id: 'register',
      title: 'Registrar Dispositivo',
      description: 'Conectar seu dispositivo ao servidor de notificações',
      status: 'pending'
    },
    {
      id: 'schedule',
      title: 'Agendar Alarmes',
      description: 'Configurar lembretes para suas próximas doses',
      status: 'pending'
    },
    {
      id: 'test',
      title: 'Testar Notificação',
      description: 'Enviar uma notificação de teste para confirmar',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: StepStatus, errorMessage?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, errorMessage } 
        : step
    ));
  };

  const requestPermissions = async (): Promise<boolean> => {
    updateStepStatus('permission', 'loading');
    
    try {
      if (isNative) {
        // Request Push Notification permissions
        const pushPermStatus = await PushNotifications.requestPermissions();
        console.log("[Setup] Push permission result:", pushPermStatus.receive);
        
        if (pushPermStatus.receive !== 'granted') {
          updateStepStatus('permission', 'error', 
            platform === 'ios' 
              ? 'Vá em Ajustes > HoraMed > Notificações e ative'
              : 'Vá em Configurações > Apps > HoraMed > Notificações'
          );
          return false;
        }
        
        // Request Local Notification permissions
        const localPermStatus = await LocalNotifications.requestPermissions();
        console.log("[Setup] Local permission result:", localPermStatus.display);
        
        if (localPermStatus.display !== 'granted') {
          updateStepStatus('permission', 'error', 'Permissão de notificações locais negada');
          return false;
        }
        
        updateStepStatus('permission', 'success');
        return true;
      } else {
        // Web notifications
        if (!('Notification' in window)) {
          updateStepStatus('permission', 'error', 'Seu navegador não suporta notificações');
          return false;
        }
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          updateStepStatus('permission', 'success');
          return true;
        } else {
          updateStepStatus('permission', 'error', 
            'Clique no ícone de cadeado na barra de endereço e ative as notificações'
          );
          return false;
        }
      }
    } catch (error) {
      console.error("[Setup] Permission error:", error);
      updateStepStatus('permission', 'error', 'Erro ao solicitar permissão');
      return false;
    }
  };

  const registerDevice = async (): Promise<boolean> => {
    updateStepStatus('register', 'loading');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateStepStatus('register', 'error', 'Você precisa estar logado');
        return false;
      }

      if (isNative) {
        // Set up registration listener
        const registrationPromise = new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout ao registrar dispositivo'));
          }, 15000);

          PushNotifications.addListener('registration', (token) => {
            clearTimeout(timeout);
            console.log("[Setup] Got token:", token.value.substring(0, 20) + "...");
            resolve(token.value);
          });

          PushNotifications.addListener('registrationError', (error) => {
            clearTimeout(timeout);
            console.error("[Setup] Registration error:", error);
            reject(error);
          });
        });

        // Register for push
        await PushNotifications.register();
        
        // Wait for token
        const token = await registrationPromise;
        setPushToken(token);
        
        // Save token to database
        const { error } = await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            push_enabled: true,
            push_token: token,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error("[Setup] Error saving token:", error);
          updateStepStatus('register', 'error', 'Erro ao salvar token no servidor');
          return false;
        }

        console.log("[Setup] Token saved successfully!");
        
        // Create notification channel for Android
        if (platform === 'android') {
          await LocalNotifications.createChannel({
            id: 'horamed-medicamentos',
            name: 'Lembretes de Medicamentos',
            description: 'Notificações para lembrar de tomar medicamentos',
            importance: 5, // IMPORTANCE_HIGH
            visibility: 1, // PUBLIC
            sound: 'default',
            vibration: true,
            lights: true,
          });
        }

        updateStepStatus('register', 'success');
        return true;
      } else {
        // Web - just mark as success since we don't have server push
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            push_enabled: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        updateStepStatus('register', 'success');
        return true;
      }
    } catch (error) {
      console.error("[Setup] Registration error:", error);
      updateStepStatus('register', 'error', 'Erro ao registrar dispositivo');
      return false;
    }
  };

  const scheduleAlarms = async (): Promise<boolean> => {
    updateStepStatus('schedule', 'loading');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateStepStatus('schedule', 'error', 'Usuário não encontrado');
        return false;
      }

      // Get upcoming doses
      const now = new Date();
      const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const { data: doses, error } = await supabase
        .from('dose_instances')
        .select(`
          id,
          due_at,
          status,
          items (
            id,
            name,
            dose_text,
            user_id
          )
        `)
        .eq('status', 'scheduled')
        .gte('due_at', now.toISOString())
        .lte('due_at', next48h.toISOString())
        .order('due_at', { ascending: true });

      if (error) throw error;

      if (!doses || doses.length === 0) {
        updateStepStatus('schedule', 'success');
        console.log("[Setup] No doses to schedule");
        return true;
      }

      // Filter doses belonging to this user
      const userDoses = doses.filter(d => {
        const item = Array.isArray(d.items) ? d.items[0] : d.items;
        return item?.user_id === user.id;
      });

      if (isNative) {
        // Cancel existing notifications first
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        // Schedule local notifications for each dose
        const notifications = userDoses.map((dose, index) => {
          const item = Array.isArray(dose.items) ? dose.items[0] : dose.items;
          const dueDate = new Date(dose.due_at);
          
          return {
            id: index + 1,
            title: `💊 Hora do ${item?.name || 'Medicamento'}`,
            body: item?.dose_text || 'Está na hora de tomar seu medicamento',
            schedule: { at: dueDate },
            sound: 'default',
            channelId: 'horamed-medicamentos',
            extra: { doseId: dose.id },
            actionTypeId: 'DOSE_REMINDER',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_launcher',
          };
        });

        if (notifications.length > 0) {
          await LocalNotifications.schedule({ notifications });
          console.log(`[Setup] Scheduled ${notifications.length} local notifications`);
        }
      }

      // Also call server to schedule push notifications (only when authenticated)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: scheduleError } = await supabase.functions.invoke("schedule-dose-notifications");
        if (scheduleError) throw scheduleError;
      }

      updateStepStatus('schedule', 'success');
      return true;
    } catch (error) {
      console.error("[Setup] Schedule error:", error);
      updateStepStatus('schedule', 'error', 'Erro ao agendar alarmes');
      return false;
    }
  };

  const testNotification = async (): Promise<boolean> => {
    updateStepStatus('test', 'loading');
    
    try {
      if (isNative) {
        // Schedule immediate local notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 99999,
              title: '✅ HoraMed Funcionando!',
              body: 'Você receberá lembretes mesmo com o app fechado',
              schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds
              sound: 'default',
              channelId: 'horamed-medicamentos',
              smallIcon: 'ic_stat_icon',
            }
          ]
        });
      } else {
        // Web notification
        new Notification('✅ HoraMed Funcionando!', {
          body: 'Você receberá lembretes quando o navegador estiver aberto',
          icon: '/favicon.png',
        });
      }

      updateStepStatus('test', 'success');
      toast.success('Notificação de teste enviada!');
      return true;
    } catch (error) {
      console.error("[Setup] Test error:", error);
      updateStepStatus('test', 'error', 'Erro ao enviar teste');
      return false;
    }
  };

  const runSetup = async () => {
    setIsProcessing(true);
    
    // Step 1: Permissions
    setCurrentStep(0);
    const permOk = await requestPermissions();
    if (!permOk) {
      setIsProcessing(false);
      return;
    }
    
    // Step 2: Register
    setCurrentStep(1);
    const regOk = await registerDevice();
    if (!regOk) {
      setIsProcessing(false);
      return;
    }
    
    // Step 3: Schedule
    setCurrentStep(2);
    const schedOk = await scheduleAlarms();
    if (!schedOk) {
      setIsProcessing(false);
      return;
    }
    
    // Step 4: Test
    setCurrentStep(3);
    const testOk = await testNotification();
    
    setIsProcessing(false);
    
    if (testOk) {
      // Mark setup complete
      localStorage.setItem('notification_setup_complete', 'true');
      
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 2000);
    }
  };

  const getStepIcon = (step: SetupStep, index: number) => {
    if (step.status === 'loading') {
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
    if (step.status === 'success') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (step.status === 'error') {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return (
      <div className={cn(
        "h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs font-medium",
        currentStep === index ? "border-primary text-primary" : "border-muted-foreground/40 text-muted-foreground"
      )}>
        {index + 1}
      </div>
    );
  };

  const allStepsComplete = steps.every(s => s.status === 'success');
  const hasError = steps.some(s => s.status === 'error');

  return (
    <Dialog open={open} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Configurar Notificações
          </DialogTitle>
          <DialogDescription>
            {isNative 
              ? 'Configure alarmes que funcionam mesmo com o app fechado'
              : 'Configure lembretes no navegador'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {steps.map((step, index) => (
            <Card 
              key={step.id}
              className={cn(
                "transition-all",
                step.status === 'success' && "border-green-500/30 bg-green-500/5",
                step.status === 'error' && "border-destructive/30 bg-destructive/5"
              )}
            >
              <CardContent className="p-3 flex items-start gap-3">
                {getStepIcon(step, index)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  {step.status === 'error' && step.errorMessage && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {step.errorMessage}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform-specific instructions */}
        {!isProcessing && !allStepsComplete && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-medium flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              {platform === 'ios' ? 'No iPhone:' : platform === 'android' ? 'No Android:' : 'No Navegador:'}
            </p>
            {platform === 'ios' ? (
              <ol className="list-decimal list-inside space-y-1">
                <li>Uma janela pedirá permissão para notificações</li>
                <li>Toque em <strong>"Permitir"</strong></li>
                <li>Se negou antes: Ajustes → HoraMed → Notificações → Ativar</li>
              </ol>
            ) : platform === 'android' ? (
              <ol className="list-decimal list-inside space-y-1">
                <li>Uma janela pedirá permissão para notificações</li>
                <li>Toque em <strong>"Permitir"</strong></li>
                <li>Se negou antes: Configurações → Apps → HoraMed → Notificações</li>
                <li>Desative otimização de bateria para o HoraMed</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em "Iniciar Configuração"</li>
                <li>Seu navegador pedirá permissão</li>
                <li>Clique em "Permitir"</li>
                <li>⚠️ Notificações funcionam apenas com navegador aberto</li>
              </ol>
            )}
          </div>
        )}

        {allStepsComplete && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-700 dark:text-green-400">
              Tudo Configurado!
            </p>
            <p className="text-sm text-muted-foreground">
              Você receberá lembretes mesmo com o app fechado
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {!isProcessing && !allStepsComplete && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Depois
            </Button>
          )}
          
          {hasError && !isProcessing && (
            <Button 
              onClick={() => {
                // Reset steps and retry
                setSteps(prev => prev.map(s => ({ ...s, status: 'pending' as StepStatus, errorMessage: undefined })));
                setCurrentStep(0);
                runSetup();
              }}
              className="flex-1"
            >
              Tentar Novamente
            </Button>
          )}
          
          {!isProcessing && !hasError && !allStepsComplete && (
            <Button onClick={runSetup} className="flex-1">
              <Bell className="h-4 w-4 mr-2" />
              Iniciar Configuração
            </Button>
          )}
          
          {isProcessing && (
            <Button disabled className="flex-1">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Configurando...
            </Button>
          )}
          
          {allStepsComplete && (
            <Button onClick={onClose} className="flex-1">
              Concluir
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
