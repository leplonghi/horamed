import { Badge } from '@/components/ui/badge';
import { Crown, Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionBadge() {
  const { isPremium, isFree, daysLeft, loading } = useSubscription();

  if (loading) return null;

  if (isPremium) {
    return (
      <Badge variant="default" className="gap-1">
        <Crown className="h-3 w-3" />
        Premium
      </Badge>
    );
  }

  if (isFree && daysLeft !== null) {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirado'}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      Gratuito
    </Badge>
  );
}
