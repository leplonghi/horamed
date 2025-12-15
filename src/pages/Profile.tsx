import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User, Bell, Shield, HelpCircle, LogOut, FileDown, 
  Crown, Users, Plus, Trash2, Settings, BookOpen,
  Download, FileText, AlertCircle, Smartphone, Gift, Activity, Check
} from "lucide-react";
import CaregiverManager from "@/components/CaregiverManager";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/horamed-logo-optimized.webp";
import TutorialHint from "@/components/TutorialHint";
import WeightTrackingCard from "@/components/WeightTrackingCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFitnessPreferences } from "@/hooks/useFitnessPreferences";

export default function Profile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<any>({
    full_name: "",
    weight_kg: null,
    height_cm: null,
  });
  const { subscription, isPremium, daysLeft, refresh } = useSubscription();
  const { profiles, activeProfile, deleteProfile, switchProfile } = useUserProfiles();
  const { preferences, toggleFitnessWidgets } = useFitnessPreferences();

  useEffect(() => {
    loadProfile();
    refresh();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) setProfile({ ...data, user_id: user.id });
      else setProfile({ user_id: user.id });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Limpar dados do localStorage da biometria
      localStorage.removeItem("biometric_refresh_token");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast.success("Logout realizado com sucesso");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRelationshipLabel = (rel: string) => {
    const labels: { [key: string]: string } = {
      self: 'Você',
      child: 'Filho(a)',
      parent: 'Pai/Mãe',
      spouse: 'Cônjuge',
      other: 'Outro'
    };
    return labels[rel] || rel;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-2xl mx-auto px-4 py-6 pt-24 space-y-6">
        <TutorialHint
          id="profile-overview"
          title="Seu Perfil"
          message="Aqui você gerencia suas informações, perfis familiares, assinatura e configurações."
          placement="bottom"
        />

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-20 w-20 sm:h-16 sm:w-16">
                {activeProfile?.avatar_url ? (
                  <AvatarImage src={activeProfile.avatar_url} alt={activeProfile.name} />
                ) : (
                  <AvatarFallback className="text-lg">
                    {getInitials(activeProfile?.name || '')}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h1 className="text-2xl font-bold truncate">{activeProfile?.name}</h1>
                <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                <div className="mt-2 flex justify-center sm:justify-start">
                  {isPremium ? (
                    <Badge className="gap-1">
                      <Crown className="h-3 w-3" />
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {daysLeft !== null ? `${daysLeft} dias restantes` : 'Gratuito'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full"
                onClick={() => navigate('/profile/edit')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Editar perfil
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da conta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="account" className="flex-col gap-1 py-3">
              <User className="h-5 w-5" />
              <span className="text-xs">Conta</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex-col gap-1 py-3">
              <Users className="h-5 w-5" />
              <span className="text-xs">Perfis</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex-col gap-1 py-3">
              <Crown className="h-5 w-5" />
              <span className="text-xs">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-col gap-1 py-3">
              <Settings className="h-5 w-5" />
              <span className="text-xs">Ajustes</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Weight Tracking */}
            {profile.user_id && (
              <WeightTrackingCard 
                userId={profile.user_id}
                profileId={activeProfile?.id}
              />
            )}

            {/* Fitness Widgets Preferences */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-performance" />
                  <CardTitle>Preferências de Bem-estar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="fitness-widgets" className="cursor-pointer font-medium">
                      Exibir widgets de bem-estar
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Mostre métricas de hidratação, consistência e energia
                    </p>
                  </div>
                  <Switch
                    id="fitness-widgets"
                    checked={preferences.showFitnessWidgets}
                    onCheckedChange={toggleFitnessWidgets}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Perfis Familiares</CardTitle>
                    <CardDescription>
                      Gerencie medicamentos de toda a família
                    </CardDescription>
                  </div>
                  {isPremium && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/perfil/criar')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isPremium && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Crown className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">
                          Recurso Premium
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Crie perfis para toda família e gerencie medicamentos de cada um separadamente.
                        </p>
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => navigate('/planos')}
                        >
                          Fazer Upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {profiles.map(profile => {
                    const isActive = activeProfile?.id === profile.id;
                    
                    return (
                      <div
                        key={profile.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          isActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }`}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{profile.name}</p>
                            {isActive && (
                              <Badge variant="default" className="text-xs">Ativo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getRelationshipLabel(profile.relationship)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {!isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => switchProfile(profile)}
                            >
                              Ativar
                            </Button>
                          )}
                          {!profile.is_primary && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Deseja remover o perfil de ${profile.name}?`)) {
                                  deleteProfile(profile.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Cuidadores
                </CardTitle>
                <CardDescription>
                  Compartilhe acesso com familiares e profissionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaregiverManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Premium Upgrade CTA - Only for Free Users */}
            {!isPremium && (
              <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-2">
                      <Crown className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Assine o Premium</h3>
                      <p className="text-muted-foreground mb-4">
                        Medicamentos ilimitados, IA sem limites e muito mais
                      </p>
                      <div className="inline-block px-4 py-2 bg-primary/20 rounded-full mb-4">
                        <p className="text-2xl font-bold text-primary">R$ 19,90<span className="text-sm font-normal">/mês</span></p>
                      </div>
                    </div>
                    <Button 
                      size="lg"
                      className="w-full h-12 text-base font-semibold"
                      onClick={() => navigate('/planos')}
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Assinar agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">
                      {isPremium ? 'Premium' : 'Gratuito'}
                    </span>
                    {isPremium ? (
                      <Badge className="gap-1">
                        <Crown className="h-3 w-3" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {daysLeft !== null ? `${daysLeft} dias restantes` : 'Gratuito'}
                      </Badge>
                    )}
                  </div>
                  {!isPremium && daysLeft !== null && (
                    <p className="text-sm text-muted-foreground">
                      {daysLeft > 0 
                        ? `${daysLeft} dias restantes do período gratuito` 
                        : 'Período gratuito expirado'}
                    </p>
                  )}
                </div>

                {isPremium ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Medicamentos ilimitados</p>
                          <p className="text-sm text-muted-foreground">Adicione quantos medicamentos precisar</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">IA sem limites</p>
                          <p className="text-sm text-muted-foreground">Use a assistente de saúde sempre que precisar</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Documentos ilimitados</p>
                          <p className="text-sm text-muted-foreground">Guarde todas suas receitas e exames</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Relatório mensal em PDF</p>
                          <p className="text-sm text-muted-foreground">Compartilhe com seu médico</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="w-full"
                      onClick={() => navigate('/assinatura')}
                    >
                      Gerenciar assinatura
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-muted">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">1 medicamento ativo</p>
                          <p className="text-sm text-muted-foreground">Limite do plano gratuito</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-muted">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">2 consultas IA por dia</p>
                          <p className="text-sm text-muted-foreground">Redefine todo dia</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-muted">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Até 5 documentos</p>
                          <p className="text-sm text-muted-foreground">Na Carteira de Saúde</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => navigate('/planos')}
                    >
                      Ver todos os benefícios Premium
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Indique e Ganhe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Indique e Ganhe
                </CardTitle>
                <CardDescription>
                  {isPremium 
                    ? 'Ganhe descontos acumulativos na sua mensalidade'
                    : 'Libere mais 1 medicamento ativo para cada indicação Premium'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/indique-ganhe')}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Ver programa de indicação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações e Alarmes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full justify-start"
                  onClick={() => navigate('/notificacoes-config')}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Configurar notificações
                </Button>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full justify-start"
                  onClick={() => navigate('/alarmes')}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Configurar alarmes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Dados e Privacidade
                </CardTitle>
                <CardDescription>
                  Seus dados são protegidos conforme a LGPD
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full justify-start"
                  onClick={() => navigate('/exportar')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar meus dados
                </Button>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full justify-start"
                  onClick={() => navigate('/privacidade')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Política de privacidade
                </Button>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full justify-start"
                  onClick={() => navigate('/termos')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Termos de uso
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Ajuda e Suporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full justify-start"
                  onClick={() => navigate('/tutorial')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Tutorial do app
                </Button>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full justify-start"
                  onClick={() => navigate('/ajuda')}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Central de ajuda
                </Button>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full justify-start"
                  onClick={() => navigate('/emergencia')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Contatos de emergência
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}
