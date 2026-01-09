import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, Trophy, ChevronRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useXPSystem } from "@/hooks/useXPSystem";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useAchievements } from "@/hooks/useAchievements";
import { useLanguage } from "@/contexts/LanguageContext";

export function GamificationWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currentXP, level, xpToNextLevel, loading: xpLoading } = useXPSystem();
  const { currentStreak, loading: streakLoading } = useStreakCalculator();
  const { unlockedCount, loading: achievementsLoading } = useAchievements();

  const loading = xpLoading || streakLoading || achievementsLoading;
  
  const t = {
    level: language === 'pt' ? 'Nível' : 'Level',
    dailyChallenges: language === 'pt' ? 'Desafios diários' : 'Daily challenges',
    ranking: language === 'pt' ? 'Ranking' : 'Ranking',
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl shadow-[var(--shadow-glass)]">
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-12 w-12 bg-muted/50 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted/50 rounded w-1/2" />
            <div className="h-2 bg-muted/50 rounded w-full" />
          </div>
        </div>
      </Card>
    );
  }

  const progressPercent = (currentXP / xpToNextLevel) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className="p-4 cursor-pointer transition-all bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl border border-border/30 shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)]"
        onClick={() => navigate("/jornada")}
      >
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <Badge 
              className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {level}
            </Badge>
          </div>

          {/* Progress Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{t.level} {level}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {currentStreak}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  {unlockedCount}
                </span>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {currentXP}/{xpToNextLevel} XP
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>

        {/* Quick Stats Row */}
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
          <Badge variant="outline" className="gap-1 text-xs">
            <Zap className="h-3 w-3" />
            {t.dailyChallenges}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Trophy className="h-3 w-3" />
            {t.ranking}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}
