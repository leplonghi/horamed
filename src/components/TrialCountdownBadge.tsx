import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { Crown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TrialCountdownBadge() {
  const { isOnTrial, trialDaysLeft, isPremium, isFree, daysLeft } = useSubscription();
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Show trial countdown
  if (isOnTrial && trialDaysLeft !== null) {
    const isUrgent = trialDaysLeft <= 2;
    
    return (
      <Badge
        variant="outline"
        className={`cursor-pointer gap-1.5 px-3 py-1 ${
          isUrgent 
            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse" 
            : "border-primary/30 bg-primary/5 text-primary"
        }`}
        onClick={() => navigate("/planos")}
      >
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">
          {language === 'pt' 
            ? `Trial: ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'}`
            : `Trial: ${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'}`
          }
        </span>
      </Badge>
    );
  }

  // Show premium badge
  if (isPremium) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 px-3 py-1 border-amber-500/50 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-400"
      >
        <Crown className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Premium</span>
      </Badge>
    );
  }

  // Show free with days left
  if (isFree && daysLeft !== null && daysLeft > 0) {
    const isExpiring = daysLeft <= 3;
    
    return (
      <Badge
        variant="outline"
        className={`cursor-pointer gap-1.5 px-3 py-1 ${
          isExpiring 
            ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
            : "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
        }`}
        onClick={() => navigate("/planos")}
      >
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">
          {language === 'pt' 
            ? `${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} restantes`
            : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`
          }
        </span>
      </Badge>
    );
  }

  // Free expired - show upgrade prompt
  if (isFree) {
    return (
      <Badge
        variant="outline"
        className="cursor-pointer gap-1.5 px-3 py-1 border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        onClick={() => navigate("/planos")}
      >
        <Crown className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">
          {language === 'pt' ? "Seja Premium" : "Go Premium"}
        </span>
      </Badge>
    );
  }

  return null;
}
