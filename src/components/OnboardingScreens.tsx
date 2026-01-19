import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const screens = [
  {
    emoji: "🤯",
    title: "Esquecer remédios e perder receitas é um caos.",
    subtitle: "O HoraMed resolve isso pra você.",
    description: "Nunca mais se preocupe em esquecer seus medicamentos ou perder documentos importantes."
  },
  {
    emoji: "💙",
    title: "Nós lembramos seus medicamentos",
    subtitle: "Organizamos seus documentos",
    description: "E ajudamos você a cuidar da sua família com tranquilidade e segurança."
  },
  {
    emoji: "🎉",
    title: "Cadastre seus remédios, marque quando tomar",
    subtitle: "E guarde seus exames",
    description: "O resto é com a gente. Simples, rápido e eficaz."
  }
];

export default function OnboardingScreens() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkOnboardingStatus();
  }, [location.pathname]);

  const checkOnboardingStatus = async () => {
    // Don't show on auth or index pages
    if (location.pathname === "/auth" || location.pathname === "/") {
      setIsChecking(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      // Redirect to SimpleOnboarding if not completed
      if (!profile?.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
    setShowOnboarding(false);
    // Keep user on current page instead of redirecting
  };

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleComplete();
    }
  };

  if (isChecking || !showOnboarding) return null;

  const screen = screens[currentScreen];
  const progress = ((currentScreen + 1) / screens.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8 space-y-6">
          {/* Progress bar */}
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="text-center space-y-4 py-8">
            <div className="text-6xl mb-4">{screen.emoji}</div>
            <h2 className="text-2xl font-bold leading-tight">
              {screen.title}
            </h2>
            <p className="text-lg font-medium text-primary">
              {screen.subtitle}
            </p>
            <p className="text-muted-foreground">
              {screen.description}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleNext} 
              className="w-full gap-2"
              size="lg"
            >
              {currentScreen === screens.length - 1 ? (
                <>
                  <Check className="h-5 w-5" />
                  Começar
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            {currentScreen < screens.length - 1 && (
              <Button
                variant="ghost"
                onClick={handleComplete}
                className="w-full"
              >
                Pular
              </Button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-2">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentScreen 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
