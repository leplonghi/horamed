import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles, Home, Pill, FileText, User, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Home;
  highlight?: string; // CSS selector for element to highlight
  position: "center" | "bottom" | "top";
}

interface GuidedTourProps {
  onComplete?: () => void;
}

export default function GuidedTour({ onComplete }: GuidedTourProps) {
  const { t, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: language === 'pt' ? "Bem-vindo ao HoraMed! 👋" : "Welcome to HoraMed! 👋",
      description: language === 'pt' 
        ? "Vamos fazer um tour rápido para você conhecer as principais funcionalidades do app."
        : "Let's take a quick tour to show you the main features of the app.",
      icon: Sparkles,
      position: "center",
    },
    {
      id: "today",
      title: language === 'pt' ? "Tela Hoje" : "Today Screen",
      description: language === 'pt'
        ? "Aqui você vê suas doses do dia, pode marcar como tomadas ou pular. O progresso é atualizado em tempo real."
        : "Here you can see your daily doses, mark them as taken or skip. Progress updates in real-time.",
      icon: Home,
      highlight: "[data-tour='today-progress']",
      position: "top",
    },
    {
      id: "medications",
      title: language === 'pt' ? "Rotina" : "Routine",
      description: language === 'pt'
        ? "Gerencie todos os seus medicamentos, vitaminas e suplementos. Veja o estoque e configure horários."
        : "Manage all your medications, vitamins and supplements. Check stock and set schedules.",
      icon: Pill,
      position: "bottom",
    },
    {
      id: "cofre",
      title: language === 'pt' ? "Carteira de Saúde" : "Health Wallet",
      description: language === 'pt'
        ? "Guarde receitas, exames e documentos de saúde. Tire fotos e extraímos os dados automaticamente!"
        : "Store prescriptions, exams and health documents. Take photos and we extract data automatically!",
      icon: FileText,
      position: "bottom",
    },
    {
      id: "clara",
      title: language === 'pt' ? "Conheça a Clara 💜" : "Meet Clara 💜",
      description: language === 'pt'
        ? "Sua assistente de saúde com IA! Tire dúvidas sobre medicamentos, peça ajuda para organizar sua rotina."
        : "Your AI health assistant! Ask questions about medications, get help organizing your routine.",
      icon: Heart,
      position: "center",
    },
    {
      id: "profile",
      title: language === 'pt' ? "Perfil" : "Profile",
      description: language === 'pt'
        ? "Configure notificações, gerencie perfis da família e personalize sua experiência."
        : "Set up notifications, manage family profiles and personalize your experience.",
      icon: User,
      position: "bottom",
    },
  ];

  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      if (profile?.tutorial_flags) {
        const flags = profile.tutorial_flags as Record<string, boolean>;
        if (!flags["guided_tour_completed"]) {
          setHasSeenTour(false);
          // Delay to let page load first
          setTimeout(() => setIsVisible(true), 1500);
        }
      } else {
        setHasSeenTour(false);
        setTimeout(() => setIsVisible(true), 1500);
      }
    } catch (error) {
      console.error("Error checking tour status:", error);
    }
  };

  const completeTour = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const currentFlags = (profile?.tutorial_flags as Record<string, boolean>) || {};
      const newFlags = { ...currentFlags, guided_tour_completed: true };

      await supabase
        .from("profiles")
        .update({ tutorial_flags: newFlags })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error completing tour:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsVisible(false);
    await completeTour();
    onComplete?.();
  };

  const handleSkip = async () => {
    setIsVisible(false);
    await completeTour();
    onComplete?.();
  };

  if (!isVisible || hasSeenTour) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        {/* Tour Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "relative z-10 w-full max-w-sm",
            step.position === "bottom" && "self-end mb-24",
            step.position === "top" && "self-start mt-20"
          )}
        >
          <Card className="border-primary/20 shadow-2xl overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <CardContent className="p-6">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-60 hover:opacity-100"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Icon */}
              <motion.div
                key={step.id}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <Icon className="w-8 h-8 text-primary" />
              </motion.div>

              {/* Content */}
              <motion.div
                key={`content-${step.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center space-y-2 mb-6"
              >
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              {/* Step indicators */}
              <div className="flex justify-center gap-1.5 mb-6">
                {tourSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      idx === currentStep 
                        ? "bg-primary w-6" 
                        : idx < currentStep 
                          ? "bg-primary/50" 
                          : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {language === 'pt' ? 'Anterior' : 'Previous'}
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className={cn("flex-1", currentStep === 0 && "w-full")}
                >
                  {currentStep === tourSteps.length - 1 ? (
                    language === 'pt' ? 'Começar!' : 'Get Started!'
                  ) : (
                    <>
                      {language === 'pt' ? 'Próximo' : 'Next'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Skip option */}
              {currentStep < tourSteps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === 'pt' ? 'Pular tour' : 'Skip tour'}
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
