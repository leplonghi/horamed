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
      <button 
        type="button"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
          isUrgent 
            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 animate-pulse" 
            : "bg-primary/10 text-primary hover:bg-primary/20"
        }`}
        onClick={() => navigate("/planos")}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Trial {trialDaysLeft}d</span>
      </button>
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
      <button 
        type="button"
        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        onClick={() => navigate("/planos")}
      >
        <Clock className="h-3.5 w-3.5" />
        <span>{daysLeft > 0 ? `${daysLeft}d` : 'Expirado'}</span>
      </button>
    );
  }
  
  return (
    <button 
      type="button"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
      onClick={() => navigate("/planos")}
    >
      <Crown className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">Premium</span>
    </button>
  );
}
