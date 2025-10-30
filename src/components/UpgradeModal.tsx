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
    medication: "adicionar mais de 3 medicamentos",
    document: "salvar mais de 1 documento",
    pdf: "gerar relatórios mensais em PDF",
    ocr: "usar OCR em documentos",
    profiles: "criar múltiplos perfis familiares"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade para Premium
          </DialogTitle>
          <DialogDescription>
            {feature && features[feature as keyof typeof features] 
              ? `Para ${features[feature as keyof typeof features]}, você precisa do plano Premium.`
              : "Desbloqueie todos os recursos com o plano Premium."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Medicamentos ilimitados</p>
                <p className="text-sm text-muted-foreground">Adicione quantos medicamentos precisar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Documentos ilimitados</p>
                <p className="text-sm text-muted-foreground">Guarde todos seus documentos de saúde</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">OCR inteligente</p>
                <p className="text-sm text-muted-foreground">Extraia dados de receitas e exames automaticamente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Relatórios mensais</p>
                <p className="text-sm text-muted-foreground">PDF com análise de adesão e alertas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">IA educativa</p>
                <p className="text-sm text-muted-foreground">Tire dúvidas sobre medicamentos e interações</p>
              </div>
            </div>
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
            Ver Planos Premium
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
