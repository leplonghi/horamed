import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Volume2, Clock, AlertCircle, Smartphone, Activity, Battery, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Switch } from "@/components/ui/switch";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import NotificationMetrics from "@/components/NotificationMetrics";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAndroidAlarm } from "@/hooks/useAndroidAlarm";
import BatteryOptimizationPrompt from "@/components/BatteryOptimizationPrompt";
import { useNavigate } from "react-router-dom";

const ALARM_SOUNDS = [
  { id: "beep", nameKey: "beepSimple", url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLTgjMGHm7A7+OZUQ0PVqzn7qxaFg1Lp+LyvmohBSx+zPLTgjIFHm3A7+GZUQ0PVqzn7qxaFg1" },
  { id: "bell", nameKey: "bell", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
  { id: "chime", nameKey: "chimeSoft", url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
  { id: "alert", nameKey: "alertStrong", url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3" },
];

const SOUND_NAMES: Record<string, Record<string, string>> = {
  pt: {
    beepSimple: "Beep Simples",
    bell: "Sino",
    chimeSoft: "Chime Suave",
    alertStrong: "Alerta Forte",
  },
  en: {
    beepSimple: "Simple Beep",
    bell: "Bell",
    chimeSoft: "Soft Chime",
    alertStrong: "Strong Alert",
  }
};

export default function AlarmSettings() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState("beep");
  const [duration, setDuration] = useState([30]);
  const [alertMinutes, setAlertMinutes] = useState([5]);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const { 
    isAndroid, 
    isNative, 
    diagnostics, 
    requestPermissions,
    scheduleAllPendingDoses,
    sendTestAlarm,
  } = useAndroidAlarm();

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem("alarmSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setAlarmEnabled(settings.enabled ?? true);
      setSelectedSound(settings.sound ?? "beep");
      setDuration([settings.duration ?? 30]);
      setAlertMinutes([settings.alertMinutes ?? 5]);
    }

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const saveSettings = async () => {
    const settings = {
      enabled: alarmEnabled,
      sound: selectedSound,
      duration: duration[0],
      alertMinutes: alertMinutes[0],
    };
    localStorage.setItem("alarmSettings", JSON.stringify(settings));
    
    // Re-schedule all alarms with new settings
    if (isNative && alarmEnabled) {
      await scheduleAllPendingDoses();
    }
    
    toast.success(t('alarm.saved'));
  };

  const requestNotificationPermission = async () => {
    if (isNative) {
      const granted = await requestPermissions();
      if (granted) {
        setNotificationPermission("granted");
        toast.success(t('alarm.notifEnabled'));
      } else {
        toast.error(t('alarm.notifDenied'));
      }
    } else if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success(t('alarm.notifEnabled'));
      } else {
        toast.error(t('alarm.notifDenied'));
      }
    }
  };

  const testAlarm = async () => {
    // Stop any playing test audio
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
    }

    // Test native notification if on mobile
    if (isNative) {
      // Use Android alarm hook for better testing
      const success = await sendTestAlarm(120); // 2 minutes
      if (success) {
        toast.info(
          language === 'pt' 
            ? "Alarme de teste agendado para 2 minutos" 
            : "Test alarm scheduled for 2 minutes",
          {
            description: language === 'pt'
              ? "Feche o app e aguarde. Se o alarme tocar, está funcionando!"
              : "Close the app and wait. If the alarm sounds, it's working!",
          }
        );
        return;
      }
    }

    const sound = ALARM_SOUNDS.find(s => s.id === selectedSound);
    if (!sound) return;

    const audio = new Audio(sound.url);
    audio.loop = true;
    setTestAudio(audio);

    audio.play().then(() => {
      toast.info(t('alarm.testPlaying'), {
        description: t('alarm.playingFor', { seconds: duration[0].toString() }),
        duration: duration[0] * 1000,
        action: {
          label: t('alarm.stop'),
          onClick: () => {
            audio.pause();
            audio.currentTime = 0;
          },
        },
      });

      // Stop after duration
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, duration[0] * 1000);
    }).catch((error) => {
      console.error("Error playing alarm:", error);
      toast.error(t('alarm.playError'));
    });
  };

  const stopTest = () => {
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
      toast.success(t('alarm.stopped'));
    }
  };

  const permissionGranted = diagnostics.permissionStatus === "granted" || notificationPermission === "granted";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('alarm.title')}</h1>
            <p className="text-muted-foreground">{t('alarm.subtitle')}</p>
          </div>
        </div>

        {/* Notification Permission */}
        {!permissionGranted && (
          <Card className="p-6 border-warning bg-warning/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{t('alarm.permRequired')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('alarm.permDesc')}
                </p>
                <Button onClick={requestNotificationPermission} variant="outline">
                  {t('alarm.allowNotif')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Android Diagnostics Link */}
        {isAndroid && (
          <Card 
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/alarmes/diagnostico")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'pt' ? 'Diagnóstico de Alarmes' : 'Alarm Diagnostics'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' 
                      ? 'Verifique se os alarmes estão funcionando corretamente'
                      : 'Check if alarms are working correctly'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* Quick stats */}
            <div className="flex gap-4 mt-3 pt-3 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {diagnostics.totalScheduled}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === 'pt' ? 'Agendados' : 'Scheduled'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-500">
                  {diagnostics.totalTriggered}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === 'pt' ? 'Disparados' : 'Triggered'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-500">
                  {diagnostics.totalFailed}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === 'pt' ? 'Falhas' : 'Failed'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Enable/Disable Alarm */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">{t('alarm.enableAlarm')}</Label>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' ? 'Ative ou desative todos os alarmes' : 'Enable or disable all alarms'}
              </p>
            </div>
            <Switch
              checked={alarmEnabled}
              onCheckedChange={setAlarmEnabled}
            />
          </div>
        </Card>

        {/* Sound Selection */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">{t('alarm.sound')}</Label>
          </div>
          <Select value={selectedSound} onValueChange={setSelectedSound}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'pt' ? 'Selecione um som' : 'Select a sound'} />
            </SelectTrigger>
            <SelectContent>
              {ALARM_SOUNDS.map((sound) => (
                <SelectItem key={sound.id} value={sound.id}>
                  {SOUND_NAMES[language]?.[sound.nameKey] || SOUND_NAMES.en[sound.nameKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Duration */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">{t('alarm.duration')}</Label>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{language === 'pt' ? 'Tempo de toque' : 'Ring time'}</span>
              <span className="font-semibold">{t('alarm.durationSeconds', { seconds: duration[0].toString() })}</span>
            </div>
            <Slider
              value={duration}
              onValueChange={setDuration}
              min={10}
              max={120}
              step={5}
            />
          </div>
        </Card>

        {/* Alert Time */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">{t('alarm.alertBefore')}</Label>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{language === 'pt' ? 'Alertar com' : 'Alert with'}</span>
              <span className="font-semibold">{t('alarm.alertMinutes', { minutes: alertMinutes[0].toString() })}</span>
            </div>
            <Slider
              value={alertMinutes}
              onValueChange={setAlertMinutes}
              min={0}
              max={30}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'pt' ? '0 = apenas no horário exato' : '0 = only at exact time'}
            </p>
          </div>
        </Card>

        {/* Test Buttons */}
        <div className="grid gap-3">
          <Button onClick={testAlarm} className="w-full" size="lg" disabled={!alarmEnabled}>
            <Volume2 className="h-5 w-5 mr-2" />
            {isAndroid 
              ? (language === 'pt' ? 'Testar Alarme (2 min)' : 'Test Alarm (2 min)')
              : t('alarm.testAlarm')
            }
          </Button>
          {!isAndroid && (
            <Button onClick={stopTest} variant="outline" className="w-full">
              {t('alarm.stopTest')}
            </Button>
          )}
        </div>

        {/* Notification Metrics */}
        <NotificationMetrics />

        {/* Save Button */}
        <Button onClick={saveSettings} className="w-full" size="lg" variant="default">
          {t('alarm.saveSettings')}
        </Button>

        {isNative && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  ✅ {t('alarm.nativeNotif')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('alarm.nativeDesc')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {isAndroid && (
          <Card className="p-4 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <Battery className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  ⚠️ {language === 'pt' ? 'Economia de Bateria' : 'Battery Optimization'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'pt' 
                    ? 'Para alarmes funcionarem com o app fechado, remova as restrições de bateria nas configurações do Android.'
                    : 'For alarms to work with the app closed, remove battery restrictions in Android settings.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {language === 'pt' ? 'As configurações são salvas localmente no seu dispositivo' : 'Settings are saved locally on your device'}
        </p>
      </main>

      <Navigation />
      
      {/* Battery optimization prompt for Android */}
      {isAndroid && <BatteryOptimizationPrompt />}
    </div>
  );
}