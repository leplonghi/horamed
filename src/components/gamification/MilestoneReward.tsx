import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Star, Sparkles } from "lucide-react";
import ConfettiExplosion from "../celebrations/ConfettiExplosion";
import { useState, useEffect } from "react";

interface MilestoneRewardProps {
  milestone: 7 | 30 | 90;
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
}

export default function MilestoneReward({
  milestone,
  visible,
  onClose,
  onShare,
}: MilestoneRewardProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const getMilestoneData = () => {
    switch (milestone) {
      case 7:
        return {
          icon: <Star className="h-16 w-16 text-yellow-500" />,
          title: "Semana de Ouro! 🌟",
          subtitle: "7 dias de compromisso perfeito",
          reward: "Você desbloqueou o badge 'Semana Perfeita'!",
          color: "from-yellow-500/20 to-orange-500/20",
          borderColor: "border-yellow-500/30",
        };
      case 30:
        return {
          icon: <Trophy className="h-16 w-16 text-purple-500" />,
          title: "Mês Incrível! 🎉",
          subtitle: "30 dias de dedicação",
          reward: "Você desbloqueou o badge 'Mês Dedicado' + Perfil Premium por 7 dias!",
          color: "from-purple-500/20 to-pink-500/20",
          borderColor: "border-purple-500/30",
        };
      case 90:
        return {
          icon: <Gift className="h-16 w-16 text-cyan-500" />,
          title: "Lendário! 💎",
          subtitle: "90 dias de compromisso total",
          reward: "Você desbloqueou o badge 'Trimestre Diamante' + 1 mês de Premium GRÁTIS!",
          color: "from-cyan-500/20 to-blue-600/20",
          borderColor: "border-cyan-500/30",
        };
      default:
        return {
          icon: <Star className="h-16 w-16 text-yellow-500" />,
          title: "Conquista Especial",
          subtitle: "Continue mantendo seu compromisso",
          reward: "Você desbloqueou uma nova conquista!",
          color: "from-primary/20 to-primary/30",
          borderColor: "border-primary/30",
        };
    }
  };

  const data = getMilestoneData();

  return (
    <AnimatePresence>
      {visible && (
        <>
          {showConfetti && <ConfettiExplosion trigger={showConfetti} />}
          
          <motion.div
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card
                className={`max-w-md w-full p-8 bg-gradient-to-br ${data.color} border-2 ${data.borderColor} shadow-2xl relative overflow-hidden`}
              >
                {/* Sparkle decorations */}
                <motion.div
                  className="absolute top-4 right-4"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="h-8 w-8 text-yellow-500" />
                </motion.div>

                <motion.div
                  className="absolute bottom-4 left-4"
                  animate={{
                    rotate: [360, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5,
                  }}
                >
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </motion.div>

                <div className="flex flex-col items-center space-y-6 text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [-5, 5, -5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {data.icon}
                  </motion.div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">
                      {data.title}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {data.subtitle}
                    </p>
                  </div>

                  <motion.div
                    className="bg-background/50 backdrop-blur-sm rounded-lg p-4 w-full border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {data.reward}
                    </p>
                  </motion.div>

                  <div className="flex gap-3 w-full pt-4">
                    <Button
                      onClick={onShare}
                      className="flex-1"
                      size="lg"
                    >
                      Compartilhar 🎉
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
