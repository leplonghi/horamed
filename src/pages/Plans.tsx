import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Crown, Shield, Sparkles, Coffee, Candy, Star, TrendingUp, Users, Gift } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { activateReferralOnUpgrade } from "@/lib/referralProcessor";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Usuária há 8 meses",
    avatar: "MS",
    text: "Minha adesão melhorou 95%! O app me salvou de esquecer remédios importantes.",
    rating: 5
  },
  {
    name: "Dr. João Santos",
    role: "Cardiologista",
    avatar: "JS",
    text: "Recomendo para meus pacientes. Os relatórios são perfeitos para consultas.",
    rating: 5
  },
  {
    name: "Ana Costa",
    role: "Cuidadora de idosos",
    avatar: "AC",
    text: "Essencial! Gerencio os medicamentos dos meus pais sem estresse.",
    rating: 5
  }
];

export default function Plans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [referralCode, setReferralCode] = useState("");
  const { isPremium, subscription } = useSubscription();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Processar referral code se fornecido
      if (referralCode.trim()) {
        const { error: referralError } = await supabase
          .from('referrals')
          .insert({
            referrer_user_id: user.id,
            referral_code_used: referralCode.trim().toUpperCase(),
            plan_type: billingCycle === "monthly" ? "premium_monthly" : "premium_annual",
            status: "pending"
          });
        
        if (referralError) {
          console.error('Referral error:', referralError);
          toast.error("Código de indicação inválido");
          setLoading(false);
          return;
        }
      }

      // Processar referral se houver pendente
      const planType = billingCycle === "monthly" ? "premium_monthly" : "premium_annual";
      await activateReferralOnUpgrade(user.id, planType);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          userId: user.id,
          planType: billingCycle
        }
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
    "Acesso limitado ao histórico",
    "Com anúncios"
  ];

  const premiumPlanFeatures = [
    "💊 Medicamentos ilimitados",
    "🌿 Acompanhe sua rotina de suplementos e vitaminas",
    "📋 Histórico médico completo e seguro",
    "🔬 Análise de exames laboratoriais",
    "📅 Agenda médica integrada",
    "📈 Widgets de bem-estar no Hoje e no Progresso",
    "✨ Análise de interações medicamentosas",
    "🍎 Análises nutricionais mensais (Premium)",
    "👨‍👩‍👧‍👦 Múltiplos perfis familiares",
    "🤖 Uso ilimitado do Assistente Hora para dúvidas de treino, GLP-1 e desempenho",
    "🤖 OCR de receitas e documentos",
    "🚫 Sem anúncios",
    "⚡ Suporte prioritário"
  ];

  const monthlyPrice = 19.90;
  const annualPrice = 199.90;
  const annualMonthlyEquivalent = (annualPrice / 12).toFixed(2);
  const annualSavings = (monthlyPrice * 12 - annualPrice).toFixed(2);

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-4xl mx-auto">
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
          <h1 className="text-xl font-bold text-foreground">Planos</h1>
        </div>

        {/* Hero Section - Social Proof */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Junte-se a mais de 10.000+ usuários
            </h2>
            <p className="text-muted-foreground">
              que transformaram seu cuidado com a saúde
            </p>
            
            {/* Métricas de impacto */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-foreground">91%</p>
                </div>
                <p className="text-xs text-muted-foreground">Adesão média</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-foreground">3M+</p>
                </div>
                <p className="text-xs text-muted-foreground">Doses registradas</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-foreground">4.8</p>
                </div>
                <p className="text-xs text-muted-foreground">Avaliação média</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Button
            variant={billingCycle === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("monthly")}
          >
            Mensal
          </Button>
          <Button
            variant={billingCycle === "annual" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("annual")}
            className="relative"
          >
            Anual
            <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
              Economize {annualSavings}
            </Badge>
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-4">
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
                  Começar agora
                </Button>
              )}
            </div>
          </Card>

          {/* Premium Plan */}
          <Card className="p-4 border-2 border-primary bg-primary/5 relative overflow-hidden">
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge className="bg-destructive text-destructive-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                🔥 Mais popular
              </Badge>
            </div>

            <div className="space-y-4 mt-8">
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
                  {billingCycle === "monthly" ? (
                    <>
                      <p className="text-3xl font-bold text-foreground">
                        R$ {monthlyPrice.toFixed(2).replace('.', ',')}
                        <span className="text-base font-normal text-muted-foreground">/mês</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Cobrado mensalmente</p>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-foreground">
                          R$ {annualMonthlyEquivalent.replace('.', ',')}
                          <span className="text-base font-normal text-muted-foreground">/mês</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          R$ {annualPrice.toFixed(2).replace('.', ',')} cobrados anualmente
                        </p>
                        <Badge variant="secondary" className="gap-1">
                          ✨ Melhor valor - Economize R$ {annualSavings}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* Daily Cost Comparison */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Candy className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Apenas R$ {billingCycle === "monthly" ? "0,66" : "0,55"} por dia
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Menos que uma bala! 🍬 Cuide da sua saúde com tecnologia de ponta.
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
                <div className="space-y-3">
                  {/* Referral Code Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      Tem um código de indicação?
                    </label>
                    <Input
                      placeholder="Ex: HR-ABC123"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="text-center font-mono"
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Ganhe benefícios extras com código de amigos
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "🎁 Experimente 7 dias grátis"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Sem compromisso • Cancele quando quiser
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Testimonials Section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold text-foreground text-center">
            O que nossos usuários dizem
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <Card className="p-4 bg-muted/30">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Pagamento 100% seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Aprovado por médicos</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">+10.000 usuários satisfeitos</span>
            </div>
          </div>
        </Card>

        {/* Security Info */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Pagamento seguro via Stripe</p>
              <p className="text-xs text-muted-foreground">
                Seus dados são protegidos e criptografados. Cancele quando quiser, sem taxas.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
