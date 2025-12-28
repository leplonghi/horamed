import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Pill, 
  FileText, 
  Users, 
  Sparkles,
  ArrowRight,
  Check
} from "lucide-react";
import logo from "@/assets/horamed-logo-transparent.png";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickOnboardingProps {
  onComplete?: () => void;
}

export default function QuickOnboarding({ onComplete }: QuickOnboardingProps) {
  const navigate = useNavigate();
  const { triggerLight, triggerSuccess } = useHapticFeedback();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const goals = [
    { 
      id: "medications", 
      icon: Pill, 
      title: t('quickOnboarding.rememberMeds'), 
      desc: t('quickOnboarding.neverForget'),
      color: "bg-blue-500/10 text-blue-500"
    },
    { 
      id: "documents", 
      icon: FileText, 
      title: t('quickOnboarding.organizeDocs'), 
      desc: t('quickOnboarding.prescExamsVax'),
      color: "bg-green-500/10 text-green-500"
    },
    { 
      id: "family", 
      icon: Users, 
      title: t('quickOnboarding.careFamily'), 
      desc: t('quickOnboarding.manageAll'),
      color: "bg-purple-500/10 text-purple-500"
    },
    { 
      id: "all", 
      icon: Sparkles, 
      title: t('quickOnboarding.allThis'), 
      desc: t('quickOnboarding.fullPackage'),
      color: "bg-primary/10 text-primary"
    },
  ];

  const handleGoalSelect = (goalId: string) => {
    triggerLight();
    setSelectedGoal(goalId);
    
    // Auto-advance after selection
    setTimeout(() => {
      setStep(1);
    }, 300);
  };

  const handleComplete = async () => {
    try {
      triggerSuccess();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from("profiles")
          .update({
            tutorial_flags: {
              quickOnboarding: true,
              selectedGoal,
              completedAt: new Date().toISOString(),
            },
            onboarding_completed: true,
          })
          .eq("user_id", user.id);
      }

      if (onComplete) {
        onComplete();
      } else {
        // Route based on goal
        if (selectedGoal === "medications" || selectedGoal === "all") {
          navigate("/adicionar");
        } else if (selectedGoal === "documents") {
          navigate("/cofre/upload");
        } else {
          navigate("/hoje");
        }
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      navigate("/hoje");
    }
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
      navigate("/hoje");
    } catch (error) {
      navigate("/hoje");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <img src={logo} alt="HoraMed" width={68} height={64} className="h-16 w-auto mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">
                  {t('quickOnboarding.whatFirst')}
                </h1>
                <p className="text-muted-foreground">
                  {t('quickOnboarding.chooseOption')}
                </p>
              </div>

              {/* Goals Grid */}
              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <motion.button
                    key={goal.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoalSelect(goal.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedGoal === goal.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${goal.color} flex items-center justify-center mb-3`}>
                      <goal.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{goal.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{goal.desc}</p>
                  </motion.button>
                ))}
              </div>

              {/* Skip */}
              <button
                onClick={handleSkip}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('quickOnboarding.skipExplore')}
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="p-8 text-center space-y-6">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto"
                >
                  <Check className="w-8 h-8 text-primary-foreground" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {t('quickOnboarding.allReady')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('quickOnboarding.accountConfigured')}
                  </p>
                </div>

                {/* Features List */}
                <div className="text-left space-y-3">
                  {[
                    t('quickOnboarding.7daysFree'),
                    t('quickOnboarding.unlimitedReminders'),
                    t('quickOnboarding.digitalWallet'),
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="w-full h-14 text-lg font-semibold"
                >
                  {selectedGoal === "documents" ? t('quickOnboarding.sendDocument') : t('quickOnboarding.addMedication')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <button
                  onClick={() => navigate("/hoje")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('quickOnboarding.exploreFirst')}
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}