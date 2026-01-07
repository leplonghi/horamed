import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Trophy, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Confetti from "react-confetti";
import { useState, useEffect } from "react";

interface LevelUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLevel: number;
  xpEarned?: number;
}

export function LevelUpModal({ open, onOpenChange, newLevel, xpEarned }: LevelUpModalProps) {
  const { language } = useLanguage();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  const t = {
    title: language === 'pt' ? 'Subiu de Nível!' : 'Level Up!',
    subtitle: language === 'pt' ? 'Parabéns! Você alcançou' : 'Congratulations! You reached',
    level: language === 'pt' ? 'Nível' : 'Level',
    xpEarned: language === 'pt' ? 'XP ganhos' : 'XP earned',
    continue: language === 'pt' ? 'Continuar' : 'Continue',
    keepGoing: language === 'pt' ? 'Continue assim para desbloquear mais conquistas!' : 'Keep going to unlock more achievements!',
  };

  const getLevelBadge = (level: number) => {
    if (level >= 20) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (level >= 10) return { icon: Star, color: 'text-purple-500', bg: 'bg-purple-500/20' };
    if (level >= 5) return { icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/20' };
    return { icon: Zap, color: 'text-green-500', bg: 'bg-green-500/20' };
  };

  const badge = getLevelBadge(newLevel);
  const BadgeIcon = badge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <AnimatePresence>
          {open && (
            <>
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={200}
                gravity={0.3}
              />
              
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="flex flex-col items-center text-center py-6"
              >
                {/* Animated badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={`w-24 h-24 rounded-full ${badge.bg} flex items-center justify-center mb-4`}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      delay: 0.5,
                      duration: 0.5,
                      repeat: 2
                    }}
                  >
                    <BadgeIcon className={`w-12 h-12 ${badge.color}`} />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  🎉 {t.title}
                </motion.h2>

                {/* Level display */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4"
                >
                  <p className="text-muted-foreground mb-2">{t.subtitle}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">
                      {t.level} {newLevel}
                    </span>
                  </div>
                </motion.div>

                {/* XP earned */}
                {xpEarned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4"
                  >
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">+{xpEarned} {t.xpEarned}</span>
                  </motion.div>
                )}

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-muted-foreground mb-6"
                >
                  {t.keepGoing}
                </motion.p>

                {/* Continue button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button onClick={() => onOpenChange(false)} size="lg">
                    {t.continue}
                  </Button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
