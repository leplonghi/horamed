import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Crown, 
  Medal, 
  Flame,
  Trophy,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  adherenceRate: number;
  streak: number;
  weeklyXP: number;
  isCurrentUser: boolean;
  rank: number;
}

export default function FamilyLeaderboard() {
  const { language } = useLanguage();
  const { isPremium } = useSubscription();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(0);

  const t = {
    title: language === 'pt' ? 'Ranking Familiar' : 'Family Leaderboard',
    thisWeek: language === 'pt' ? 'Esta semana' : 'This week',
    streak: language === 'pt' ? 'dias' : 'days',
    you: language === 'pt' ? 'Você' : 'You',
    adherence: language === 'pt' ? 'Adesão' : 'Adherence',
    noFamily: language === 'pt' 
      ? 'Adicione familiares para competir!' 
      : 'Add family members to compete!',
    premiumOnly: language === 'pt' 
      ? 'Ranking familiar é um recurso Premium' 
      : 'Family leaderboard is a Premium feature',
  };

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all profiles for this user (family members)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, user_id")
        .eq("user_id", user.id);

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      // For each profile, calculate adherence
      const memberData: FamilyMember[] = [];
      
      for (const profile of profiles) {
        // Get this week's doses
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        
        const { data: doses } = await supabase
          .from("dose_instances")
          .select(`status, items!inner(profile_id)`)
          .eq("items.profile_id", profile.id)
          .gte("due_at", weekStart.toISOString());

        const taken = doses?.filter(d => d.status === "taken").length || 0;
        const total = doses?.length || 1;
        const adherenceRate = Math.round((taken / total) * 100);

        // Get streak - simplified query
        const streakData = { current_streak: Math.floor(Math.random() * 10) }; // Placeholder for now

        memberData.push({
          id: profile.id,
          name: profile.full_name || 'Membro',
          avatar: profile.avatar_url,
          adherenceRate,
          streak: streakData?.current_streak || 0,
          weeklyXP: taken * 10, // Simple XP calculation
          isCurrentUser: profiles.indexOf(profile) === 0,
          rank: 0
        });
      }

      // Sort by adherence rate, then streak
      memberData.sort((a, b) => {
        if (b.adherenceRate !== a.adherenceRate) {
          return b.adherenceRate - a.adherenceRate;
        }
        return b.streak - a.streak;
      });

      // Assign ranks
      memberData.forEach((member, index) => {
        member.rank = index + 1;
        if (member.isCurrentUser) {
          setCurrentUserRank(index + 1);
        }
      });

      setMembers(memberData);
    } catch (error) {
      console.error("Error fetching family data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">{rank}º</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary/30";
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30";
      case 2:
        return "bg-gray-500/5 border-gray-500/20";
      case 3:
        return "bg-amber-500/5 border-amber-500/20";
      default:
        return "bg-card";
    }
  };

  if (!isPremium) {
    return (
      <Card className="p-4 opacity-75">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span className="text-sm">{t.premiumOnly}</span>
          <Badge variant="secondary" className="ml-auto">Premium</Badge>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (members.length <= 1) {
    return (
      <Card className="p-4">
        <div className="text-center py-4">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">{t.noFamily}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-base">{t.title}</span>
          </div>
          <Badge variant="outline">{t.thisWeek}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(member.rank, member.isCurrentUser)}`}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {getRankIcon(member.rank)}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.name[0]}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">
                  {member.name}
                  {member.isCurrentUser && (
                    <span className="text-primary ml-1">({t.you})</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {member.streak} {t.streak}
                </span>
                <span>{member.adherenceRate}% {t.adherence}</span>
              </div>
            </div>

            {/* XP */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-600">
                <Star className="h-4 w-4" />
                <span className="font-bold">{member.weeklyXP}</span>
              </div>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
