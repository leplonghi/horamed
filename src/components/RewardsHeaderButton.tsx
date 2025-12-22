import { Star, Sparkles, Gift, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useReferralSystem } from "@/hooks/useReferralSystem";

export function RewardsHeaderButton() {
  const navigate = useNavigate();
  const { headerState, stats } = useReferralSystem();

  const getButtonContent = () => {
    switch (headerState) {
      case 'new_referral':
        return {
          icon: <Gift className="h-4 w-4" />,
          text: "Nova Recompensa!",
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse",
        };
      case 'discount_earned':
        return {
          icon: <Sparkles className="h-4 w-4" />,
          text: "Desconto ganho!",
          className: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
        };
      case 'goal_close':
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          text: "Falta pouco…",
          className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
        };
      default:
        return {
          icon: <Star className="h-4 w-4" />,
          text: "Recompensas",
          className: "bg-primary/10 text-primary hover:bg-primary/20",
        };
    }
  };

  const content = getButtonContent();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/recompensas")}
      className={`gap-2 rounded-full px-4 ${content.className}`}
    >
      {content.icon}
      <span className="hidden sm:inline">{content.text}</span>
      {stats.discountPercent > 0 && (
        <span className="ml-1 text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
          {stats.discountPercent}%
        </span>
      )}
    </Button>
  );
}
