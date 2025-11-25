import { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements } from "@/hooks/useAchievements";
import { useXPSystem } from "@/hooks/useXPSystem";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import AchievementCard from "@/components/AchievementCard";
import XPSystem from "@/components/gamification/XPSystem";
import StreakAnimation from "@/components/celebrations/StreakAnimation";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { Achievement } from "@/hooks/useAchievements";
import { Trophy, Star, Flame, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import TutorialHint from "@/components/TutorialHint";

export default function Achievements() {
  const { achievements, loading: achievementsLoading, unlockedCount } = useAchievements();
  const xpSystem = useXPSystem();
  const { currentStreak, longestStreak, loading: streakLoading } = useStreakCalculator();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleShareClick = (achievement: Achievement) => {
    if (achievement.unlocked) {
      setSelectedAchievement(achievement);
      setShareDialogOpen(true);
    }
  };

  if (achievementsLoading || xpSystem.loading || streakLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader
          title="Conquistas"
          description="Seu progresso e badges"
        />
        <div className="container mx-auto p-4 space-y-4">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background pb-20">
      <PageHeader
        title="Conquistas"
        description="Seu progresso e badges"
      />

      <div className="container mx-auto p-4 space-y-6">
        {/* Tutorial Hint */}
        <TutorialHint
          id="achievements_page"
          title="Seu sistema de conquistas 🏆"
          message="Desbloqueie medalhas mantendo sua sequência de dias, tomando doses no horário, e atingindo metas. Ganhe XP a cada dose tomada e suba de nível! Compartilhe suas conquistas nas redes sociais."
        />

        {/* XP System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <XPSystem
            currentXP={xpSystem.currentXP}
            level={xpSystem.level}
            xpToNextLevel={xpSystem.xpToNextLevel}
            weeklyXP={xpSystem.weeklyXP}
            monthlyXP={xpSystem.monthlyXP}
          />
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Sequência Atual</h3>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {currentStreak} dias
                </p>
                <p className="text-sm text-muted-foreground">
                  Recorde: {longestStreak} dias
                </p>
              </div>
              <StreakAnimation streak={currentStreak} />
            </div>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{unlockedCount}</p>
            <p className="text-xs text-muted-foreground">Desbloqueados</p>
          </Card>

          <Card className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{xpSystem.level}</p>
            <p className="text-xs text-muted-foreground">Nível</p>
          </Card>

          <Card className="p-4 text-center">
            <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{lockedAchievements.length}</p>
            <p className="text-xs text-muted-foreground">Bloqueados</p>
          </Card>
        </motion.div>

        {/* Achievements Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Todos ({achievements.length})
              </TabsTrigger>
              <TabsTrigger value="unlocked">
                Desbloqueados ({unlockedCount})
              </TabsTrigger>
              <TabsTrigger value="locked">
                Bloqueados ({lockedAchievements.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    onClick={() => handleShareClick(achievement)}
                    className={achievement.unlocked ? "cursor-pointer" : ""}
                  >
                    <AchievementCard achievement={achievement} />
                  </div>
                  {achievement.unlocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleShareClick(achievement)}
                    >
                      Compartilhar 🎉
                    </Button>
                  )}
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="unlocked" className="space-y-3 mt-4">
              {unlockedAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div onClick={() => handleShareClick(achievement)} className="cursor-pointer">
                    <AchievementCard achievement={achievement} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleShareClick(achievement)}
                  >
                    Compartilhar 🎉
                  </Button>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="locked" className="space-y-3 mt-4">
              {lockedAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AchievementCard achievement={achievement} />
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Share Dialog */}
      {selectedAchievement && (
        <AchievementShareDialog
          achievement={selectedAchievement}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  );
}
