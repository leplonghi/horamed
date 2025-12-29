import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import OnboardingWelcome from "./OnboardingWelcome";
import OnboardingStep1 from "./OnboardingStep1";
import OnboardingStep2 from "./OnboardingStep2";
import OnboardingStep3 from "./OnboardingStep3";
import OnboardingStepNotifications from "./OnboardingStepNotifications";
import OnboardingStep4 from "./OnboardingStep4";
import OnboardingDemo from "./OnboardingDemo";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useLanguage } from "@/contexts/LanguageContext";

interface OnboardingData {
  userType: string;
  medicationCount: string;
  mainConcern: string;
}

const TOTAL_STEPS = 5; // Welcome(0), Step1(1), Step2(2), Step3(3), Notifications(4), Final(5)

export default function SmartOnboarding() {
  const navigate = useNavigate();
  const { triggerLight, triggerSuccess } = useHapticFeedback();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    userType: "",
    medicationCount: "",
    mainConcern: "",
  });

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    triggerLight();
    
    // Auto-advance for steps 1-3 after 300ms
    if (currentStep >= 1 && currentStep <= 3) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      triggerLight();
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      triggerLight();
      setCurrentStep(currentStep - 1);
    }
  };

  const savePreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          tutorial_flags: {
            userType: data.userType,
            medicationCount: data.medicationCount,
            mainConcern: data.mainConcern,
            completedAt: new Date().toISOString(),
          },
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      triggerSuccess();
    } catch (error) {
      console.error("Error saving onboarding preferences:", error);
    }
  };

  const handleComplete = async () => {
    await savePreferences();
    navigate("/hoje");
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      navigate("/hoje");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      navigate("/hoje");
    }
  };

  const handleNotificationsComplete = () => {
    triggerSuccess();
    setCurrentStep(TOTAL_STEPS); // Go to final step
  };

  const handleNotificationsSkip = () => {
    setCurrentStep(TOTAL_STEPS); // Go to final step
  };

  const handleShowDemo = () => {
    setShowDemo(true);
  };

  const handleDemoComplete = async () => {
    await savePreferences();
    navigate("/hoje");
  };

  const canProceed = () => {
    if (currentStep === 0) return true;
    switch (currentStep) {
      case 1:
        return !!data.userType;
      case 2:
        return !!data.medicationCount;
      case 3:
        return !!data.mainConcern;
      default:
        return true;
    }
  };

  // Calculate progress (excluding welcome and notifications steps)
  const progressSteps = 3; // Steps 1, 2, 3
  const progressValue = currentStep > 0 && currentStep <= 3 
    ? (currentStep / progressSteps) * 100 
    : currentStep > 3 ? 100 : 0;

  if (showDemo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <OnboardingDemo onComplete={handleDemoComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Progress bar - show only for steps 1-3 */}
        {currentStep > 0 && currentStep <= 3 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('smartOnboarding.step')} {currentStep} {t('smartOnboarding.of')} {progressSteps}</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <OnboardingWelcome onStart={handleNext} onSkip={handleSkip} />
            )}
            {currentStep === 1 && (
              <OnboardingStep1
                value={data.userType}
                onChange={(value) => updateData("userType", value)}
              />
            )}
            {currentStep === 2 && (
              <OnboardingStep2
                value={data.medicationCount}
                onChange={(value) => updateData("medicationCount", value)}
              />
            )}
            {currentStep === 3 && (
              <OnboardingStep3
                value={data.mainConcern}
                onChange={(value) => updateData("mainConcern", value)}
              />
            )}
            {currentStep === 4 && (
              <OnboardingStepNotifications
                onComplete={handleNotificationsComplete}
                onSkip={handleNotificationsSkip}
              />
            )}
            {currentStep === 5 && (
              <OnboardingStep4
                onComplete={handleComplete}
                onShowDemo={handleShowDemo}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons - hide on welcome, notifications, and final steps */}
        {currentStep > 0 && currentStep <= 3 && (
          <div className="flex gap-4">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                {t('smartOnboarding.back')}
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              {t('smartOnboarding.next')}
            </Button>
          </div>
        )}

        {/* Step indicators */}
        {currentStep > 0 && (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step === currentStep
                    ? "w-8 bg-primary"
                    : step < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
