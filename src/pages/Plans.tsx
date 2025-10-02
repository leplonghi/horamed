import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Crown, Shield, Sparkles, Coffee, Candy } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

export default function Plans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isPremium, subscription } = useSubscription();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { userId: user.id }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    toast.info("Gerenciamento de assinatura em desenvolvimento");
  };

  const freePlanFeatures = [
    "1 medicamento ativo",
    "Notificações básicas",
    "Com anúncios",
    
  ];

  const premiumPlanFeatures = [
    "Medicamentos ilimitados",
    "Sem anúncios",
    "OCR de receitas médicas",
    "Histórico completo",
    "Arquivo de ocorrências por IA",
    "Integração de calendário",
    "Suporte prioritário"
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Planos</h1>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm px-2">
          Escolha o plano ideal para gerenciar seus medicamentos e cuidados de saúde
        </p>

        {/* Free Plan */}
        <Card className="p-4 border-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Gratuito</h3>
                <p className="text-sm text-muted-foreground">Para experimentar o app</p>
              </div>
            </div>

            <div className="space-y-2">
              {freePlanFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <p className="text-2xl font-bold text-foreground">R$ 0</p>
              <p className="text-sm text-muted-foreground">3 dias de teste</p>
            </div>

            {!isPremium && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleUpgrade}
              >
                Upgrade para Premium
              </Button>
            )}
          </div>
        </Card>

        {/* Premium Plan */}
        <Card className="p-4 border-2 border-primary bg-primary/5 relative overflow-hidden">
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className="bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              Recomendado
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Premium</h3>
                <p className="text-sm text-muted-foreground">Acesso completo a todos os recursos</p>
              </div>
            </div>

            <div className="space-y-2">
              {premiumPlanFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Price Highlight */}
            <div className="pt-2 space-y-3">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  R$ 9,90<span className="text-base font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-sm text-muted-foreground">Cobrado mensalmente</p>
              </div>

              {/* Daily Cost Comparison */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Candy className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    Apenas R$ 0,33 por dia
                  </p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Menos que uma bala! 🍬 Cuide da sua saúde com tecnologia de ponta por menos de R$ 10/mês.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Mais barato que um cafézinho ☕
                  </p>
                </div>
              </div>
            </div>

            {isPremium ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleManageSubscription}
              >
                Gerenciar Assinatura
              </Button>
            ) : (
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? "Processando..." : "Assinar Premium"}
              </Button>
            )}
          </div>
        </Card>

        {/* Security Info */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Pagamento 100% seguro</p>
              <p className="text-xs text-muted-foreground">
                Seus dados são protegidos e criptografados. Pagamento processado via Stripe.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
