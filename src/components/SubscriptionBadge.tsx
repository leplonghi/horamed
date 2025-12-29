import { Crown, Clock, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionBadge() {
  const { isPremium, isFree, isOnTrial, trialDaysLeft, daysLeft, loading } = useSubscription();
  const navigate = useNavigate();
  
  if (loading) return null;
  
  // Trial badge with countdown
  if (isOnTrial && trialDaysLeft !== null) {
    const isUrgent = trialDaysLeft <= 2;
    return (
      <div 
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
          isUrgent 
            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 animate-pulse" 
            : "bg-primary/10 text-primary"
        }`}
        onClick={() => navigate("/planos")}
      >
        <Sparkles className="h-3 w-3" />
        <span className="text-xs font-medium">{trialDaysLeft}d</span>
      </div>
    );
  }
  
  if (isPremium) {
    return (
      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/90">
        <Crown className="h-3 w-3 text-yellow-300 fill-yellow-300" />
      </div>
    );
  }
  
  if (isFree && daysLeft !== null) {
    return (
      <div 
        className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer"
        onClick={() => navigate("/planos")}
      >
        <Clock className="h-3 w-3" />
        <span className="hidden sm:inline">{daysLeft > 0 ? `${daysLeft}d` : 'Exp'}</span>
      </div>
    );
  }
  
  return (
    <div 
      className="flex items-center justify-center h-6 w-6 rounded-full bg-muted cursor-pointer"
      onClick={() => navigate("/planos")}
    >
      <span className="text-[10px] font-medium text-muted-foreground">F</span>
    </div>
  );
}
