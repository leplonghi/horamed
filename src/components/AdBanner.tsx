import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

export default function AdBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { hasFeature } = useSubscription();

  if (hasFeature('no_ads') || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 mb-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            Remova anúncios e desbloqueie todas as funcionalidades!
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            Com o Plano Premium por apenas R$ 9,90/mês você tem acesso ilimitado, sem anúncios e muito mais.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/planos')}
            className="text-xs h-8"
          >
            Conhecer o Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
