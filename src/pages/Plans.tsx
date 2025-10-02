import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Loader2, ArrowLeft } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SubscriptionBadge from '@/components/SubscriptionBadge';

export default function Plans() {
  const [loading, setLoading] = useState(false);
  const { isPremium, subscription } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {},
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      toast({
        title: 'Redirecionando...',
        description: 'Abrindo portal de gerenciamento',
      });
      
      // In production, you would create a Stripe Customer Portal session
      // For now, we'll just show a message
      toast({
        title: 'Em desenvolvimento',
        description: 'Portal de gerenciamento em breve!',
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const freePlanFeatures = [
    'Cadastro de 1 medicamento',
    '3 dias de teste grátis',
    'Lembretes básicos',
    'Acesso ao calendário',
  ];

  const premiumPlanFeatures = [
    'Medicamentos ilimitados',
    'Uso ilimitado (sem expiração)',
    'Sem anúncios',
    'Gráficos avançados de adesão',
    'OCR de receitas médicas',
    'Suporte prioritário',
    'Backup automático na nuvem',
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Escolha seu plano</h1>
          <p className="text-muted-foreground">
            Gerencie seus medicamentos com eficiência
          </p>
          {subscription && (
            <div className="mt-4 flex justify-center">
              <SubscriptionBadge />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Gratuito</CardTitle>
              <CardDescription>Teste por 3 dias</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freePlanFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Plano Atual
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-primary shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Crown className="h-4 w-4" />
              RECOMENDADO
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-2xl flex items-center gap-2">
                Premium
                <Crown className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Recursos ilimitados</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">R$ 9,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {premiumPlanFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              {isPremium ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gerenciar Assinatura
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assinar Premium
                </Button>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Cancele quando quiser, sem multas
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Pagamento 100% seguro processado pela Stripe
          </p>
          <p className="mt-2">
            Tem dúvidas? Entre em contato conosco
          </p>
        </div>
      </div>
    </div>
  );
}
