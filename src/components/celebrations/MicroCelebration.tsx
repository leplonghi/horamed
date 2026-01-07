import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Star, Zap, Heart, Trophy, Sparkles } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface MicroCelebrationProps {
  type: "dose_taken" | "streak_day" | "perfect_day" | "milestone" | "level_up" | "combo";
  trigger: boolean;
  onComplete?: () => void;
  streak?: number;
  message?: string;
}

const celebrationConfig = {
  dose_taken: {
    icon: Check,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    sound: null, // Could add sound later
    duration: 800,
    scale: [1, 1.3, 1],
  },
  streak_day: {
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    sound: null,
    duration: 1200,
    scale: [1, 1.4, 1.2, 1],
  },
  perfect_day: {
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    sound: null,
    duration: 1500,
    scale: [1, 1.5, 1.2, 1],
  },
  milestone: {
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
    sound: null,
    duration: 2000,
    scale: [1, 1.6, 1.3, 1],
  },
  level_up: {
    icon: Zap,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    sound: null,
    duration: 1800,
    scale: [1, 1.5, 1.2, 1],
  },
  combo: {
    icon: Sparkles,
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
    sound: null,
    duration: 1000,
    scale: [1, 1.4, 1],
  },
};

// Motivational messages for each type
const messages = {
  dose_taken: ["Boa!", "Feito!", "Perfeito!", "Excelente!", "💪", "✓"],
  streak_day: ["Em chamas!", "Sequência!", "Continue!", "Incrível!"],
  perfect_day: ["Dia perfeito!", "100%!", "Impecável!", "Mandou bem!"],
  milestone: ["Marco atingido!", "Conquista!", "Você evoluiu!"],
  level_up: ["Level up!", "Subiu de nível!", "Evolução!"],
  combo: ["Combo!", "Sequência!", "Em série!"],
};

export default function MicroCelebration({
  type,
  trigger,
  onComplete,
  streak,
  message,
}: MicroCelebrationProps) {
  const [show, setShow] = useState(false);
  const [displayMessage, setDisplayMessage] = useState("");
  const { triggerHaptic } = useHapticFeedback();
  const config = celebrationConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (trigger) {
      // Pick random message or use provided
      const typeMessages = messages[type];
      setDisplayMessage(message || typeMessages[Math.floor(Math.random() * typeMessages.length)]);
      
      setShow(true);
      
      // Trigger haptic based on celebration type
      if (type === "dose_taken" || type === "combo") {
        triggerHaptic("light");
      } else if (type === "streak_day" || type === "perfect_day") {
        triggerHaptic("medium");
      } else {
        triggerHaptic("heavy");
      }

      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, config.duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, type, config.duration, onComplete, message, triggerHaptic]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Burst effect */}
          <motion.div
            className="absolute"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: config.duration / 1000, ease: "easeOut" }}
          >
            <div className={`w-24 h-24 rounded-full ${config.bgColor}`} />
          </motion.div>

          {/* Icon animation */}
          <motion.div
            className={`relative p-6 rounded-full ${config.bgColor}`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: config.scale,
              rotate: 0,
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 15,
            }}
          >
            <Icon className={`h-12 w-12 ${config.color}`} />
            
            {/* Streak number */}
            {streak && streak > 1 && (
              <motion.div
                className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2 }}
              >
                {streak}
              </motion.div>
            )}
          </motion.div>

          {/* Message */}
          <motion.p
            className={`absolute bottom-1/3 text-2xl font-bold ${config.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
          >
            {displayMessage}
          </motion.p>

          {/* Floating particles */}
          {type !== "dose_taken" && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${config.bgColor.replace('/20', '')}`}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ 
                    duration: config.duration / 1000,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
