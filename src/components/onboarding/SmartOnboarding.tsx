import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OnboardingWelcome from "./OnboardingWelcome";
import OnboardingStep1 from "./OnboardingStep1";
import OnboardingStep2 from "./OnboardingStep2";
import OnboardingStep3 from "./OnboardingStep3";
import OnboardingStep4 from "./OnboardingStep4";
import OnboardingDemo from "./OnboardingDemo";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useLanguage } from "@/contexts/LanguageContext";

interface OnboardingData {
  userType: string;
  medicationCount: string;
  mainConcern: string;
}

export default function SmartOnboarding() {
  const navigate = useNavigate();
  const { triggerLight, triggerSuccess } = useHapticFeedback();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0); // Start at welcome screen
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
    if (currentStep < 4) {
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

      // Save to profiles.tutorial_flags
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

      // Mark as completed but don't save preferences
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

  const handleShowDemo = () => {
    setShowDemo(true);
  };

  const handleDemoComplete = async () => {
    await savePreferences();
    navigate("/hoje");
  };

  const canProceed = () => {
    if (currentStep === 0) return true; // Welcome screen
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
        {/* Progress bar - hide on welcome and final steps */}
        {currentStep > 0 && currentStep < 4 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('smartOnboarding.step')} {currentStep} {t('smartOnboarding.of')} 3</span>
              <span>{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <Progress value={(currentStep / 3) * 100} className="h-2" />
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
              <OnboardingStep4
                onComplete={handleComplete}
                onShowDemo={handleShowDemo}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons - hide on welcome and step 4 */}
        {currentStep > 0 && currentStep < 4 && (
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

        {/* Step indicators - hide on welcome screen */}
        {currentStep > 0 && (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((step) => (
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