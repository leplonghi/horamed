import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Copy, Share2, Gift, Crown, Users, Sparkles, ArrowLeft, Target, Percent, Award, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useReferralSystem } from "@/hooks/useReferralSystem";

export default function Recompensas() {
  const navigate = useNavigate();
  const { stats, loading, generateReferralLink, claimReward, isPremium } = useReferralSystem();

  const copyCode = () => {
    if (!stats.referralCode) return;
    navigator.clipboard.writeText(stats.referralCode);
    toast.success("Código copiado!");
  };

  const copyLink = () => {
    const link = generateReferralLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const shareWhatsApp = () => {
    const link = generateReferralLink();
    const text = `Use meu código ${stats.referralCode} no HoraMed e ganhe 7 dias Premium grátis! ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareSMS = () => {
    const link = generateReferralLink();
    const text = `Use meu código ${stats.referralCode} no HoraMed! ${link}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Recompensas & Indicações</h1>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Indique. Ganhe. Pague menos no Premium.
            </h2>
            <p className="text-muted-foreground">Cada indicação muda seu plano.</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">
        {/* Seção 1: Seu Código */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                <Gift className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Seu código de indicação</h3>
              <div className="inline-flex items-center gap-2 bg-background px-6 py-3 rounded-lg text-2xl font-mono font-bold border-2 border-primary/20">
                {stats.referralCode || "Carregando..."}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyCode} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copiar código
              </Button>
              <Button onClick={copyLink} className="flex-1 bg-primary">
                <Share2 className="h-4 w-4 mr-2" />
                Gerar link
              </Button>
            </div>
          </div>
        </Card>

        {/* Seção 2: Compartilhar */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Compartilhar
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={shareWhatsApp} variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              WhatsApp
            </Button>
            <Button onClick={shareSMS} variant="outline" className="gap-2">
              SMS
            </Button>
            <Button onClick={copyLink} variant="outline" className="gap-2 col-span-2">
              <Copy className="h-4 w-4" />
              Copiar link completo
            </Button>
          </div>
        </Card>

        {/* Seção 3: Progresso - Metas */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4" /> Progresso das Metas
          </h3>
          <div className="space-y-4">
            {/* Meta 10 cadastros */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>10 cadastros = 1 mês Premium</span>
                <span className="font-bold">{stats.goals.signups_10.current}/{stats.goals.signups_10.target}</span>
              </div>
              <Progress value={(stats.goals.signups_10.current / stats.goals.signups_10.target) * 100} className="h-2" />
              {stats.goals.signups_10.completed && <span className="text-xs text-green-500">✓ Concluída!</span>}
            </div>

            {/* Meta 5 assinaturas mensais */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>5 assinaturas mensais = 1 mês</span>
                <span className="font-bold">{stats.goals.monthly_subs_5.current}/{stats.goals.monthly_subs_5.target}</span>
              </div>
              <Progress value={(stats.goals.monthly_subs_5.current / stats.goals.monthly_subs_5.target) * 100} className="h-2" />
              {stats.goals.monthly_subs_5.completed && <span className="text-xs text-green-500">✓ Concluída!</span>}
            </div>

            {/* Meta 3 anuais */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>3 assinaturas anuais = 1 ano</span>
                <span className="font-bold">{stats.goals.annual_subs_3.current}/{stats.goals.annual_subs_3.target}</span>
              </div>
              <Progress value={(stats.goals.annual_subs_3.current / stats.goals.annual_subs_3.target) * 100} className="h-2" />
              {stats.goals.annual_subs_3.completed && <span className="text-xs text-green-500">✓ Concluída!</span>}
            </div>
          </div>
        </Card>

        {/* Seção 4: Desconto Premium */}
        {isPremium && (
          <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Percent className="h-4 w-4 text-yellow-500" /> Desconto Premium
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Desconto acumulado</span>
                <span className="text-2xl font-bold text-yellow-500">{stats.discountPercent}%</span>
              </div>
              <Progress value={stats.discountPercent} max={90} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Limite: 90% (15% por indicação) • {stats.cyclesRemaining} ciclos restantes este ano
              </p>
            </div>
          </Card>
        )}

        {/* Seção 5: Benefícios por cadastro */}
        {stats.availableRewards.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" /> Benefícios Disponíveis
            </h3>
            <div className="space-y-2">
              {stats.availableRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium capitalize">{reward.type.replace(/_/g, ' ')}</span>
                    {reward.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expira: {new Date(reward.expiresAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  {reward.status === 'granted' && (
                    <Button size="sm" onClick={() => claimReward(reward.id)}>
                      Usar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Lista de indicações */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Suas Indicações ({stats.totalReferrals})
          </h3>
          {stats.recentReferrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Nenhuma indicação ainda. Compartilhe seu código!
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentReferrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm">#{ref.id.slice(0, 8)}</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ref.status === 'active' ? 'bg-green-500/10 text-green-500' :
                    ref.status === 'signup_completed' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {ref.status === 'active' ? 'Ativa' : ref.status === 'signup_completed' ? 'Cadastrada' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* CTA Final */}
        <div className="flex gap-2 pt-4">
          <Button onClick={shareWhatsApp} className="flex-1 bg-gradient-to-r from-primary to-purple-500">
            Indicar agora
          </Button>
          <Button onClick={() => navigate("/planos")} variant="outline" className="flex-1">
            Ver planos
          </Button>
        </div>
      </div>
    </div>
  );
}
