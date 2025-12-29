import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CheckCircle2, Crown, Calendar, CreditCard, 
  ArrowLeft, AlertCircle, Sparkles, XCircle, 
  AlertTriangle, Heart, TrendingDown, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PaymentMethodModal } from "@/components/PaymentMethodModal";

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, isPremium, isFree, isExpired, daysLeft, loading, refresh } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelStep, setCancelStep] = useState<'confirm' | 'fomo' | 'final'>('confirm');
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  // Calculate if within 7-day free cancellation window
  const daysSubscribed = subscription?.started_at 
    ? differenceInDays(new Date(), new Date(subscription.started_at)) 
    : 0;
  const isWithinFreeCancellation = daysSubscribed <= 7;

  // Check for payment update success
  useEffect(() => {
    if (searchParams.get('payment_updated') === 'true') {
      toast.success("Forma de pagamento atualizada com sucesso!");
      // Remove the query param
      window.history.replaceState({}, '', '/assinatura');
    }
  }, [searchParams]);

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const handleCancelClick = () => {
    setCancelStep('confirm');
    setShowCancelDialog(true);
  };

  const handleCancelProceed = () => {
    if (cancelStep === 'confirm') {
      setCancelStep('fomo');
    } else if (cancelStep === 'fomo') {
      setCancelStep('final');
    }
  };

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { immediate: isWithinFreeCancellation }
      });
      
      if (error) throw error;
      
      if (isWithinFreeCancellation) {
        toast.success("Assinatura cancelada. Você não será cobrado.");
      } else {
        toast.success("Assinatura será cancelada ao final do período atual.");
      }
      
      setShowCancelDialog(false);
      refresh();
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error("Erro ao cancelar assinatura. Tente novamente.");
    } finally {
      setCancelingSubscription(false);
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
                     subscription?.status === 'expired' ? 'Expirado' : 
                     subscription?.status === 'trial' ? 'Trial' : 'Inativo'}
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
                      <span>Assistente de saúde com IA</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Relatórios mensais</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Sem anúncios</span>
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
                variant="default" 
                className="w-full"
                onClick={handleOpenPaymentModal}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Alterar Forma de Pagamento
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleCancelClick}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Assinatura
              </Button>
              
              {isWithinFreeCancellation && (
                <p className="text-xs text-center text-muted-foreground">
                  Você está dentro do período de 7 dias. Cancele sem custos.
                </p>
              )}
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

      {/* Cancel Dialog with FOMO */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-md">
          {cancelStep === 'confirm' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Tem certeza que quer cancelar?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    {isWithinFreeCancellation 
                      ? "Você está dentro do período de 7 dias. Seu cancelamento será imediato e você não será cobrado."
                      : "Sua assinatura continuará ativa até o final do período pago. Após isso, você perderá acesso aos recursos Premium."}
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <Button variant="destructive" onClick={handleCancelProceed}>
                  Continuar cancelamento
                </Button>
              </AlertDialogFooter>
            </>
          )}

          {cancelStep === 'fomo' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center text-xl">
                  😢 Vamos sentir sua falta!
                </AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Sua saúde é importante</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Usuários Premium têm 73% mais adesão ao tratamento do que usuários gratuitos.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Você perderá acesso a:</p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        <li>• Medicamentos ilimitados</li>
                        <li>• OCR de receitas médicas</li>
                        <li>• Assistente de saúde com IA</li>
                        <li>• Relatórios mensais detalhados</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-primary/10 border-primary/30">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Oferta especial para você!</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Que tal pausar por 1 mês ao invés de cancelar? Você mantém seu histórico e dados.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                <Button 
                  className="w-full" 
                  onClick={() => setShowCancelDialog(false)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Manter meu Premium
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground"
                  onClick={handleCancelProceed}
                >
                  Continuar com cancelamento
                </Button>
              </AlertDialogFooter>
            </>
          )}

          {cancelStep === 'final' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Confirmar Cancelamento
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isWithinFreeCancellation ? (
                    <p>
                      Sua assinatura será <strong>cancelada imediatamente</strong> e você não será cobrado.
                    </p>
                  ) : (
                    <p>
                      Sua assinatura permanecerá ativa até <strong>
                        {subscription?.expires_at 
                          ? format(new Date(subscription.expires_at), "dd 'de' MMMM", { locale: ptBR })
                          : 'o final do período'}
                      </strong>. Após essa data, você será rebaixado para o plano gratuito.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelingSubscription}>
                  Voltar
                </AlertDialogCancel>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                >
                  {cancelingSubscription ? "Cancelando..." : "Confirmar Cancelamento"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Method Modal */}
      <PaymentMethodModal 
        open={showPaymentModal} 
        onOpenChange={setShowPaymentModal}
        onSuccess={refresh}
      />
    </div>
  );
}
