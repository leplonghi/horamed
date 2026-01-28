import { motion } from "framer-motion";
import { useXPSystem } from "@/hooks/useXPSystem";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useAchievements } from "@/hooks/useAchievements";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Star, 
  Trophy, 
  TrendingUp,
  Sparkles,
  ChevronRight,
  Crown,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WeeklyLeaderboard } from "./WeeklyLeaderboard";
import { DailyChallenges } from "./DailyChallenges";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function GamificationHub() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentXP, level, xpToNextLevel, weeklyXP, loading: xpLoading } = useXPSystem();
  const { currentStreak, longestStreak, loading: streakLoading } = useStreakCalculator();
  const { unlockedCount, achievements, loading: achievementsLoading } = useAchievements();

  const loading = xpLoading || streakLoading || achievementsLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const progressPercent = (currentXP / xpToNextLevel) * 100;
  const nextAchievement = achievements.find(a => !a.unlocked);

  return (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-3 text-center bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <Flame className="h-6 w-6 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Dias</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-3 text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <Star className="h-6 w-6 mx-auto mb-1 text-purple-500" />
            <p className="text-2xl font-bold">{level}</p>
            <p className="text-xs text-muted-foreground">Nível</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-3 text-center bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
            <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{unlockedCount}</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </Card>
        </motion.div>
      </div>

      {/* XP Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Nível {level}</p>
                <p className="text-xs text-muted-foreground">
                  {currentXP} / {xpToNextLevel} XP
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              +{weeklyXP} essa semana
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Faltam {xpToNextLevel - currentXP} XP para o próximo nível
          </p>
        </Card>
      </motion.div>

      {/* Daily Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <DailyChallenges />
      </motion.div>

      {/* Weekly Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <WeeklyLeaderboard />
      </motion.div>

      {/* Next Achievement Preview */}
      {nextAchievement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card 
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/conquistas")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Próxima Conquista</p>
                  <p className="text-xs text-muted-foreground">{nextAchievement.title}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* View All Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/conquistas")}
        >
          Ver todas as conquistas
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
