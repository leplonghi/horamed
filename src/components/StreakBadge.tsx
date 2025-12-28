import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreakBadgeProps {
  streak: number;
  type?: 'current' | 'longest' | 'improving';
  className?: string;
}

export default function StreakBadge({ 
  streak, 
  type = 'current',
  className 
}: StreakBadgeProps) {
  const { t } = useLanguage();
  
  const config = {
    current: {
      icon: Flame,
      label: t('streak.sequence'),
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
    longest: {
      icon: Trophy,
      label: t('streak.record'),
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    improving: {
      icon: TrendingUp,
      label: t('streak.improving'),
      color: "bg-green-500/10 text-green-600 border-green-500/20",
    },
  };

  const { icon: Icon, label, color } = config[type];

  if (streak === 0) return null;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 px-3 py-1 animate-scale-in",
        color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold">{streak} {t('streak.days')}</span>
      <span className="text-xs opacity-75">{label}</span>
    </Badge>
  );
}
