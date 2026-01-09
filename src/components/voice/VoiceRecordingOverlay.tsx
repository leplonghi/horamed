import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import VoiceCommandsSheet from "./VoiceCommandsSheet";

interface VoiceRecordingOverlayProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  feedbackText: string;
  showFeedback: boolean;
  onStopRecording: () => void;
  onDismissFeedback: () => void;
}

const suggestions = [
  { pt: "Adicionar Paracetamol", en: "Add Paracetamol" },
  { pt: "Tomei minha dose", en: "I took my dose" },
  { pt: "Ir para estoque", en: "Go to stock" },
  { pt: "Abrir agenda", en: "Open agenda" },
];

export default function VoiceRecordingOverlay({
  isRecording,
  isProcessing,
  isSpeaking,
  feedbackText,
  showFeedback,
  onStopRecording,
  onDismissFeedback,
}: VoiceRecordingOverlayProps) {
  const { language } = useLanguage();
  const [showCommands, setShowCommands] = useState(false);

  return (
    <>
      {/* Recording overlay with sound wave visualization */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-t from-destructive/20 via-transparent to-transparent" />
            
            {/* Sound waves animation */}
            <div className="absolute bottom-36 left-0 right-0 flex justify-center items-end gap-1">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-destructive/60 rounded-full"
                  animate={{
                    height: [8, Math.random() * 40 + 20, 8],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Recording info bubble */}
            <div className="absolute bottom-44 left-0 right-0 text-center pointer-events-auto">
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.9 }}
                className="inline-block"
              >
                <div className="bg-background/95 backdrop-blur-xl border border-destructive/30 rounded-2xl px-5 py-4 shadow-2xl max-w-xs mx-4">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {language === 'pt' ? 'Ouvindo...' : 'Listening...'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowCommands(true)}
                    >
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground text-center">
                      {language === 'pt' ? 'Experimente dizer:' : 'Try saying:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {suggestions.slice(0, 2).map((s, i) => (
                        <span
                          key={i}
                          className="text-xs bg-muted/80 text-muted-foreground px-2 py-1 rounded-full"
                        >
                          "{language === 'pt' ? s.pt : s.en}"
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-3"
                    onClick={onStopRecording}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {language === 'pt' ? 'Parar' : 'Stop'}
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent" />
            <div className="absolute bottom-44 left-0 right-0 text-center">
              <div className="inline-block bg-background/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl px-6 py-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {language === 'pt' ? 'Processando...' : 'Processing...'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback overlay */}
      <AnimatePresence>
        {showFeedback && !isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-36 left-4 right-4 z-[60] pointer-events-auto"
          >
            <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-2xl mx-auto max-w-sm">
              <div className="flex items-start gap-3">
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Volume2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  </motion.div>
                )}
                <p className="text-sm text-foreground flex-1">{feedbackText}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={onDismissFeedback}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commands sheet */}
      <VoiceCommandsSheet open={showCommands} onOpenChange={setShowCommands} />
    </>
  );
}
