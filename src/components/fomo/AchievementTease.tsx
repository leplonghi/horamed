import { motion } from "framer-motion";
import { Trophy, Lock, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface AchievementTeaseProps {
  className?: string;
}

const PREMIUM_ACHIEVEMENTS_PT = [
  { title: "Mestre da Saúde", desc: "Complete 30 dias perfeitos", xp: 500 },
  { title: "Guardião da Família", desc: "Gerencie 3+ perfis", xp: 300 },
  { title: "Documentador Pro", desc: "Salve 50+ documentos", xp: 400 },
];

const PREMIUM_ACHIEVEMENTS_EN = [
  { title: "Health Master", desc: "Complete 30 perfect days", xp: 500 },
  { title: "Family Guardian", desc: "Manage 3+ profiles", xp: 300 },
  { title: "Pro Documenter", desc: "Save 50+ documents", xp: 400 },
];

export default function AchievementTease({ className }: AchievementTeaseProps) {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { language } = useLanguage();

  if (isPremium) return null;

  const achievements = language === 'pt' ? PREMIUM_ACHIEVEMENTS_PT : PREMIUM_ACHIEVEMENTS_EN;
  const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Card 
        className="p-4 cursor-pointer border-dashed border-2 border-muted-foreground/20 bg-muted/20 hover:border-primary/30 hover:bg-muted/40 transition-all"
        onClick={() => navigate("/planos")}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-muted rounded-full">
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-0.5 bg-background rounded-full">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-muted-foreground">{randomAchievement.title}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                Premium
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{randomAchievement.desc}</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-bold text-primary">+{randomAchievement.xp}</p>
            <p className="text-[10px] text-muted-foreground">XP</p>
          </div>
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-3">
          <Crown className="h-3 w-3 inline mr-1" />
          {language === 'pt' 
            ? 'Desbloqueie conquistas exclusivas com Premium'
            : 'Unlock exclusive achievements with Premium'
          }
        </p>
      </Card>
    </motion.div>
  );
}
