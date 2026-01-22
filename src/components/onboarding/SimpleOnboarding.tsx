import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Camera, 
  Pill, 
  Bell, 
  Check, 
  ArrowRight, 
  Sparkles,
  MessageCircle,
  Clock,
  Plus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import logo from "@/assets/logo_HoraMed.png";

interface SimpleOnboardingProps {
  onComplete?: () => void;
}

type OnboardingStep = "welcome" | "add-medication" | "notifications" | "complete";

interface ClaraMessage {
  text: string;
  delay?: number;
}

const QUICK_TIMES = [
  { id: "08:00", label: "08:00", period: "morning" },
  { id: "12:00", label: "12:00", period: "afternoon" },
  { id: "20:00", label: "20:00", period: "night" },
];

export default function SimpleOnboarding({ onComplete }: SimpleOnboardingProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { triggerLight, triggerSuccess } = useHapticFeedback();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [medName, setMedName] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [scanningPrescription, setScanningPrescription] = useState(false);
  const [claraTyping, setClaraTyping] = useState(false);

  // Clara's conversational messages
  const claraMessages: Record<OnboardingStep, ClaraMessage> = {
    welcome: {
      text: language === 'pt' 
        ? "Olá! Sou a Clara, sua assistente de saúde. Vou te ajudar a configurar tudo em menos de 30 segundos! 🩺"
        : "Hi! I'm Clara, your health assistant. I'll help you set everything up in less than 30 seconds! 🩺",
    },
    "add-medication": {
      text: language === 'pt'
        ? "Ótimo! Agora me diga qual é o seu primeiro medicamento. Você pode escanear uma receita ou digitar manualmente."
        : "Great! Now tell me your first medication. You can scan a prescription or type manually.",
    },
    notifications: {
      text: language === 'pt'
        ? "Quase lá! Ative as notificações para nunca esquecer seus horários. 🔔"
        : "Almost there! Enable notifications to never miss your doses. 🔔",
    },
    complete: {
      text: language === 'pt'
        ? "Pronto! Tudo configurado. Agora você nunca mais vai esquecer seus medicamentos! 🎉"
        : "Done! Everything is set up. You'll never forget your medications again! 🎉",
    },
  };

  const goToStep = useCallback((nextStep: OnboardingStep) => {
    triggerLight();
    setClaraTyping(true);
    setTimeout(() => {
      setStep(nextStep);
      setClaraTyping(false);
    }, 300);
  }, [triggerLight]);

  const handleScanPrescription = async () => {
    setScanningPrescription(true);
    triggerLight();
    
    // TODO: Integrate with prescription scanner
    // For now, navigate to the document scanner
    toast.info(
      language === 'pt' 
        ? 'Abrindo câmera para escanear receita...' 
        : 'Opening camera to scan prescription...'
    );
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setScanningPrescription(false);
    
    // Navigate to prescription scan page
    navigate('/adicionar-item', { state: { method: 'camera' } });
  };

  const handleAddMedication = async () => {
    if (!medName.trim()) {
      toast.error(language === 'pt' ? 'Digite o nome do medicamento' : 'Enter medication name');
      return;
    }

    const finalTime = selectedTime === "custom" ? customTime : (selectedTime || "08:00");

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create item
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          name: medName.trim(),
          category: "medicamento",
          is_active: true,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Create schedule
      const { error: schedError } = await supabase
        .from("schedules")
        .insert({
          item_id: item.id,
          freq_type: "daily",
          times: [finalTime],
        });

      if (schedError) throw schedError;

      triggerSuccess();
      toast.success(
        language === 'pt' 
          ? `${medName} adicionado com sucesso!` 
          : `${medName} added successfully!`
      );

      goToStep("notifications");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(language === 'pt' ? 'Erro ao salvar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          triggerSuccess();
          toast.success(
            language === 'pt' 
              ? 'Notificações ativadas!' 
              : 'Notifications enabled!'
          );
        }
      }
    } catch (error) {
      console.error('Error requesting notifications:', error);
    }
    
    goToStep("complete");
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }

    triggerSuccess();
    onComplete?.();
    navigate("/hoje");
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
    navigate("/hoje");
  };

  const stepIndex = step === "welcome" ? 0 : step === "add-medication" ? 1 : step === "notifications" ? 2 : 3;
  const progress = ((stepIndex) / 3) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className={cn(
          "overflow-hidden p-6",
          "bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl",
          "border border-border/30 shadow-2xl"
        )}>
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map((s) => (
              <motion.div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-500",
                  s <= stepIndex ? "bg-primary" : "bg-muted"
                )}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: s * 0.1 }}
              />
            ))}
          </div>

          {/* Clara's message */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary mb-1">Clara</p>
                <div className="p-3 rounded-2xl rounded-tl-sm bg-muted/50">
                  {claraTyping ? (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <p className="text-sm text-foreground">{claraMessages[step].text}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {step === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <motion.img 
                    src={logo} 
                    alt="HoraMed" 
                    className="h-20 w-auto mx-auto mb-4"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  />
                  <h2 className="text-2xl font-bold">
                    {language === 'pt' ? 'Bem-vindo ao HoraMed' : 'Welcome to HoraMed'}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    {language === 'pt' 
                      ? 'Configure em 30 segundos' 
                      : 'Set up in 30 seconds'}
                  </p>
                </div>

                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mb-4">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{language === 'pt' ? 'Apenas 3 passos' : 'Only 3 steps'}</span>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl gap-3 text-base"
                  onClick={() => goToStep("add-medication")}
                >
                  <Sparkles className="h-5 w-5" />
                  {language === 'pt' ? 'Começar agora' : 'Start now'}
                  <ArrowRight className="h-5 w-5 ml-auto" />
                </Button>

                <button
                  onClick={handleSkip}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {language === 'pt' ? 'Pular e explorar' : 'Skip and explore'}
                </button>
              </motion.div>
            )}

            {step === "add-medication" && (
              <motion.div
                key="add-medication"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Scan option - highlighted */}
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-16 rounded-2xl gap-3 text-left justify-start",
                    "border-2 border-primary/50 bg-primary/5 hover:bg-primary/10",
                    "transition-all"
                  )}
                  onClick={handleScanPrescription}
                  disabled={scanningPrescription}
                >
                  {scanningPrescription ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Camera className="h-6 w-6 text-primary" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {language === 'pt' ? 'Escanear receita' : 'Scan prescription'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'pt' ? 'Mais rápido com IA' : 'Faster with AI'}
                    </p>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    {language === 'pt' ? 'Recomendado' : 'Recommended'}
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {language === 'pt' ? 'ou digite' : 'or type'}
                    </span>
                  </div>
                </div>

                {/* Manual input */}
                <div className="space-y-3">
                  <div className="relative">
                    <Pill className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      placeholder={language === 'pt' ? 'Ex: Losartana 50mg' : 'Ex: Lisinopril 10mg'}
                      className="pl-12 h-14 text-base rounded-2xl"
                    />
                  </div>

                  {medName.trim() && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3"
                    >
                      <p className="text-sm font-medium">
                        {language === 'pt' ? 'Horário:' : 'Time:'}
                      </p>
                      <div className="flex gap-2">
                        {QUICK_TIMES.map((time) => (
                          <motion.button
                            key={time.id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSelectedTime(time.id);
                              triggerLight();
                            }}
                            className={cn(
                              "flex-1 p-3 rounded-xl border-2 transition-all",
                              "flex flex-col items-center justify-center gap-0.5",
                              selectedTime === time.id
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:border-primary/50"
                            )}
                          >
                            <span className="text-lg font-bold">{time.label}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {time.period === "morning" 
                                ? (language === 'pt' ? 'Manhã' : 'AM')
                                : time.period === "afternoon"
                                  ? (language === 'pt' ? 'Tarde' : 'PM')
                                  : (language === 'pt' ? 'Noite' : 'Night')
                              }
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => goToStep("notifications")}
                  >
                    {language === 'pt' ? 'Pular' : 'Skip'}
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleAddMedication}
                    disabled={!medName.trim() || saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {language === 'pt' ? 'Adicionar' : 'Add'}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <Bell className="h-10 w-10 text-primary" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold mb-2">
                    {language === 'pt' ? 'Ativar lembretes' : 'Enable reminders'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Receba alertas na hora certa para nunca esquecer seus medicamentos'
                      : 'Get alerts at the right time to never forget your medications'}
                  </p>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl gap-3"
                  onClick={handleRequestNotifications}
                >
                  <Bell className="h-5 w-5" />
                  {language === 'pt' ? 'Ativar notificações' : 'Enable notifications'}
                </Button>

                <button
                  onClick={() => goToStep("complete")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {language === 'pt' ? 'Agora não' : 'Not now'}
                </button>
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="h-10 w-10 text-green-600" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold mb-2">
                    {language === 'pt' ? 'Tudo pronto!' : 'All set!'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Seu HoraMed está configurado. Você pode adicionar mais medicamentos a qualquer momento.'
                      : 'Your HoraMed is set up. You can add more medications anytime.'}
                  </p>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl gap-3"
                  onClick={handleComplete}
                >
                  <Sparkles className="h-5 w-5" />
                  {language === 'pt' ? 'Começar a usar' : 'Start using'}
                  <ArrowRight className="h-5 w-5 ml-auto" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
