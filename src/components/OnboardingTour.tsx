import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface OnboardingStep {
  titleKey: string;
  descriptionKey: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { t } = useLanguage();

  const steps: OnboardingStep[] = [
    {
      titleKey: 'tour.welcome',
      descriptionKey: 'tour.welcomeDesc',
    },
    {
      titleKey: 'tour.todayTitle',
      descriptionKey: 'tour.todayDesc',
      action: () => window.location.href = "/hoje",
    },
    {
      titleKey: 'tour.routineTitle',
      descriptionKey: 'tour.routineDesc',
      action: () => window.location.href = "/rotina",
    },
    {
      titleKey: 'tour.progressTitle',
      descriptionKey: 'tour.progressDesc',
      action: () => window.location.href = "/progresso",
    },
    {
      titleKey: 'tour.walletTitle',
      descriptionKey: 'tour.walletDesc',
      action: () => window.location.href = "/carteira",
    },
    {
      titleKey: 'tour.readyTitle',
      descriptionKey: 'tour.readyDesc',
    },
  ];

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
            {t('tour.step')} {currentStep + 1} {t('tour.of')} {steps.length}
          </div>

          {/* Content */}
          <div className="space-y-3 py-4">
            <h2 className="text-2xl font-bold text-center">{t(step.titleKey)}</h2>
            <p className="text-muted-foreground text-center leading-relaxed">
              {t(step.descriptionKey)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              {t('tour.skipTutorial')}
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
                    {t('tour.start')}
                  </>
                ) : (
                  <>
                    {t('tour.next')}
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
