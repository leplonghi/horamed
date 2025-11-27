import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export default function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const navigate = useNavigate();

  const features = {
    medication: "adicionar mais de 1 medicamento ativo",
    document: "salvar mais documentos",
    pdf: "gerar relatórios mensais em PDF",
    ocr: "usar OCR em documentos",
    profiles: "criar múltiplos perfis familiares",
    ai_agent: "usar o assistente de IA"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Desbloqueie o melhor do HoraMed
          </DialogTitle>
          <DialogDescription>
            {feature === 'ai_agent' ? (
              <>
                Você usou as 2 consultas diárias do plano grátis. Para continuar, você pode assinar o Premium ou indicar amigos para liberar mais recursos.
              </>
            ) : feature && features[feature as keyof typeof features] ? (
              `Para ${features[feature as keyof typeof features]}, você precisa do plano Premium.`
            ) : (
              "Tenha controle total dos seus medicamentos, suplementos e da sua rotina de saúde sem limites."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Medicamentos ativos ilimitados</p>
                <p className="text-sm text-muted-foreground">Adicione quantos medicamentos precisar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">IA liberada</p>
                <p className="text-sm text-muted-foreground">Consultas ilimitadas ao assistente inteligente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Carteira de Saúde ilimitada</p>
                <p className="text-sm text-muted-foreground">Guarde todos seus documentos de saúde</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Relatório mensal para consultas</p>
                <p className="text-sm text-muted-foreground">PDF com análise completa de progresso</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Alertas mais inteligentes</p>
                <p className="text-sm text-muted-foreground">Previsões automáticas e alertas personalizados</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-primary">R$ 19,90/mês</p>
              <p className="text-xs text-muted-foreground">Menos de R$ 0,67/dia</p>
              <p className="text-xs text-accent-foreground font-medium mt-1">🎁 7 dias grátis</p>
            </div>
            
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate('/planos');
              }}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Assinar Premium agora
            </Button>
            
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate('/perfil');
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Indique e ganhe benefícios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
