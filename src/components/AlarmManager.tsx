import { useState } from 'react';
import { format, addDays, addHours, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, BellOff, Plus, Trash2, Clock, Calendar, Volume2, VolumeX, Vibrate, RefreshCw, Play, Settings, ChevronRight, AlertCircle, CheckCircle, Cloud, CloudOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlarms } from '@/hooks/useAlarms';
import { Alarm } from '@/lib/alarmDB';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'hourly';

interface CreateAlarmForm {
  title: string;
  message: string;
  date: string;
  time: string;
  recurrence: RecurrenceType;
  sound: boolean;
  vibrate: boolean;
  requireInteraction: boolean;
}

const defaultForm: CreateAlarmForm = {
  title: '',
  message: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  time: format(addHours(new Date(), 1), 'HH:mm'),
  recurrence: 'once',
  sound: true,
  vibrate: true,
  requireInteraction: true,
};

const recurrenceLabels: Record<RecurrenceType, string> = {
  once: 'Uma vez',
  hourly: 'A cada hora',
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  monthly: 'Mensalmente',
};

export default function AlarmManager() {
  const { t } = useLanguage();
  const {
    alarms,
    loading,
    syncing,
    error,
    createAlarm,
    deleteAlarm,
    toggleAlarm,
    testNotification,
    requestPermission,
    permissionStatus,
    isSupported,
    syncWithCloud,
  } = useAlarms();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateAlarmForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`);

      await createAlarm({
        title: form.title,
        message: form.message || undefined,
        scheduledAt: scheduledAt.toISOString(),
        enabled: true,
        recurrence: form.recurrence,
        sound: form.sound,
        vibrate: form.vibrate,
        silent: !form.sound,
        requireInteraction: form.requireInteraction,
        category: 'reminder',
      });

      setIsCreateOpen(false);
      setForm(defaultForm);
    } catch (err) {
      console.error('Error creating alarm:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle test notification
  const handleTestNotification = async () => {
    await testNotification(
      '🔔 Teste de Notificação',
      'Se você viu esta notificação, o sistema está funcionando!'
    );
  };

  // Format scheduled time for display
  const formatScheduledTime = (alarm: Alarm) => {
    const date = new Date(alarm.scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === addDays(now, 1).toDateString();

    if (isToday) {
      return `Hoje às ${format(date, 'HH:mm')}`;
    }
    if (isTomorrow) {
      return `Amanhã às ${format(date, 'HH:mm')}`;
    }
    return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  // Get status badge for alarm
  const getStatusBadge = (alarm: Alarm) => {
    const scheduledTime = new Date(alarm.scheduledAt);
    const now = new Date();
    const isPast = scheduledTime < now;

    if (!alarm.enabled) {
      return <Badge variant="secondary" className="text-xs">Desativado</Badge>;
    }
    if (isPast && alarm.recurrence === 'once') {
      return <Badge variant="outline" className="text-xs text-muted-foreground">Expirado</Badge>;
    }
    if (alarm.recurrence !== 'once') {
      return <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">{recurrenceLabels[alarm.recurrence]}</Badge>;
    }
    return <Badge variant="default" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>;
  };

  // Permission status component
  const PermissionStatus = () => {
    if (!isSupported) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seu navegador não suporta notificações. Use Chrome, Firefox, Edge ou Safari 16.4+.
          </AlertDescription>
        </Alert>
      );
    }

    if (permissionStatus === 'denied') {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Notificações bloqueadas. Ative nas configurações do navegador para receber alarmes.
          </AlertDescription>
        </Alert>
      );
    }

    if (permissionStatus === 'default') {
      return (
        <Alert className="mb-4">
          <Bell className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Ative as notificações para receber alarmes</span>
            <Button size="sm" onClick={requestPermission}>
              Ativar
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Permission Status */}
      <PermissionStatus />

      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alarmes e Lembretes
              </CardTitle>
              <CardDescription>
                Agende notificações para lembrar de medicamentos e compromissos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncWithCloud}
                disabled={syncing}
                title="Sincronizar com a nuvem"
              >
                <Cloud className={cn("h-4 w-4", syncing && "animate-pulse")} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={permissionStatus !== 'granted'}
              >
                <Play className="h-4 w-4 mr-1" />
                Testar
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={permissionStatus !== 'granted'}>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Alarme
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Alarme</DialogTitle>
                    <DialogDescription>
                      Configure quando você quer ser lembrado
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="alarm-title">Título *</Label>
                      <Input
                        id="alarm-title"
                        placeholder="Ex: Tomar medicamento"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="alarm-message">Mensagem (opcional)</Label>
                      <Input
                        id="alarm-message"
                        placeholder="Descrição adicional"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="alarm-date">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Data
                        </Label>
                        <Input
                          id="alarm-date"
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alarm-time">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Hora
                        </Label>
                        <Input
                          id="alarm-time"
                          type="time"
                          value={form.time}
                          onChange={(e) => setForm({ ...form, time: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-2">
                      <Label>
                        <RefreshCw className="h-3 w-3 inline mr-1" />
                        Repetir
                      </Label>
                      <Select
                        value={form.recurrence}
                        onValueChange={(value: RecurrenceType) => setForm({ ...form, recurrence: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(recurrenceLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="alarm-sound" className="flex items-center gap-2 cursor-pointer">
                          {form.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          Som
                        </Label>
                        <Switch
                          id="alarm-sound"
                          checked={form.sound}
                          onCheckedChange={(checked) => setForm({ ...form, sound: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="alarm-vibrate" className="flex items-center gap-2 cursor-pointer">
                          <Vibrate className="h-4 w-4" />
                          Vibrar
                        </Label>
                        <Switch
                          id="alarm-vibrate"
                          checked={form.vibrate}
                          onCheckedChange={(checked) => setForm({ ...form, vibrate: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="alarm-interaction" className="flex items-center gap-2 cursor-pointer">
                          <Bell className="h-4 w-4" />
                          Persistente
                        </Label>
                        <Switch
                          id="alarm-interaction"
                          checked={form.requireInteraction}
                          onCheckedChange={(checked) => setForm({ ...form, requireInteraction: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={!form.title.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Criando...' : 'Criar Alarme'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{alarms.filter(a => a.enabled).length}</div>
              <div className="text-xs text-muted-foreground">Ativos</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{alarms.filter(a => a.recurrence !== 'once').length}</div>
              <div className="text-xs text-muted-foreground">Recorrentes</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{alarms.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alarms List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alarmes Agendados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando alarmes...
            </div>
          ) : alarms.length === 0 ? (
            <div className="text-center py-8">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhum alarme agendado</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setIsCreateOpen(true)}
                disabled={permissionStatus !== 'granted'}
              >
                <Plus className="h-4 w-4 mr-1" />
                Criar primeiro alarme
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      alarm.enabled 
                        ? "bg-card hover:bg-muted/50" 
                        : "bg-muted/30 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Switch
                        checked={alarm.enabled}
                        onCheckedChange={() => toggleAlarm(alarm.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium truncate",
                            !alarm.enabled && "text-muted-foreground"
                          )}>
                            {alarm.title}
                          </span>
                          {getStatusBadge(alarm)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatScheduledTime(alarm)}</span>
                          {alarm.sound && <Volume2 className="h-3 w-3" />}
                          {alarm.vibrate && <Vibrate className="h-3 w-3" />}
                        </div>
                        {alarm.message && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {alarm.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAlarm(alarm.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* iOS Instructions */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">Importante para iOS</p>
              <p>
                No iPhone/iPad, as notificações só funcionam se o app estiver instalado na tela inicial
                (Compartilhar → Adicionar à Tela de Início). Safari requer iOS 16.4 ou superior.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
