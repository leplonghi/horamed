import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, X, Mic, Heart, MicOff, Loader2, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { processVoiceCommand, speak, VoiceAction } from "@/ai/voiceCommandProcessor";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import VoiceRecordingOverlay from "./voice/VoiceRecordingOverlay";
import VoiceOnboardingModal from "./voice/VoiceOnboardingModal";
import VoiceCommandsSheet from "./voice/VoiceCommandsSheet";

interface FloatingActionHubProps {
  onOpenAssistant: () => void;
  isAssistantOpen: boolean;
  hasUnreadSuggestion?: boolean;
}

export default function FloatingActionHub({
  onOpenAssistant,
  isAssistantOpen,
  hasUnreadSuggestion = false,
}: FloatingActionHubProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { triggerLight, triggerSuccess, triggerError } = useHapticFeedback();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVoiceOnboarding, setShowVoiceOnboarding] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSeenVoice, setHasSeenVoice] = useState(true);
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Check if user has seen voice onboarding
  useEffect(() => {
    checkVoiceStatus();
  }, []);

  const checkVoiceStatus = async () => {
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
        if (!flags["voice_onboarding_completed"]) {
          setHasSeenVoice(false);
          // Show spotlight after a delay
          setTimeout(() => setShowSpotlight(true), 2000);
        }
      } else {
        setHasSeenVoice(false);
        setTimeout(() => setShowSpotlight(true), 2000);
      }
    } catch (error) {
      console.error("Error checking voice status:", error);
    }
  };

  const handleTranscription = async (text: string) => {
    console.log("Voice transcription:", text);
    
    const result = processVoiceCommand(text);
    console.log("Processed command:", result);

    setFeedbackText(result.spokenResponse);
    setShowFeedback(true);

    setIsSpeaking(true);
    await speak(result.spokenResponse);
    setIsSpeaking(false);

    executeAction(result.action);

    setTimeout(() => setShowFeedback(false), 4000);
  };

  const executeAction = (action: VoiceAction) => {
    switch (action.type) {
      case "NAVIGATE":
        triggerSuccess();
        navigate(action.path);
        break;

      case "ADD_MEDICATION":
        triggerSuccess();
        navigate("/adicionar-item", {
          state: { prefillName: action.name },
        });
        break;

      case "MARK_DOSE_TAKEN":
        triggerSuccess();
        toast.success(language === 'pt' ? "Dose marcada como tomada" : "Dose marked as taken");
        break;

      case "SKIP_DOSE":
        triggerLight();
        toast.info(language === 'pt' ? "Dose pulada" : "Dose skipped");
        break;

      case "CHECK_STOCK":
        triggerSuccess();
        navigate("/estoque");
        break;

      case "OPEN_SEARCH":
        triggerLight();
        document.dispatchEvent(new CustomEvent("open-spotlight-search"));
        break;

      case "OPEN_ASSISTANT":
        triggerLight();
        onOpenAssistant();
        break;

      case "UNKNOWN":
        triggerError();
        toast.error(language === 'pt' ? "Comando não reconhecido" : "Command not recognized");
        break;
    }
  };

  const {
    isRecording,
    isProcessing,
    toggleRecording,
  } = useVoiceInput({
    onTranscription: handleTranscription,
    onError: (error) => {
      triggerError();
      toast.error(`Erro: ${error}`);
    },
  });

  const handleVoiceClick = () => {
    if (!hasSeenVoice) {
      setShowSpotlight(false);
      setShowVoiceOnboarding(true);
      return;
    }
    
    triggerLight();
    toggleRecording();
    setIsExpanded(false);
  };

  const handleClaraClick = () => {
    triggerLight();
    onOpenAssistant();
    setIsExpanded(false);
  };

  const handleToggle = () => {
    triggerLight();
    setIsExpanded(!isExpanded);
  };

  const handleVoiceOnboardingComplete = () => {
    setHasSeenVoice(true);
    // Start recording after onboarding
    toggleRecording();
  };

  // Hide when assistant is open
  if (isAssistantOpen) return null;

  const isActive = isRecording || isProcessing;

  return (
    <>
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50">
        {/* Spotlight for new users */}
        <AnimatePresence>
          {showSpotlight && !hasSeenVoice && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-20 right-0 w-72 mb-2"
            >
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 shadow-xl">
                <div className="absolute -bottom-2 right-8 w-4 h-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-r border-primary/20 transform rotate-45" />
                
                <button
                  onClick={() => setShowSpotlight(false)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {language === 'pt' ? 'Novo! Controle por Voz 🎤' : 'New! Voice Control 🎤'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'pt'
                        ? 'Adicione remédios e navegue usando apenas sua voz. Toque para experimentar!'
                        : 'Add medications and navigate using just your voice. Tap to try!'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded action buttons */}
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Voice button */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.05 }}
                className="absolute bottom-16 right-0"
              >
                <Button
                  onClick={handleVoiceClick}
                  disabled={isProcessing}
                  className={cn(
                    "h-12 gap-2 rounded-full shadow-lg pr-4",
                    isRecording && "bg-destructive hover:bg-destructive/90",
                    isProcessing && "bg-amber-500 hover:bg-amber-600"
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">
                    {language === 'pt' ? 'Falar' : 'Speak'}
                  </span>
                  {!hasSeenVoice && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
                  )}
                </Button>
              </motion.div>

              {/* Clara button */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.1 }}
                className="absolute bottom-32 right-0"
              >
                <Button
                  onClick={handleClaraClick}
                  className="h-12 gap-2 rounded-full shadow-lg pr-4"
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-sm font-medium">Clara</span>
                  {hasUnreadSuggestion && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
                      <Sparkles className="h-2 w-2 text-destructive-foreground" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Help button - optional */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.15 }}
                className="absolute bottom-48 right-0"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommands(true);
                    setIsExpanded(false);
                  }}
                  className="h-10 gap-2 rounded-full shadow-lg pr-4 bg-background"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {language === 'pt' ? 'Comandos' : 'Commands'}
                  </span>
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={isActive ? toggleRecording : handleToggle}
            className={cn(
              "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
              isExpanded && "rotate-45",
              isRecording && "animate-pulse bg-destructive hover:bg-destructive/90",
              isProcessing && "bg-amber-500 hover:bg-amber-600",
              (hasUnreadSuggestion || !hasSeenVoice) && !isExpanded && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : isExpanded ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>

          {/* Notification dot */}
          {(hasUnreadSuggestion || !hasSeenVoice) && !isExpanded && !isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center"
            >
              <Sparkles className="h-2.5 w-2.5 text-destructive-foreground" />
            </motion.div>
          )}
        </motion.div>

        {/* Pulse animation for attention */}
        {(!hasSeenVoice || hasUnreadSuggestion) && !isExpanded && !isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 pointer-events-none"
            animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Voice recording overlay */}
      <VoiceRecordingOverlay
        isRecording={isRecording}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        feedbackText={feedbackText}
        showFeedback={showFeedback}
        onStopRecording={toggleRecording}
        onDismissFeedback={() => setShowFeedback(false)}
      />

      {/* Voice onboarding modal */}
      <VoiceOnboardingModal
        open={showVoiceOnboarding}
        onOpenChange={setShowVoiceOnboarding}
        onComplete={handleVoiceOnboardingComplete}
      />

      {/* Voice commands sheet */}
      <VoiceCommandsSheet open={showCommands} onOpenChange={setShowCommands} />
    </>
  );
}
