import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingWelcome from "@/components/onboarding/OnboardingWelcome";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          tutorial_flags: { onboarding_completed: true },
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Bem-vindo ao HoraMed!");
      navigate("/hoje");
    } catch (error) {
      console.error("Error saving onboarding:", error);
      toast.error("Erro ao completar configuração");
    }
  };

  const handleSkip = () => {
    navigate("/hoje");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <OnboardingWelcome onStart={handleStart} onSkip={handleSkip} />
      </div>
    </div>
  );
}
