import { motion } from "framer-motion";
import { AlertTriangle, Crown, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface UsageLimitWarningProps {
  current: number;
  max: number;
  type: 'medications' | 'documents' | 'ai';
  className?: string;
}

const TYPE_CONFIG = {
  medications: {
    labelPt: "medicamentos ativos",
    labelEn: "active medications",
    urgencyThreshold: 1,
  },
  documents: {
    labelPt: "documentos salvos",
    labelEn: "saved documents",
    urgencyThreshold: 4,
  },
  ai: {
    labelPt: "perguntas à Clara hoje",
    labelEn: "Clara questions today",
    urgencyThreshold: 2,
  },
};

export default function UsageLimitWarning({ current, max, type, className }: UsageLimitWarningProps) {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { language } = useLanguage();

  // Don't show for premium users
  if (isPremium) return null;
  
  const config = TYPE_CONFIG[type];
  const percentage = (current / max) * 100;
  const isUrgent = current >= config.urgencyThreshold;
  const isAtLimit = current >= max;
  const label = language === 'pt' ? config.labelPt : config.labelEn;

  // Only show when at 50% or more usage
  if (percentage < 50) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Card className={`p-3 ${isAtLimit ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20' : isUrgent ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' : 'border-primary/20 bg-primary/5'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isAtLimit ? 'bg-red-500/10' : isUrgent ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
            {isAtLimit ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Zap className={`h-4 w-4 ${isUrgent ? 'text-amber-500' : 'text-primary'}`} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {current}/{max} {label}
              </span>
              {isAtLimit && (
                <span className="text-xs text-red-500 font-medium">
                  {language === 'pt' ? 'Limite atingido!' : 'Limit reached!'}
                </span>
              )}
            </div>
            <Progress 
              value={percentage} 
              className={`h-1.5 ${isAtLimit ? '[&>div]:bg-red-500' : isUrgent ? '[&>div]:bg-amber-500' : ''}`}
            />
          </div>
          
          <Button
            size="sm"
            variant={isAtLimit ? "default" : "outline"}
            className="shrink-0"
            onClick={() => navigate("/planos")}
          >
            <Crown className="h-3.5 w-3.5 mr-1" />
            {language === 'pt' ? 'Ilimitado' : 'Unlimited'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
