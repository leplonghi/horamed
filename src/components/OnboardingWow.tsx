import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Check, Sparkles, ArrowRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MicroCelebration from "@/components/celebrations/MicroCelebration";

// Quick time suggestions for faster selection
const QUICK_TIMES = [
  { label: "Manhã", time: "08:00", icon: "🌅" },
  { label: "Almoço", time: "12:00", icon: "☀️" },
  { label: "Noite", time: "20:00", icon: "🌙" },
];

export default function OnboardingWow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [itemName, setItemName] = useState("");
  const [doseTime, setDoseTime] = useState("08:00");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Auto-focus input on step 1
  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => setInputFocused(true), 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleQuickAdd = async () => {
    if (!user || !itemName.trim()) {
      toast.error('Digite o nome do medicamento');
      return;
    }

    setLoading(true);

    try {
      // Create item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          name: itemName,
          category: 'medicamento',
          is_active: true
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Create schedule
      const { error: scheduleError } = await supabase
        .from('schedules')
        .insert({
          item_id: item.id,
          freq_type: 'daily',
          times: [doseTime]
        });

      if (scheduleError) throw scheduleError;

      // Show celebration
      setShowCelebration(true);
      
      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      // Navigate after celebration
      setTimeout(() => {
        toast.success('Pronto! Seu primeiro lembrete foi criado 🎉');
        navigate('/hoje');
      }, 1500);
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Erro ao criar lembrete');
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);
    }
    navigate('/hoje');
  };

  return (
    <>
      <MicroCelebration 
        type="perfect_day" 
        trigger={showCelebration} 
        message="Primeiro lembrete criado!"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Header - Simplified */}
                <div className="text-center space-y-3">
                  <motion.div 
                    className="inline-flex p-4 bg-primary/10 rounded-2xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                  >
                    <Pill className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h1 className="text-2xl font-bold">Qual é seu medicamento?</h1>
                  <p className="text-sm text-muted-foreground">
                    Comece com um. Você pode adicionar mais depois.
                  </p>
                </div>

                {/* Single input - ultra simple */}
                <div className="space-y-4">
                  <Input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Ex: Losartana, Metformina..."
                    className="h-14 text-lg text-center"
                    autoFocus={inputFocused}
                    onKeyDown={(e) => e.key === 'Enter' && itemName.trim() && setStep(2)}
                  />

                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!itemName.trim()}
                    className="w-full h-12 text-base gap-2"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={handleSkip}
                    className="w-full text-muted-foreground"
                  >
                    Pular por agora
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 bg-primary/10 rounded-xl">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Quando tomar {itemName}?</h2>
                  <p className="text-sm text-muted-foreground">Escolha um horário</p>
                </div>

                {/* Quick time buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_TIMES.map(({ label, time, icon }) => (
                    <Button
                      key={time}
                      variant={doseTime === time ? "default" : "outline"}
                      onClick={() => setDoseTime(time)}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs">{label}</span>
                      <span className="text-xs opacity-70">{time}</span>
                    </Button>
                  ))}
                </div>

                {/* Custom time */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">ou escolha</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Input
                  type="time"
                  value={doseTime}
                  onChange={(e) => setDoseTime(e.target.value)}
                  className="h-12 text-center text-lg"
                />

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)} 
                    className="flex-1 h-12"
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleQuickAdd} 
                    disabled={loading} 
                    className="flex-1 h-12 gap-2"
                  >
                    {loading ? (
                      "Criando..."
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Criar lembrete
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-primary'
                    : s < step
                    ? 'w-4 bg-primary/50'
                    : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
