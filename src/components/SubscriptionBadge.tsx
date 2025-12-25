import { Crown, Clock, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionBadge() {
  const { isPremium, isFree, daysLeft, loading } = useSubscription();
  
  if (loading) return null;
  
  if (isPremium) {
    return (
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30">
        <Crown className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      </div>
    );
  }
  
  if (isFree && daysLeft !== null) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="hidden sm:inline">{daysLeft > 0 ? `${daysLeft}d` : 'Exp'}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
      <span className="text-[10px] font-medium text-muted-foreground">F</span>
    </div>
  );
}