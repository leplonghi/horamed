import { motion } from "framer-motion";
import { Flame, Shield, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreakRiskAlertProps {
  currentStreak: number;
  hasPendingDoses?: boolean;
  className?: string;
}

export default function StreakRiskAlert({ currentStreak, hasPendingDoses, className }: StreakRiskAlertProps) {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { language } = useLanguage();

  // Only show if streak > 3 and has pending doses
  if (currentStreak < 3 || !hasPendingDoses) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-3 border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-full animate-pulse">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
              {language === 'pt' 
                ? `Sua sequência de ${currentStreak} dias está em risco!`
                : `Your ${currentStreak}-day streak is at risk!`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'pt'
                ? 'Complete as doses pendentes para manter'
                : 'Complete pending doses to maintain it'
              }
            </p>
          </div>
          
          {!isPremium && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-orange-500/30 hover:bg-orange-500/10"
              onClick={() => navigate("/planos")}
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              {language === 'pt' ? 'Proteção' : 'Protection'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
