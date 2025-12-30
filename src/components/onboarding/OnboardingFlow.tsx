import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { trackNotificationEvent, NotificationEvents } from "@/hooks/useNotificationMetrics";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";

// Step components
import OnboardingWelcomeNew from "./steps/OnboardingWelcomeNew";
import OnboardingHowItWorks from "./steps/OnboardingHowItWorks";
import OnboardingFirstItem from "./steps/OnboardingFirstItem";
import OnboardingSetTime from "./steps/OnboardingSetTime";
import OnboardingPermissions from "./steps/OnboardingPermissions";
import OnboardingWaiting from "./steps/OnboardingWaiting";
import OnboardingFirstDose from "./steps/OnboardingFirstDose";
import OnboardingCelebration from "./steps/OnboardingCelebration";
import OnboardingClara from "./steps/OnboardingClara";

const TOTAL_STEPS = 9;

export interface OnboardingData {
  itemName: string;
  scheduledTime: Date;
  doseId: string | null;
  itemId: string | null;
  notificationPermission: boolean;
}

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { triggerLight, triggerSuccess, triggerHeavy } = useHapticFeedback();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    itemName: "",
    scheduledTime: new Date(Date.now() + 2 * 60 * 1000), // +2 minutes
    doseId: null,
    itemId: null,
    notificationPermission: false,
  });

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      triggerLight();
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, triggerLight]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      triggerLight();
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, triggerLight]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const createFirstItem = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create the item
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          name: data.itemName,
          dose_text: "1 dose",
          is_active: true,
          category: "medicamento",
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Create schedule
      const timeString = data.scheduledTime.toTimeString().slice(0, 5);
      const { error: scheduleError } = await supabase
        .from("schedules")
        .insert({
          item_id: item.id,
          freq_type: "daily",
          times: [timeString],
          is_active: true,
        });

      if (scheduleError) throw scheduleError;

      // Create dose instance for today
      const { data: doseInstance, error: doseError } = await supabase
        .from("dose_instances")
        .insert({
          item_id: item.id,
          schedule_id: item.id, // Will be updated
          due_at: data.scheduledTime.toISOString(),
          status: "scheduled",
        })
        .select()
        .single();

      if (doseError) throw doseError;

      updateData({ 
        itemId: item.id, 
        doseId: doseInstance.id 
      });

      // Schedule notification via edge function
      await supabase.functions.invoke("schedule-dose-notifications", {
        body: { 
          dose_id: doseInstance.id, 
          mode: "single" 
        },
      });

      // Track first notification scheduled
      await trackNotificationEvent(NotificationEvents.FIRST_NOTIFICATION_SENT, {
        item_name: data.itemName,
        scheduled_at: data.scheduledTime.toISOString(),
      });

      // Schedule local notification as backup
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 100000),
            title: "🔔 Hora do remédio!",
            body: `${data.itemName} - 1 dose`,
            schedule: { at: data.scheduledTime },
            sound: "notification.wav",
            actionTypeId: "DOSE_ACTIONS",
          }],
        });
      }

      return true;
    } catch (error) {
      console.error("Error creating first item:", error);
      toast.error("Erro ao criar medicamento. Tente novamente.");
      return false;
    }
  };

  const handleDoseTaken = async () => {
    if (!data.doseId) return;

    try {
      await supabase
        .from("dose_instances")
        .update({ 
          status: "taken", 
          taken_at: new Date().toISOString() 
        })
        .eq("id", data.doseId);

      triggerSuccess();

      // Track event
      await supabase.from("app_metrics").insert({
        event_name: "first_dose_confirmed",
        event_data: { onboarding: true },
      });

      handleNext();
    } catch (error) {
      console.error("Error marking dose:", error);
    }
  };

  const handleDoseSnooze = async () => {
    if (!data.doseId) return;

    const newTime = new Date(Date.now() + 10 * 60 * 1000);
    
    await supabase
      .from("dose_instances")
      .update({ 
        due_at: newTime.toISOString(),
        delay_minutes: 10,
      })
      .eq("id", data.doseId);

    updateData({ scheduledTime: newTime });
    toast.info("Lembrete adiado em 10 minutos");
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          tutorial_flags: {
            flow_v2: true,
            completedAt: new Date().toISOString(),
            firstItem: data.itemName,
          },
        })
        .eq("user_id", user.id);

      // Track completion
      await supabase.from("app_metrics").insert({
        event_name: "onboarding_completed",
        event_data: { 
          version: "v2_flow",
          item_created: !!data.itemId,
        },
      });

      triggerHeavy();
      navigate("/hoje");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      navigate("/hoje");
    }
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
    } catch {
      navigate("/hoje");
    }
  };

  // Track onboarding started
  useEffect(() => {
    supabase.from("app_metrics").insert({
      event_name: "onboarding_started",
      event_data: { version: "v2_flow" },
    });
  }, []);

  const progressValue = currentStep > 0 ? (currentStep / (TOTAL_STEPS - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar - show from step 2 onwards */}
      {currentStep >= 2 && currentStep < TOTAL_STEPS - 1 && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Progress value={progressValue} className="h-1.5" />
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <OnboardingWelcomeNew onNext={handleNext} onSkip={handleSkip} />
              )}
              {currentStep === 1 && (
                <OnboardingHowItWorks onNext={handleNext} onBack={handleBack} />
              )}
              {currentStep === 2 && (
                <OnboardingFirstItem
                  value={data.itemName}
                  onChange={(name) => updateData({ itemName: name })}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <OnboardingSetTime
                  value={data.scheduledTime}
                  onChange={(time) => updateData({ scheduledTime: time })}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 4 && (
                <OnboardingPermissions
                  onGranted={() => {
                    updateData({ notificationPermission: true });
                    handleNext();
                  }}
                  onSkip={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 5 && (
                <OnboardingWaiting
                  scheduledTime={data.scheduledTime}
                  itemName={data.itemName}
                  onCreateItem={createFirstItem}
                  onNotificationReceived={handleNext}
                />
              )}
              {currentStep === 6 && (
                <OnboardingFirstDose
                  itemName={data.itemName}
                  onTaken={handleDoseTaken}
                  onSnooze={handleDoseSnooze}
                />
              )}
              {currentStep === 7 && (
                <OnboardingCelebration onNext={handleNext} />
              )}
              {currentStep === 8 && (
                <OnboardingClara onComplete={completeOnboarding} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
