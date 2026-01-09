import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Camera, ArrowRight, Check, Sparkles, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuickStart30SecondsProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const QUICK_TIMES = [
  { id: "08:00", label: "08:00", period: "morning" },
  { id: "12:00", label: "12:00", period: "afternoon" },
  { id: "20:00", label: "20:00", period: "night" },
  { id: "custom", label: "Outro", period: "custom" },
];

export default function QuickStart30Seconds({ onComplete, onSkip }: QuickStart30SecondsProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [medName, setMedName] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (step === 1 && !medName.trim()) {
      toast.error(language === 'pt' ? 'Digite o nome do medicamento' : 'Enter medication name');
      return;
    }
    if (step === 2 && !selectedTime) {
      toast.error(language === 'pt' ? 'Selecione um horário' : 'Select a time');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const finalTime = selectedTime === "custom" ? customTime : selectedTime;

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

      toast.success(
        language === 'pt' 
          ? `${medName} adicionado! Você será lembrado às ${finalTime}` 
          : `${medName} added! You'll be reminded at ${finalTime}`
      );

      onComplete();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(language === 'pt' ? 'Erro ao salvar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

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
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Header */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Clock className="h-4 w-4" />
              {language === 'pt' ? '30 segundos' : '30 seconds'}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {step === 1 && (language === 'pt' ? 'Qual medicamento?' : 'Which medication?')}
              {step === 2 && (language === 'pt' ? 'Que horas?' : 'What time?')}
              {step === 3 && (language === 'pt' ? 'Tudo pronto!' : 'All set!')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {step === 1 && (language === 'pt' ? 'Digite o nome do seu remédio' : 'Type your medication name')}
              {step === 2 && (language === 'pt' ? 'Quando você toma?' : 'When do you take it?')}
              {step === 3 && (language === 'pt' ? 'Vamos te lembrar na hora certa' : "We'll remind you on time")}
            </p>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Pill className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder={language === 'pt' ? 'Ex: Losartana 50mg' : 'Ex: Lisinopril 10mg'}
                    className="pl-12 h-14 text-lg rounded-2xl"
                    autoFocus
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl gap-3"
                  onClick={() => toast.info(language === 'pt' ? 'Em breve: escaneie sua receita!' : 'Coming soon: scan your prescription!')}
                >
                  <Camera className="h-5 w-5" />
                  {language === 'pt' ? 'Escanear receita' : 'Scan prescription'}
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_TIMES.map((time) => (
                    <motion.button
                      key={time.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedTime(time.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all",
                        "flex flex-col items-center justify-center gap-1",
                        selectedTime === time.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl font-bold">
                        {time.id === "custom" ? "⏰" : time.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {time.id === "custom" 
                          ? (language === 'pt' ? 'Personalizar' : 'Custom')
                          : (time.period === "morning" 
                              ? (language === 'pt' ? 'Manhã' : 'Morning')
                              : time.period === "afternoon"
                                ? (language === 'pt' ? 'Tarde' : 'Afternoon')
                                : (language === 'pt' ? 'Noite' : 'Night')
                            )
                        }
                      </span>
                    </motion.button>
                  ))}
                </div>

                {selectedTime === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="h-14 text-xl text-center rounded-2xl"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className={cn(
                  "p-5 rounded-2xl text-center",
                  "bg-gradient-to-br from-green-500/15 to-emerald-500/5",
                  "border border-green-500/30"
                )}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="h-8 w-8 text-green-600" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-lg">{medName}</p>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Bell className="h-4 w-4" />
                      <span>
                        {language === 'pt' ? 'Lembrete às' : 'Reminder at'}{' '}
                        {selectedTime === "custom" ? customTime : selectedTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {language === 'pt' 
                    ? 'Você pode adicionar mais depois'
                    : 'You can add more later'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {onSkip && step === 1 && (
              <Button
                variant="ghost"
                className="flex-1"
                onClick={onSkip}
              >
                {language === 'pt' ? 'Pular' : 'Skip'}
              </Button>
            )}
            
            <Button
              className="flex-1 h-12 rounded-2xl gap-2"
              onClick={handleNext}
              disabled={saving}
            >
              {saving ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === 3 ? (
                <>
                  <Check className="h-5 w-5" />
                  {language === 'pt' ? 'Começar' : 'Start'}
                </>
              ) : (
                <>
                  {language === 'pt' ? 'Continuar' : 'Continue'}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
