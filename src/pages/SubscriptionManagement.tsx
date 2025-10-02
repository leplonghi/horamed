import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CheckCircle2, Crown, Calendar, CreditCard, 
  ArrowLeft, AlertCircle, Sparkles 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const { subscription, isPremium, isFree, isExpired, daysLeft, loading, refresh } = useSubscription();
  const [canceling, setCanceling] = useState(false);

  const handleCancelSubscription = async () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos Premium.")) {
      return;
    }

    setCanceling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Update subscription to cancelled
      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Assinatura cancelada com sucesso");
      refresh();
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error("Erro ao cancelar assinatura");
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivate = () => {
    navigate("/planos");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Gerenciar Assinatura</h1>
        </div>

        {/* Current Plan Card */}
        <Card className={`p-6 ${isPremium ? 'border-2 border-primary' : ''}`}>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full ${isPremium ? 'bg-primary' : 'bg-muted'} flex items-center justify-center`}>
                  {isPremium ? (
                    <Crown className="h-6 w-6 text-white" />
                  ) : (
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Plano {isPremium ? 'Premium' : 'Gratuito'}
                  </h2>
                  <Badge 
                    variant={isPremium ? 'default' : isExpired ? 'destructive' : 'secondary'}
                    className="mt-1"
                  >
                    {subscription?.status === 'active' ? 'Ativo' : 
                     subscription?.status === 'cancelled' ? 'Cancelado' : 
                     subscription?.status === 'expired' ? 'Expirado' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Plan Details */}
            <div className="space-y-3 pt-4 border-t">
              {subscription?.started_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Início
                  </span>
                  <span className="font-medium">
                    {format(new Date(subscription.started_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              {subscription?.expires_at && !isPremium && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expira em
                  </span>
                  <span className="font-medium">
                    {format(new Date(subscription.expires_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    {daysLeft !== null && daysLeft > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({daysLeft} dias)
                      </span>
                    )}
                  </span>
                </div>
              )}

              {isPremium && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Renovação
                  </span>
                  <span className="font-medium">Automática</span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-sm text-muted-foreground">Recursos inclusos:</h3>
              <div className="space-y-2">
                {isPremium ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Medicamentos ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>OCR de receitas médicas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Gráficos avançados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Sem anúncios</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Suporte prioritário</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>1 medicamento</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Recursos limitados</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {isPremium ? (
            <>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/planos")}
              >
                Ver outros planos
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleCancelSubscription}
                disabled={canceling}
              >
                {canceling ? "Cancelando..." : "Cancelar Assinatura"}
              </Button>
            </>
          ) : (
            <>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleReactivate}
              >
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade para Premium
              </Button>
              {isExpired && (
                <Card className="p-4 bg-destructive/10 border-destructive/20">
                  <p className="text-sm text-destructive">
                    Seu período de teste expirou. Faça upgrade para continuar usando todos os recursos.
                  </p>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Support Info */}
        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Precisa de ajuda?</span> Entre em contato conosco através da seção "Ajuda e suporte" no perfil.
          </p>
        </Card>
      </div>
    </div>
  );
}
