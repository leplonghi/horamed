import { motion } from "framer-motion";
import { Crown, Lock, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface PremiumTeaserProps {
  feature: 'reports' | 'unlimited' | 'ai' | 'challenges' | 'insights';
  compact?: boolean;
  className?: string;
}

const FEATURE_CONFIG = {
  reports: {
    icon: TrendingUp,
    titlePt: "Relatórios para Médico",
    titleEn: "Medical Reports",
    descPt: "92% dos médicos preferem pacientes com relatórios organizados",
    descEn: "92% of doctors prefer patients with organized reports",
    statPt: "92%",
    statLabelPt: "médicos aprovam",
    statLabelEn: "doctors approve",
  },
  unlimited: {
    icon: Sparkles,
    titlePt: "Medicamentos Ilimitados",
    titleEn: "Unlimited Medications",
    descPt: "Usuários Premium gerenciam em média 5 medicamentos",
    descEn: "Premium users manage an average of 5 medications",
    statPt: "5x",
    statLabelPt: "mais organização",
    statLabelEn: "more organization",
  },
  ai: {
    icon: Sparkles,
    titlePt: "Clara IA Ilimitada",
    titleEn: "Unlimited Clara AI",
    descPt: "Pergunte 8x mais e tenha 40% mais adesão",
    descEn: "Ask 8x more and have 40% more adherence",
    statPt: "40%",
    statLabelPt: "mais adesão",
    statLabelEn: "more adherence",
  },
  challenges: {
    icon: Trophy,
    titlePt: "Desafios Semanais",
    titleEn: "Weekly Challenges",
    descPt: "Ganhe XP e suba no ranking competindo com outros usuários",
    descEn: "Earn XP and climb the leaderboard competing with other users",
    statPt: "2x",
    statLabelPt: "mais XP",
    statLabelEn: "more XP",
  },
  insights: {
    icon: TrendingUp,
    titlePt: "Insights de Saúde",
    titleEn: "Health Insights",
    descPt: "Receba análises personalizadas da sua rotina de saúde",
    descEn: "Receive personalized analyses of your health routine",
    statPt: "23",
    statLabelPt: "insights/mês",
    statLabelEn: "insights/month",
  },
};

import { Trophy } from "lucide-react";

export default function PremiumTeaser({ feature, compact, className }: PremiumTeaserProps) {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { language } = useLanguage();
  
  // Don't show for premium users
  if (isPremium) return null;
  
  const config = FEATURE_CONFIG[feature];
  const Icon = config.icon;
  const title = language === 'pt' ? config.titlePt : config.titleEn;
  const desc = language === 'pt' ? config.descPt : config.descEn;
  const statLabel = language === 'pt' ? config.statLabelPt : config.statLabelEn;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Card 
          className="p-3 cursor-pointer border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:border-primary/40 transition-all"
          onClick={() => navigate("/planos")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted-foreground truncate">{desc}</p>
            </div>
            <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                <Lock className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{config.statPt}</p>
              <p className="text-xs text-muted-foreground">{statLabel}</p>
            </div>
          </div>
          
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{desc}</p>
          
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => navigate("/planos")}
          >
            <Crown className="h-4 w-4 mr-2" />
            {language === 'pt' ? 'Desbloquear agora' : 'Unlock now'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
