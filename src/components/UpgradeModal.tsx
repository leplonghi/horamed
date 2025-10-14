import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export default function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/planos');
  };

  const features = {
    free: [
      { text: 'Apenas 1 medicamento', included: true },
      { text: 'Apenas 1 perfil', included: true },
      { text: '3 dias de teste grátis', included: true },
      { text: 'Anúncios atrapalhando alertas urgentes', included: true, negative: true },
      { text: 'Proteção Inteligente (alerta de interações)', included: false },
      { text: 'Análise preditiva de adesão', included: false },
      { text: 'Múltiplos perfis (família)', included: false },
    ],
    premium: [
      { text: '✨ Proteção Inteligente salva vidas', included: true, highlight: true },
      { text: '🎯 Descubra POR QUE você esquece às terças', included: true, highlight: true },
      { text: '👨‍👩‍👧‍👦 Cuide de toda família em 1 conta', included: true, highlight: true },
      { text: '📊 Seu médico vai ADORAR seu histórico', included: true },
      { text: '🚫 Nada de propagandas atrapalhando', included: true },
      { text: '🤖 OCR de receitas médicas', included: true },
      { text: '⚡ Suporte prioritário', included: true },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Desbloqueie todo o potencial do HoraMed
          </DialogTitle>
          <DialogDescription>
            {feature 
              ? `A funcionalidade "${feature}" está disponível apenas no plano Premium.`
              : 'Você atingiu o limite do plano gratuito.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 my-4">
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-3 text-muted-foreground">Plano Gratuito</h3>
            <ul className="space-y-2">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {feature.included ? (
                    feature.negative ? (
                      <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <span className={feature.included && !feature.negative ? '' : 'text-muted-foreground'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              RECOMENDADO
            </div>
            <h3 className="font-semibold mb-1">Plano Premium</h3>
            <div className="mb-3">
              <span className="text-3xl font-bold">R$ 9,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <ul className="space-y-2 mb-4">
              {features.premium.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className={feature.highlight ? 'font-semibold text-foreground' : 'font-medium'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              Fazer Upgrade Agora
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Cancele quando quiser, sem taxas adicionais
        </p>
      </DialogContent>
    </Dialog>
  );
}
