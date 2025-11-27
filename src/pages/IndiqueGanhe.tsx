import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Copy, Share2, Gift, Crown, Users, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getReferralDiscountForUser, getFreeExtraSlotsForUser } from "@/lib/referrals";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function IndiqueGanhe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [extraSlots, setExtraSlots] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      // Get user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Get referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      setReferrals(referralsData || []);

      // Calculate rewards
      if (isPremium) {
        const discountValue = await getReferralDiscountForUser(user.id);
        setDiscount(discountValue);
      } else {
        const slots = await getFreeExtraSlotsForUser(user.id, new Date());
        setExtraSlots(slots);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Código copiado!');
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'HoraMed',
      text: `Use meu código ${referralCode} e ganhe acesso ao melhor app de organização de saúde!`,
      url: `${window.location.origin}/auth?ref=${referralCode}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyReferralCode();
      }
    } else {
      copyReferralCode();
    }
  };

  const activeReferrals = referrals.filter(r => r.status === 'active').length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6 pt-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Indique e Ganhe</h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Referral Code Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center relative">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Seu código de indicação</h3>
              <div className="inline-flex items-center gap-2 bg-background px-6 py-3 rounded-lg text-2xl font-mono font-bold border-2 border-primary/20">
                {referralCode || 'Carregando...'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                📲 Compartilhe por WhatsApp, email ou redes sociais
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyReferralCode} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copiar código
              </Button>
              <Button onClick={shareReferral} className="flex-1 bg-primary">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </Card>

        {/* Rewards Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {isPremium ? (
                <Crown className="h-5 w-5 text-yellow-500" />
              ) : (
                <Users className="h-5 w-5 text-primary" />
              )}
              <h3 className="font-semibold text-lg">
                {isPremium ? 'Seus descontos' : 'Suas recompensas'}
              </h3>
            </div>

            {isPremium ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Desconto acumulado</span>
                    <span className="font-bold">{discount}%</span>
                  </div>
                  <Progress value={discount} className="h-2" />
                </div>
                
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <strong>Plano mensal:</strong> 20% de desconto por amigo
                  </p>
                  <p className="text-sm">
                    <strong>Plano anual:</strong> 40% de desconto por amigo
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cada amigo que assinar o Premium reduz sua mensalidade. Você pode chegar até 100% de desconto.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Slots extras desbloqueados</span>
                    <span className="font-bold">{extraSlots}/3</span>
                  </div>
                  <Progress value={(extraSlots / 3) * 100} className="h-2" />
                </div>
                
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    Cada amigo que assinar o Premium libera mais <strong>1 medicamento ativo</strong> para você usar na versão grátis.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Máximo de 3 slots extras por mês = 4 itens ativos no total.
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Referrals List */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            Suas indicações ({activeReferrals})
          </h3>

          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Você ainda não tem indicações.</p>
              <p className="text-xs mt-2">Compartilhe seu código e comece a ganhar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Indicação #{referral.id.slice(0, 8)}
                      </span>
                      {referral.status === 'active' && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                          Ativa
                        </span>
                      )}
                      {referral.status === 'pending' && (
                        <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  {referral.status === 'active' && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-500">
                        {referral.plan_type === 'premium_monthly' && '+20%'}
                        {referral.plan_type === 'premium_annual' && '+40%'}
                        {referral.plan_type === 'free' && '+1 slot'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <p className="text-sm text-center">
            💡 <strong>Dica:</strong> Compartilhe seu código nas redes sociais, grupos de família ou amigos. Quanto mais pessoas usarem, mais benefícios você ganha!
          </p>
        </Card>
      </div>
    </div>
  );
}
