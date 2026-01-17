import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Target, 
  Flame,
  Star,
  Gift,
  Lock,
  CheckCircle2,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { startOfWeek, endOfWeek, differenceInDays } from "date-fns";

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  isPremium: boolean;
  type: 'adherence' | 'streak' | 'perfect_week' | 'early_bird';
}

export default function WeeklyChallenges() {
  const { language } = useLanguage();
  const { isPremium } = useSubscription();
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const t = {
    title: language === 'pt' ? 'Desafios Semanais' : 'Weekly Challenges',
    daysLeft: language === 'pt' ? 'dias restantes' : 'days left',
    claim: language === 'pt' ? 'Resgatar' : 'Claim',
    claimed: language === 'pt' ? 'Resgatado' : 'Claimed',
    premium: language === 'pt' ? 'Premium' : 'Premium',
    complete100: language === 'pt' ? 'Semana 100%' : '100% Week',
    complete100Desc: language === 'pt' ? 'Tome todas as doses da semana' : 'Take all doses this week',
    streakWeek: language === 'pt' ? 'Streak Semanal' : 'Weekly Streak',
    streakWeekDesc: language === 'pt' ? 'Mantenha 7 dias consecutivos' : 'Maintain 7 consecutive days',
    earlyBird: language === 'pt' ? 'Madrugador' : 'Early Bird',
    earlyBirdDesc: language === 'pt' ? 'Tome 5 doses antes das 8h' : 'Take 5 doses before 8am',
    perfectTiming: language === 'pt' ? 'Timing Perfeito' : 'Perfect Timing',
    perfectTimingDesc: language === 'pt' ? 'Tome 10 doses no horário exato' : 'Take 10 doses on exact time',
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

      // Get week's doses
      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`*, items!inner(user_id)`)
        .eq("items.user_id", user.id)
        .gte("due_at", weekStart.toISOString())
        .lte("due_at", weekEnd.toISOString());

      const takenDoses = doses?.filter(d => d.status === "taken") || [];
      const totalDoses = doses?.length || 0;
      const onTimeDoses = takenDoses.filter(d => 
        d.delay_minutes !== null && Math.abs(d.delay_minutes) <= 5
      ).length;
      const earlyDoses = takenDoses.filter(d => {
        const hour = new Date(d.taken_at).getHours();
        return hour < 8;
      }).length;

      // Calculate streak days this week
      const daysWithDoses = new Set<string>();
      takenDoses.forEach(d => {
        const date = new Date(d.taken_at).toISOString().split('T')[0];
        daysWithDoses.add(date);
      });
      const streakDays = daysWithDoses.size;

      const weeklyChallenges: WeeklyChallenge[] = [
        {
          id: "week_100",
          title: t.complete100,
          description: t.complete100Desc,
          icon: <Trophy className="h-5 w-5 text-yellow-500" />,
          current: takenDoses.length,
          target: Math.max(totalDoses, 1),
          xpReward: 500,
          completed: totalDoses > 0 && takenDoses.length === totalDoses,
          claimed: false,
          isPremium: false,
          type: 'adherence'
        },
        {
          id: "streak_week",
          title: t.streakWeek,
          description: t.streakWeekDesc,
          icon: <Flame className="h-5 w-5 text-orange-500" />,
          current: streakDays,
          target: 7,
          xpReward: 300,
          completed: streakDays >= 7,
          claimed: false,
          isPremium: false,
          type: 'streak'
        },
        {
          id: "early_bird",
          title: t.earlyBird,
          description: t.earlyBirdDesc,
          icon: <Star className="h-5 w-5 text-blue-500" />,
          current: earlyDoses,
          target: 5,
          xpReward: 200,
          completed: earlyDoses >= 5,
          claimed: false,
          isPremium: true,
          type: 'early_bird'
        },
        {
          id: "perfect_timing",
          title: t.perfectTiming,
          description: t.perfectTimingDesc,
          icon: <Target className="h-5 w-5 text-purple-500" />,
          current: onTimeDoses,
          target: 10,
          xpReward: 400,
          completed: onTimeDoses >= 10,
          claimed: false,
          isPremium: true,
          type: 'perfect_week'
        },
      ];

      setChallenges(weeklyChallenges);
    } catch (error) {
      console.error("Error fetching weekly challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || (challenge.isPremium && !isPremium)) {
      toast.error(language === 'pt' ? 'Recurso Premium' : 'Premium Feature');
      return;
    }

    setClaimingId(challengeId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setChallenges(prev => 
      prev.map(c => c.id === challengeId ? { ...c, claimed: true } : c)
    );
    
    toast.success(`+${challenge.xpReward} XP! 🎉`);
    setClaimingId(null);
  };

  const getDaysLeft = () => {
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    return differenceInDays(weekEnd, new Date());
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const completedCount = challenges.filter(c => c.completed && (!c.isPremium || isPremium)).length;
  const totalXP = challenges
    .filter(c => c.completed && (!c.isPremium || isPremium))
    .reduce((acc, c) => acc + c.xpReward, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-base">{t.title}</span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {getDaysLeft()} {t.daysLeft}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completedCount}/{challenges.filter(c => !c.isPremium || isPremium).length} {language === 'pt' ? 'completos' : 'complete'}
            </span>
            <span className="text-sm font-bold text-yellow-600">
              +{totalXP} XP
            </span>
          </div>
          <Progress value={(completedCount / challenges.length) * 100} className="h-2" />
        </div>

        {/* Challenges List */}
        <div className="space-y-3">
          <AnimatePresence>
            {challenges.map((challenge, index) => {
              const isLocked = challenge.isPremium && !isPremium;
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border transition-all ${
                    isLocked 
                      ? 'bg-muted/50 opacity-60'
                      : challenge.claimed 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : challenge.completed 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      isLocked ? 'bg-muted' : challenge.completed ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {isLocked ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : challenge.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        challenge.icon
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{challenge.title}</p>
                        {challenge.isPremium && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
                            {t.premium}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                      
                      {!challenge.completed && !isLocked && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{challenge.current}/{challenge.target}</span>
                            <span className="text-yellow-600">+{challenge.xpReward} XP</span>
                          </div>
                          <Progress 
                            value={(challenge.current / challenge.target) * 100} 
                            className="h-1.5" 
                          />
                        </div>
                      )}
                    </div>

                    {challenge.completed && !challenge.claimed && !isLocked && (
                      <Button
                        size="sm"
                        onClick={() => claimReward(challenge.id)}
                        disabled={claimingId === challenge.id}
                        className="shrink-0 gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      >
                        {claimingId === challenge.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            <Gift className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <>
                            <Gift className="h-4 w-4" />
                            {t.claim}
                          </>
                        )}
                      </Button>
                    )}

                    {challenge.claimed && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        ✓ {t.claimed}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
