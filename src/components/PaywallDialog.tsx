import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Users, Sparkles, AlertTriangle, Timer, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'ai_agent' | 'active_items' | 'documents' | 'report';
  triggerReason?: string;
}

export default function PaywallDialog({ open, onOpenChange, feature }: PaywallDialogProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes in seconds

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/planos");
  };

  const handleReferrals = () => {
    onOpenChange(false);
    navigate("/perfil/indique-e-ganhe");
  };

  const getFeatureMessage = () => {
    switch (feature) {
      case "ai_agent":
        return {
          title: "Você atingiu o limite de IA",
          desc: "Usuários Premium perguntam em média 8x mais para a IA e têm 40% mais adesão.",
          stat: "40%",
          statLabel: "mais adesão"
        };
      case "active_items":
        return {
          title: "Você precisa de mais medicamentos",
          desc: "73% dos usuários que tomam mais de 1 medicamento fazem upgrade no primeiro mês.",
          stat: "73%",
          statLabel: "fazem upgrade"
        };
      case "documents":
        return {
          title: "Sua carteira está cheia",
          desc: "Usuários Premium guardam em média 23 documentos e nunca perdem uma receita.",
          stat: "23",
          statLabel: "docs em média"
        };
      case "report":
        return {
          title: "Relatório exclusivo Premium",
          desc: "Médicos preferem pacientes que chegam com relatórios organizados.",
          stat: "92%",
          statLabel: "dos médicos aprovam"
        };
      default:
        return {
          title: "Recurso Premium",
          desc: "Desbloqueie todo o potencial do HoraMed.",
          stat: "7",
          statLabel: "dias grátis"
        };
    }
  };

  const msg = getFeatureMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* Urgency Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2 px-4 -mx-6 -mt-6 mb-4 rounded-t-lg">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Timer className="w-4 h-4 animate-pulse" />
              <span>Oferta expira em {formatTime(countdown)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            {msg.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {msg.desc}
          </DialogDescription>
        </DialogHeader>

        {/* Stats FOMO */}
        <div className="flex justify-center gap-6 my-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{msg.stat}</p>
            <p className="text-xs text-muted-foreground">{msg.statLabel}</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">7</p>
            <p className="text-xs text-muted-foreground">dias grátis</p>
          </div>
        </div>

        <div className="space-y-4 my-4">
          {/* What you're missing */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Você está perdendo:</strong> lembretes por WhatsApp, 
                relatórios para médico, e gestão ilimitada de medicamentos.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              "Medicamentos ilimitados",
              "IA liberada sem limites",
              "Relatório mensal para consultas",
              "WhatsApp + Push + Alarme"
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-muted-foreground line-through">R$ 29,90</span>
              <span className="text-3xl font-bold text-foreground">R$ 19,90</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <Badge className="mt-2 bg-green-500/10 text-green-600 border-green-500/20">
              <Zap className="w-3 h-3 mr-1" />
              7 dias GRÁTIS
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Menos de R$ 0,67/dia</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleUpgrade} 
            className="w-full h-12 text-lg font-semibold animate-pulse"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Começar 7 Dias Grátis
          </Button>
          
          <Button 
            onClick={handleReferrals} 
            variant="ghost" 
            className="w-full text-sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Ou indique amigos e ganhe benefícios
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Sem compromisso • Cancele quando quiser
        </p>
      </DialogContent>
    </Dialog>
  );
}
