import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { TrendingUp, TrendingDown, Target, Calendar, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressDashboardProps {
  currentStreak: number;
  longestStreak: number;
  thisWeekAverage: number;
  lastWeekAverage: number;
  monthlyGoal?: number;
  monthlyProgress?: number;
}

export default function ProgressDashboard({
  currentStreak,
  longestStreak,
  thisWeekAverage,
  lastWeekAverage,
  monthlyGoal = 90,
  monthlyProgress = 0,
}: ProgressDashboardProps) {
  const isImproving = thisWeekAverage > lastWeekAverage;
  const improvementPercent = lastWeekAverage > 0
    ? Math.round(((thisWeekAverage - lastWeekAverage) / lastWeekAverage) * 100)
    : 0;

  const goalReached = monthlyProgress >= monthlyGoal;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        Seu Progresso
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Streak - Vibrant Orange/Red Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 border-0 text-white shadow-lg shadow-orange-500/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-yellow-300 animate-pulse" />
                  <span className="font-semibold">Sequência Atual</span>
                </div>
                <span className="text-4xl font-bold">
                  {currentStreak}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Trophy className="h-4 w-4" />
                <p className="text-sm">
                  Recorde: {longestStreak} dias
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Weekly Comparison - Blue/Purple Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 border-0 text-white shadow-lg shadow-blue-500/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isImproving ? (
                    <TrendingUp className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-300" />
                  )}
                  <span className="font-semibold">Esta Semana</span>
                </div>
                <span className="text-4xl font-bold">
                  {thisWeekAverage}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isImproving ? (
                  <>
                    <span className="bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      +{Math.abs(improvementPercent)}%
                    </span>
                    <span className="text-white/70">vs semana passada</span>
                  </>
                ) : (
                  <>
                    <span className="bg-red-400/30 text-red-200 px-2 py-0.5 rounded-full font-medium">
                      {improvementPercent}%
                    </span>
                    <span className="text-white/70">vs semana passada</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Monthly Goal - Emerald/Teal Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card className={cn(
            "p-5 border-0 text-white shadow-lg",
            goalReached 
              ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/20" 
              : "bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 shadow-teal-500/20"
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className={cn(
                    "h-5 w-5",
                    goalReached ? "text-yellow-300" : "text-white"
                  )} />
                  <span className="font-semibold">Meta Mensal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/80">
                    {monthlyProgress}% de {monthlyGoal}%
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <Progress
                  value={Math.min(monthlyProgress, 100)}
                  className="h-4 bg-white/20"
                />
                <div 
                  className="absolute inset-0 h-4 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                {goalReached ? (
                  <span className="flex items-center gap-2 bg-yellow-400/30 text-yellow-100 px-3 py-1 rounded-full font-medium">
                    🎉 Meta atingida!
                  </span>
                ) : (
                  <span className="text-white/80">
                    Faltam {monthlyGoal - monthlyProgress}% para sua meta
                  </span>
                )}
                {!goalReached && (
                  <span className="bg-white/20 px-3 py-1 rounded-full font-medium">
                    Continue assim! 💪
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}