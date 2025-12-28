import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type FeedbackType = "success" | "error" | "loading";

interface ActionFeedbackProps {
  type: FeedbackType;
  message?: string;
  isVisible: boolean;
  onComplete?: () => void;
}

export default function ActionFeedback({ 
  type, 
  message, 
  isVisible, 
  onComplete 
}: ActionFeedbackProps) {
  const { language } = useLanguage();

  const defaultMessages: Record<FeedbackType, string> = {
    success: language === 'pt' ? 'Feito!' : 'Done!',
    error: language === 'pt' ? 'Erro' : 'Error',
    loading: language === 'pt' ? 'Processando...' : 'Processing...',
  };

  const icons: Record<FeedbackType, React.ReactNode> = {
    success: <Check className="w-8 h-8 text-white" />,
    error: <X className="w-8 h-8 text-white" />,
    loading: <Loader2 className="w-8 h-8 text-white animate-spin" />,
  };

  const colors: Record<FeedbackType, string> = {
    success: "bg-success",
    error: "bg-destructive",
    loading: "bg-primary",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          onAnimationComplete={() => {
            if (type !== "loading") {
              setTimeout(() => onComplete?.(), 800);
            }
          }}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className={cn(
              "w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl",
              colors[type]
            )}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 15 }}
            >
              {icons[type]}
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-medium text-white"
            >
              {message || defaultMessages[type]}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for easy usage
import { useState, useCallback } from "react";

export function useActionFeedback() {
  const [feedback, setFeedback] = useState<{
    type: FeedbackType;
    message?: string;
    isVisible: boolean;
  }>({ type: "success", isVisible: false });

  const showFeedback = useCallback((type: FeedbackType, message?: string) => {
    setFeedback({ type, message, isVisible: true });
  }, []);

  const hideFeedback = useCallback(() => {
    setFeedback(prev => ({ ...prev, isVisible: false }));
  }, []);

  const showSuccess = useCallback((message?: string) => {
    showFeedback("success", message);
    setTimeout(hideFeedback, 1500);
  }, [showFeedback, hideFeedback]);

  const showError = useCallback((message?: string) => {
    showFeedback("error", message);
    setTimeout(hideFeedback, 2000);
  }, [showFeedback, hideFeedback]);

  const showLoading = useCallback((message?: string) => {
    showFeedback("loading", message);
  }, [showFeedback]);

  return {
    feedback,
    showSuccess,
    showError,
    showLoading,
    hideFeedback,
    ActionFeedbackComponent: () => (
      <ActionFeedback
        type={feedback.type}
        message={feedback.message}
        isVisible={feedback.isVisible}
        onComplete={hideFeedback}
      />
    ),
  };
}
