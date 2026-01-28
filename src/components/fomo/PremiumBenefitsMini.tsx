import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface PremiumBenefitsMiniProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

const BENEFITS_PT = [
  "Medicamentos ilimitados",
  "Clara IA sem limites",
  "Relatórios para médico",
  "Proteção de sequência",
];

const BENEFITS_EN = [
  "Unlimited medications",
  "Unlimited Clara AI",
  "Medical reports",
  "Streak protection",
];

export default function PremiumBenefitsMini({ className, variant = 'horizontal' }: PremiumBenefitsMiniProps) {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { language } = useLanguage();

  if (isPremium) return null;

  const benefits = language === 'pt' ? BENEFITS_PT : BENEFITS_EN;

  if (variant === 'vertical') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card 
          className="p-4 cursor-pointer border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 hover:border-primary/40 transition-all"
          onClick={() => navigate("/planos")}
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-primary" />
            <span className="font-semibold">Premium</span>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              7 dias grátis
            </Badge>
          </div>
          
          <div className="space-y-2">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground line-through">R$ 29,90</span>
              <span className="text-lg font-bold text-primary">R$ 19,90</span>
              <span className="text-xs text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'pt' ? 'Menos de R$ 0,67/dia' : 'Less than $0.15/day'}
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <button
        type="button"
        onClick={() => navigate("/planos")}
        className="w-full py-3 px-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">
                {language === 'pt' ? 'Seja Premium' : 'Go Premium'}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'pt' ? '7 dias grátis • R$ 19,90/mês' : '7 days free • $3.99/mo'}
              </p>
            </div>
          </div>
          <Crown className="h-5 w-5 text-primary" />
        </div>
      </button>
    </motion.div>
  );
}
