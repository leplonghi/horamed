import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Achievement } from "@/hooks/useAchievements";
import { Lock } from "lucide-react";

interface AchievementCardProps {
  achievement: Achievement;
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const levelColors = {
    bronze: "from-amber-600/20 to-amber-800/20 border-amber-600/30",
    silver: "from-slate-400/20 to-slate-600/20 border-slate-400/30",
    gold: "from-yellow-500/20 to-yellow-700/20 border-yellow-500/30",
    diamond: "from-cyan-400/20 to-blue-600/20 border-cyan-400/30",
  };

  const levelTextColors = {
    bronze: "text-amber-600 dark:text-amber-400",
    silver: "text-slate-600 dark:text-slate-300",
    gold: "text-yellow-600 dark:text-yellow-400",
    diamond: "text-cyan-500 dark:text-cyan-300",
  };

  return (
    <Card
      className={cn(
        "p-4 relative overflow-hidden transition-all duration-300",
        achievement.unlocked
          ? `bg-gradient-to-br ${levelColors[achievement.level]} animate-scale-in`
          : "opacity-60 grayscale"
      )}
    >
      {/* Lock overlay for locked achievements */}
      {!achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "text-3xl transition-transform duration-300",
            achievement.unlocked && "animate-scale-in"
          )}
        >
          {achievement.icon}
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground">
              {achievement.title}
            </h3>
            <span
              className={cn(
                "text-xs font-medium uppercase tracking-wide",
                levelTextColors[achievement.level]
              )}
            >
              {achievement.level}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {achievement.description}
          </p>

          {/* Progress bar for in-progress achievements */}
          {!achievement.unlocked &&
            achievement.progress !== undefined &&
            achievement.maxProgress !== undefined && (
              <div className="space-y-1 pt-2">
                <Progress
                  value={(achievement.progress / achievement.maxProgress) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {achievement.progress} / {achievement.maxProgress}
                </p>
              </div>
            )}
        </div>
      </div>
    </Card>
  );
}
