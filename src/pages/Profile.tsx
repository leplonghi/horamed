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
  User, Bell, Shield, CreditCard, HelpCircle, LogOut, FileDown, 
  Crown, Users, Plus, Trash2, Settings, BookOpen, Mail,
  Download, FileText, AlertCircle, Smartphone
} from "lucide-react";
import CaregiverManager from "@/components/CaregiverManager";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/horamed-logo.png";
import TutorialHint from "@/components/TutorialHint";
import WeightTrackingCard from "@/components/WeightTrackingCard";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl pt-24">{/* pt-24 para compensar o header fixo */}
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={activeProfile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {activeProfile ? getInitials(activeProfile.name) : <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">
                {activeProfile?.name || profile.full_name || "Perfil"}
              </h1>
              <p className="text-muted-foreground">{userEmail}</p>
              <div className="flex gap-2 mt-2">
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
        </div>

        {/* Tutorial Hint */}
        <TutorialHint
          id="profile_page"
          title="Gerencie sua conta e perfis 👤"
          message="Configure sua conta, adicione perfis de família (filhos, pais, cônjuges), gerencie cuidadores, e personalize suas preferências de notificações. Explore também o plano Premium para recursos avançados!"
        />

        {/* Tabs Section */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-6">
            <TabsTrigger value="account" className="text-xs">
              <User className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Conta</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Perfis</span>
            </TabsTrigger>
            <TabsTrigger value="caregivers" className="text-xs">
              <Shield className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Cuidadores</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="text-xs">
              <CreditCard className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">
              <Bell className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs">
              <FileDown className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="text-xs">
              <HelpCircle className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Ajuda</span>
            </TabsTrigger>
          </TabsList>

          {/* Conta Tab */}
          <TabsContent value="account" className="space-y-4">
            {/* Dados básicos */}
            <Card>
              <CardHeader>
                <CardTitle>Dados básicos</CardTitle>
                <CardDescription>
                  Suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </label>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <p className="text-sm text-muted-foreground">
                    {profile.full_name || "Não informado"}
                  </p>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/profile/edit')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Acompanhamento de peso */}
            {profile.user_id && (
              <WeightTrackingCard 
                userId={profile.user_id}
                profileId={activeProfile?.id}
              />
            )}
          </TabsContent>

          {/* Perfis Tab */}
          <TabsContent value="profiles" className="space-y-4">
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
                          size="sm"
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
          </TabsContent>

          {/* Cuidadores Tab */}
          <TabsContent value="caregivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cuidadores</CardTitle>
                <CardDescription>
                  Compartilhe acesso com familiares e profissionais de saúde
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaregiverManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assinatura Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assinatura</CardTitle>
                <CardDescription>
                  Gerencie seu plano e benefícios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {subscription?.plan_type === 'premium' ? 'Plano Premium' : 'Plano Gratuito'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {isPremium 
                            ? 'Acesso ilimitado a todos os recursos' 
                            : `${daysLeft} dias restantes no período gratuito`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {isPremium ? (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium">Recursos incluídos:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Medicamentos ilimitados
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Múltiplos perfis familiares
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          OCR de receitas médicas
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Exportação de dados em PDF
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Análise de saúde com IA
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium">Limitações do plano gratuito:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Apenas 1 medicamento ativo
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Sem perfis familiares
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Recursos limitados
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isPremium && (
                      <Button
                        className="flex-1"
                        onClick={() => navigate('/planos')}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Fazer Upgrade
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => navigate('/assinatura')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure como e quando deseja receber lembretes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/notificacoes-config')}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Configurar Notificações
                </Button>

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/alarmes')}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Configurar Alarmes
                </Button>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Mantenha seus lembretes ativos para nunca esquecer suas medicações.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dados Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Exportação de Dados
                </CardTitle>
                <CardDescription>
                  Baixe todos os seus dados de saúde (direito garantido pela LGPD)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-2">Direito LGPD</p>
                      <p className="text-xs text-muted-foreground">
                        Você tem o direito legal de acessar e baixar todos os seus dados pessoais e de saúde armazenados no HoraMed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">📦 Dados incluídos na exportação:</p>
                  <div className="grid gap-2">
                    {[
                      'Perfis e informações pessoais',
                      'Medicamentos e horários',
                      'Histórico completo de doses',
                      'Documentos e exames do cofre',
                      'Receitas e vacinas',
                      'Consultas e eventos de saúde',
                      'Métricas de adesão e progresso'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/exportar')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Todos os Dados (JSON)
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Arquivo em formato JSON com todos os seus dados
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ajuda Tab */}
          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ajuda e Suporte</CardTitle>
                <CardDescription>
                  Recursos para aproveitar melhor o HoraMed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/tutorial')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Tutorial do App
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/ajuda')}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Central de Ajuda
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/emergencia')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Contatos de Emergência
                </Button>

                <Separator className="my-4" />

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/privacidade')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Política de Privacidade
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/termos')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Termos de Uso
                </Button>

                <Separator className="my-4" />

                <div className="flex items-center justify-center py-4">
                  <img src={logo} alt="HoraMed" className="h-12 opacity-50" />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  HoraMed 2.0 - Seu Assistente de Saúde Pessoal
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}
