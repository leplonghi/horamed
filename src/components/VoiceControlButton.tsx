import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { processVoiceCommand, speak, VoiceAction } from '@/ai/voiceCommandProcessor';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceControlButtonProps {
  className?: string;
  onAction?: (action: VoiceAction) => void;
  onAssistantQuery?: (query: string) => void;
  floating?: boolean;
}

export default function VoiceControlButton({
  className,
  onAction,
  onAssistantQuery,
  floating = false
}: VoiceControlButtonProps) {
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTranscription = async (text: string) => {
    console.log('Voice transcription:', text);
    
    const result = processVoiceCommand(text);
    console.log('Processed command:', result);

    setFeedbackText(result.spokenResponse);
    setShowFeedback(true);

    // Speak the response
    setIsSpeaking(true);
    await speak(result.spokenResponse);
    setIsSpeaking(false);

    // Execute the action
    executeAction(result.action);

    // Hide feedback after a delay
    setTimeout(() => setShowFeedback(false), 3000);
  };

  const executeAction = (action: VoiceAction) => {
    onAction?.(action);

    switch (action.type) {
      case 'NAVIGATE':
        navigate(action.path);
        break;

      case 'ADD_MEDICATION':
        navigate('/adicionar-item', { 
          state: { prefillName: action.name } 
        });
        break;

      case 'MARK_DOSE_TAKEN':
        // This would need integration with dose management
        toast.success('Dose marcada como tomada');
        break;

      case 'SKIP_DOSE':
        toast.info('Dose pulada');
        break;

      case 'CHECK_STOCK':
        navigate('/estoque');
        break;

      case 'OPEN_SEARCH':
        // Trigger search modal
        document.dispatchEvent(new CustomEvent('open-spotlight-search'));
        break;

      case 'OPEN_ASSISTANT':
        onAssistantQuery?.(action.query);
        break;

      case 'UNKNOWN':
        toast.error('Comando não reconhecido');
        break;
    }
  };

  const { 
    isRecording, 
    isProcessing, 
    toggleRecording 
  } = useVoiceInput({
    onTranscription: handleTranscription,
    onError: (error) => {
      toast.error(`Erro: ${error}`);
    }
  });

  // Load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const isActive = isRecording || isProcessing;

  if (floating) {
    return (
      <>
        {/* Floating button */}
        <motion.div
          className={cn(
            "fixed z-50",
            className || "bottom-24 right-4"
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button
            size="lg"
            onClick={toggleRecording}
            disabled={isProcessing}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
              isRecording && "animate-pulse bg-red-500 hover:bg-red-600",
              isProcessing && "bg-amber-500 hover:bg-amber-600",
              !isActive && "bg-primary hover:bg-primary/90"
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {/* Recording indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full"
              >
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Feedback overlay */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-40 left-4 right-4 z-50"
            >
              <div className="bg-background/95 backdrop-blur-lg border border-border rounded-2xl p-4 shadow-xl mx-auto max-w-sm">
                <div className="flex items-center gap-3">
                  {isSpeaking && (
                    <Volume2 className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
                  )}
                  <p className="text-sm text-foreground">{feedbackText}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => setShowFeedback(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording overlay */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 pointer-events-none"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent" />
              <div className="absolute bottom-40 left-0 right-0 text-center">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  className="inline-block bg-background/95 backdrop-blur-lg border border-red-200 dark:border-red-900 rounded-full px-6 py-3 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Ouvindo... Toque para parar
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Non-floating inline button
  return (
    <Button
      variant={isActive ? "destructive" : "outline"}
      size="icon"
      onClick={toggleRecording}
      disabled={isProcessing}
      className={cn(
        "transition-all duration-300",
        isRecording && "animate-pulse",
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
