import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Navigation, Pill, MessageCircle, ChevronRight, Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface VoiceOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const steps = [
  {
    icon: Mic,
    titlePt: "Controle por Voz",
    titleEn: "Voice Control",
    descPt: "Use sua voz para controlar o app! Toque no microfone e fale o que deseja fazer.",
    descEn: "Use your voice to control the app! Tap the microphone and say what you want to do.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Navigation,
    titlePt: "Navegue Facilmente",
    titleEn: "Navigate Easily",
    descPt: "Diga 'Ir para hoje', 'Abrir rotina' ou 'Ver perfil' para navegar pelo app sem tocar na tela.",
    descEn: "Say 'Go to today', 'Open routine' or 'View profile' to navigate the app hands-free.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Pill,
    titlePt: "Gerencie Medicamentos",
    titleEn: "Manage Medications",
    descPt: "Adicione medicamentos, marque doses e controle seu estoque apenas com comandos de voz.",
    descEn: "Add medications, mark doses and control your stock just with voice commands.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: MessageCircle,
    titlePt: "Converse com a Clara",
    titleEn: "Talk to Clara",
    descPt: "Pergunte qualquer coisa sobre seus medicamentos ou saúde. A Clara está sempre pronta para ajudar!",
    descEn: "Ask anything about your medications or health. Clara is always ready to help!",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

export default function VoiceOnboardingModal({ open, onOpenChange, onComplete }: VoiceOnboardingModalProps) {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tutorial_flags")
          .eq("user_id", user.id)
          .single();

        const currentFlags = (profile?.tutorial_flags as Record<string, boolean>) || {};
        const newFlags = { ...currentFlags, voice_onboarding_completed: true };

        await supabase
          .from("profiles")
          .update({ tutorial_flags: newFlags })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("Error saving voice onboarding status:", error);
    }

    onComplete?.();
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative">
          {/* Gradient header */}
          <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className={`h-20 w-20 rounded-full ${step.bgColor} flex items-center justify-center`}
              >
                <Icon className={`h-10 w-10 ${step.color}`} />
              </motion.div>
            </div>

            {/* Decorative elements */}
            <Sparkles className="absolute top-4 right-8 h-5 w-5 text-primary/30" />
            <Sparkles className="absolute bottom-6 left-6 h-4 w-4 text-primary/20" />
          </div>

          {/* Step indicators */}
          <div className="absolute top-4 left-4 flex gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep 
                    ? "w-6 bg-primary" 
                    : idx < currentStep 
                      ? "w-1.5 bg-primary/50" 
                      : "w-1.5 bg-primary/20"
                }`}
              />
            ))}
          </div>

          {/* Skip button */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {language === 'pt' ? 'Pular' : 'Skip'}
            </button>
          )}
        </div>

        <div className="p-6 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl text-center">
                  {language === 'pt' ? step.titlePt : step.titleEn}
                </DialogTitle>
              </DialogHeader>

              <p className="text-center text-muted-foreground mb-6">
                {language === 'pt' ? step.descPt : step.descEn}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1"
              >
                {language === 'pt' ? 'Voltar' : 'Back'}
              </Button>
            )}
            <Button 
              onClick={handleNext}
              className="flex-1 gap-2"
            >
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4" />
                  {language === 'pt' ? 'Começar!' : 'Start!'}
                </>
              ) : (
                <>
                  {language === 'pt' ? 'Próximo' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
