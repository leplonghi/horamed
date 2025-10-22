import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Seu Progresso
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Current Streak */}
        <Card className="p-5 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <span className="font-semibold text-foreground">Sequência Atual</span>
              </div>
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {currentStreak}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Recorde: {longestStreak} dias
            </p>
          </div>
        </Card>

        {/* Weekly Comparison */}
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isImproving ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <span className="font-semibold text-foreground">Esta Semana</span>
              </div>
              <span className="text-3xl font-bold text-primary">
                {thisWeekAverage}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isImproving ? (
                <>
                  <span className="text-success font-medium">+{Math.abs(improvementPercent)}%</span>
                  <span className="text-muted-foreground">vs semana passada</span>
                </>
              ) : (
                <>
                  <span className="text-destructive font-medium">{improvementPercent}%</span>
                  <span className="text-muted-foreground">vs semana passada</span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Monthly Goal */}
        <Card className="p-5 md:col-span-2 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-success" />
                <span className="font-semibold text-foreground">Meta Mensal</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {monthlyProgress}% de {monthlyGoal}%
              </span>
            </div>
            
            <Progress
              value={monthlyProgress}
              className="h-3"
            />
            
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {monthlyProgress >= monthlyGoal ? (
                  <span className="text-success font-medium">🎉 Meta atingida!</span>
                ) : (
                  <span>
                    Faltam {monthlyGoal - monthlyProgress}% para sua meta
                  </span>
                )}
              </p>
              {monthlyProgress < monthlyGoal && (
                <span className="text-primary font-medium">Continue assim! 💪</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
