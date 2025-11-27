import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'ai_agent' | 'active_items' | 'documents' | 'report';
  triggerReason?: string; // Legacy support
}

export default function PaywallDialog({ open, onOpenChange, feature }: PaywallDialogProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/plans');
  };

  const handleReferrals = () => {
    onOpenChange(false);
    navigate('/perfil/indique-e-ganhe');
  };

  const getFeatureMessage = () => {
    switch (feature) {
      case 'ai_agent':
        return 'Você usou as 2 consultas diárias do plano grátis. No Premium, a IA é liberada.';
      case 'active_items':
        return 'Você atingiu o limite de itens ativos do plano grátis.';
      case 'documents':
        return 'Você atingiu o limite de documentos do plano grátis.';
      case 'report':
        return 'O relatório mensal é exclusivo do Premium.';
      default:
        return 'Este recurso é exclusivo do plano Premium.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            Desbloqueie o melhor do HoraMed
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {getFeatureMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <p className="text-sm text-muted-foreground text-center">
            Tenha controle total dos seus medicamentos, suplementos e da sua rotina de saúde sem limites.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Medicamentos ativos ilimitados</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">IA liberada sem limites</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Carteira de Saúde ilimitada</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Relatório mensal para consultas</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Alertas mais inteligentes e previsões automáticas</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-foreground mb-1">R$ 19,90</div>
            <div className="text-sm text-muted-foreground">por mês</div>
            <div className="text-xs text-accent-foreground font-medium mt-2">🎁 7 dias grátis</div>
          </div>

          <div className="space-y-2 text-center text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              Menos de R$ 0,67/dia para organizar sua rotina
            </p>
            <p>Você está a 1 clique de transformar sua saúde</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleUpgrade} 
            className="w-full"
            size="lg"
          >
            <Crown className="h-4 w-4 mr-2" />
            Assinar Premium agora
          </Button>
          
          <Button 
            onClick={handleReferrals} 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            <Users className="h-4 w-4 mr-2" />
            Indique e ganhe benefícios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
