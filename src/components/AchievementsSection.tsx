import { useAchievements } from "@/hooks/useAchievements";
import AchievementCard from "./AchievementCard";
import { Card } from "./ui/card";
import { Trophy, Lock } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export default function AchievementsSection() {
  const { achievements, loading, unlockedCount } = useAchievements();

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Suas Conquistas
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Suas Conquistas
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-primary">{unlockedCount}</span>
          <span className="text-muted-foreground">/ {achievements.length}</span>
        </div>
      </div>

      {achievements.length === 0 ? (
        <Card className="p-8 text-center">
          <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            Comece a tomar suas doses para desbloquear conquistas!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}
