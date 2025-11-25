import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPSystemProps {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  weeklyXP: number;
  monthlyXP: number;
  className?: string;
}

export default function XPSystem({
  currentXP,
  level,
  xpToNextLevel,
  weeklyXP,
  monthlyXP,
  className,
}: XPSystemProps) {
  const progressPercentage = (currentXP / xpToNextLevel) * 100;

  const getLevelColor = () => {
    if (level >= 50) return "from-purple-500 to-pink-500";
    if (level >= 30) return "from-blue-500 to-cyan-500";
    if (level >= 15) return "from-green-500 to-emerald-500";
    if (level >= 5) return "from-yellow-500 to-orange-500";
    return "from-gray-400 to-gray-600";
  };

  return (
    <Card className={cn("p-6 space-y-6", className)}>
      {/* Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            className={`relative h-20 w-20 rounded-full bg-gradient-to-br ${getLevelColor()} flex items-center justify-center shadow-lg`}
            whileHover={{ scale: 1.05 }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(147, 51, 234, 0.3)",
                "0 0 30px rgba(147, 51, 234, 0.5)",
                "0 0 20px rgba(147, 51, 234, 0.3)",
              ],
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <Trophy className="h-10 w-10 text-white" />
            <motion.div
              className="absolute -bottom-1 -right-1 bg-background border-2 border-primary rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {level}
            </motion.div>
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold">Nível {level}</h3>
            <p className="text-sm text-muted-foreground">
              {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
            </p>
          </div>
        </div>

        <motion.div
          className="text-right"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-1 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="text-2xl font-bold">+{weeklyXP}</span>
          </div>
          <p className="text-xs text-muted-foreground">XP esta semana</p>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso para o próximo nível</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="bg-muted/50 rounded-lg p-4 space-y-1"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span className="text-xs">XP Mensal</span>
          </div>
          <p className="text-2xl font-bold">{monthlyXP.toLocaleString()}</p>
        </motion.div>

        <motion.div
          className="bg-muted/50 rounded-lg p-4 space-y-1"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span className="text-xs">Total de XP</span>
          </div>
          <p className="text-2xl font-bold">
            {(currentXP + (level - 1) * 1000).toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* XP Guide */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Como ganhar XP
        </h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>• Tomar medicamento no horário</span>
            <span className="font-medium text-foreground">+10 XP</span>
          </div>
          <div className="flex justify-between">
            <span>• Completar dia perfeito (100%)</span>
            <span className="font-medium text-foreground">+50 XP</span>
          </div>
          <div className="flex justify-between">
            <span>• Manter streak de 7 dias</span>
            <span className="font-medium text-foreground">+100 XP</span>
          </div>
          <div className="flex justify-between">
            <span>• Desbloquear conquista</span>
            <span className="font-medium text-foreground">+25-200 XP</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
