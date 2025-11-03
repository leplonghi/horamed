import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStep {
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

const steps: OnboardingStep[] = [
  {
    title: "Bem-vindo ao HoraMed! 👋",
    description: "Vamos fazer um tour rápido para você conhecer o aplicativo e começar a organizar seus medicamentos.",
  },
  {
    title: "Adicione seu primeiro medicamento",
    description: "Clique no botão + flutuante ou no botão 'Adicionar' para cadastrar medicamentos. Você pode fazer manualmente ou tirar foto da caixa/receita!",
    target: "fab-button",
  },
  {
    title: "Página Hoje",
    description: "Aqui você vê suas doses do dia, pode confirmar quando tomar, adiar por 15 minutos ou pular. Acompanhe seu progresso diário!",
    action: () => window.location.href = "/hoje",
  },
  {
    title: "Seus Medicamentos",
    description: "Gerencie todos os seus medicamentos aqui. Edite horários, doses, ou exclua quando não precisar mais.",
    action: () => window.location.href = "/medicamentos",
  },
  {
    title: "Cofre de Saúde",
    description: "Guarde seus documentos médicos, exames e receitas com segurança. Compartilhe facilmente com médicos quando precisar!",
    action: () => window.location.href = "/cofre",
  },
  {
    title: "Está pronto! 🎉",
    description: "Comece adicionando seus medicamentos. Se precisar de ajuda, visite a página 'Ajuda' no menu Mais.",
  },
];

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has completed onboarding
      const onboardingKey = `onboarding_completed_${user.id}`;
      const completed = localStorage.getItem(onboardingKey);
      
      if (!completed) {
        // Check if user has any medications
        const { data: items } = await supabase
          .from("items")
          .select("id")
          .limit(1);
        
        // Show onboarding if no medications
        if (!items || items.length === 0) {
          setIsVisible(true);
        }
      }
      
      setHasCompletedOnboarding(!!completed);
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const handleNext = () => {
    if (steps[currentStep].action) {
      steps[currentStep].action!();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`onboarding_completed_${user.id}`, "true");
      }
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-primary/20">
        <CardContent className="p-6 space-y-4">
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step indicator */}
          <div className="text-sm text-muted-foreground text-center">
            Passo {currentStep + 1} de {steps.length}
          </div>

          {/* Content */}
          <div className="space-y-3 py-4">
            <h2 className="text-2xl font-bold text-center">{step.title}</h2>
            <p className="text-muted-foreground text-center leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Pular tutorial
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="icon"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <Button onClick={handleNext} className="min-w-24">
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Começar
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
