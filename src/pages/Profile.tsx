import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  User, Bell, Shield, HelpCircle, LogOut, FileDown, 
  Crown, Users, Plus, Trash2, Settings, BookOpen,
  Download, FileText, AlertCircle, Smartphone, Gift, Activity, Check, Fingerprint, ArrowRight
} from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import CaregiverManager from "@/components/CaregiverManager";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";
import TutorialHint from "@/components/TutorialHint";
import WeightTrackingCard from "@/components/WeightTrackingCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFitnessPreferences } from "@/hooks/useFitnessPreferences";
import { motion } from "framer-motion";
import { LanguageSwitch } from "@/components/LanguageToggle";
import { useTranslation } from "@/contexts/LanguageContext";

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
  const { isAvailable: biometricAvailable, isBiometricEnabled, disableBiometric } = useBiometricAuth();

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
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <Header />
      
      <main className="container max-w-2xl mx-auto px-4 py-6 pt-24 space-y-6">
        <TutorialHint
          id="profile-overview"
          title="Seu Perfil"
          message="Aqui você gerencia suas informações, perfis familiares, assinatura e configurações."
          placement="bottom"
        />

        {/* Explicação didática */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">O que você pode fazer aqui?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gerencie sua <strong>conta</strong>, crie <strong>perfis familiares</strong> (Premium), 
                configure <strong>notificações</strong> e veja seu <strong>plano de assinatura</strong>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-20 w-20 sm:h-16 sm:w-16 ring-4 ring-primary/20">
              {activeProfile?.avatar_url ? (
                <AvatarImage src={activeProfile.avatar_url} alt={activeProfile.name} />
              ) : (
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(activeProfile?.name || '')}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold truncate">{activeProfile?.name}</h1>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
              <div className="mt-2 flex justify-center sm:justify-start">
                {isPremium ? (
                  <span className="pill-primary">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                ) : (
                  <span className="pill">
                    {daysLeft !== null ? `${daysLeft} dias restantes` : 'Gratuito'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full rounded-xl"
              onClick={() => navigate('/profile/edit')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Editar perfil
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="w-full rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1.5 rounded-2xl bg-muted/50">
            <TabsTrigger value="account" className="flex-col gap-1 py-3 rounded-xl">
              <User className="h-5 w-5" />
              <span className="text-xs">Conta</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex-col gap-1 py-3 rounded-xl">
              <Users className="h-5 w-5" />
              <span className="text-xs">Perfis</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex-col gap-1 py-3 rounded-xl">
              <Crown className="h-5 w-5" />
              <span className="text-xs">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-col gap-1 py-3 rounded-xl">
              <Settings className="h-5 w-5" />
              <span className="text-xs">Ajustes</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6 mt-6">
            {/* Weight Tracking */}
            {profile.user_id && (
              <WeightTrackingCard 
                userId={profile.user_id}
                profileId={activeProfile?.id}
              />
            )}

            {/* Fitness Widgets Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm p-5"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-performance" />
                <h3 className="font-semibold">Preferências de Bem-estar</h3>
              </div>
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
            </motion.div>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm p-5"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Perfis Familiares</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie medicamentos de toda a família
                  </p>
                </div>
                {isPremium && (
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={() => navigate('/perfil/criar')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo
                  </Button>
                )}
              </div>

              {!isPremium && (
                <div 
                  className="rounded-xl p-4 mb-4"
                  style={{ backgroundColor: 'hsl(var(--primary) / 0.05)' }}
                >
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">Recurso Premium</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Crie perfis para toda família e gerencie medicamentos de cada um separadamente.
                      </p>
                      <Button
                        size="lg"
                        className="w-full rounded-xl"
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
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-primary/10 ring-2 ring-primary/30' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{profile.name}</p>
                          {isActive && (
                            <span className="pill-primary text-xs">Ativo</span>
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
                            className="rounded-xl"
                            onClick={() => switchProfile(profile)}
                          >
                            Ativar
                          </Button>
                        )}
                        {!profile.is_primary && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl"
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm p-5"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Cuidadores</h3>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe acesso com familiares e profissionais
                  </p>
                </div>
              </div>
              <CaregiverManager />
            </motion.div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6 mt-6">
            {/* Premium Upgrade CTA */}
            {!isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 text-center"
                style={{ 
                  boxShadow: 'var(--shadow-md)',
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))'
                }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}>
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Assine o Premium</h3>
                <p className="text-muted-foreground mb-4">
                  Medicamentos ilimitados, IA sem limites e muito mais
                </p>
                <div className="inline-block px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}>
                  <p className="text-2xl font-bold text-primary">R$ 19,90<span className="text-sm font-normal">/mês</span></p>
                </div>
                <Button 
                  size="lg"
                  className="w-full h-12 text-base font-semibold rounded-xl"
                  onClick={() => navigate('/planos')}
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Assinar agora
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm p-5"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Plano Atual</h3>
              </div>
              
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">
                    {isPremium ? 'Premium' : 'Gratuito'}
                  </span>
                  {isPremium ? (
                    <span className="pill-primary">
                      <Crown className="h-3 w-3" />
                      Premium
                    </span>
                  ) : (
                    <span className="pill">
                      {daysLeft !== null ? `${daysLeft} dias restantes` : 'Gratuito'}
                    </span>
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

              {isPremium && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {[
                      'Medicamentos ilimitados',
                      'Perfis familiares ilimitados',
                      'Assistente IA sem limites',
                      'Exportação de relatórios PDF',
                      'Alertas inteligentes de estoque'
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full" style={{ backgroundColor: 'hsl(var(--success) / 0.2)' }}>
                          <Check className="h-3 w-3 text-success" />
                        </div>
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl"
                    onClick={() => navigate('/assinatura')}
                  >
                    Gerenciar assinatura
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Referral Card - Recompensas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 backdrop-blur-sm p-5 cursor-pointer group hover-lift border border-primary/20"
              style={{ boxShadow: 'var(--shadow-sm)' }}
              onClick={() => navigate('/recompensas')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Minhas Recompensas e Convites</h4>
                    <p className="text-sm text-muted-foreground">
                      Indique amigos e ganhe descontos
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-6">
            {/* Language Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <LanguageSwitch />
            </motion.div>

            {[
              { icon: Bell, label: 'Notificações', desc: 'Configure alertas e lembretes', path: '/notificacoes/configurar' },
              { icon: Smartphone, label: 'Alarmes', desc: 'Sons e vibração', path: '/alarmes' },
              { icon: FileDown, label: 'Exportar Dados', desc: 'Baixe seus dados em PDF', path: '/exportar' },
              { icon: BookOpen, label: 'Tutorial', desc: 'Aprenda a usar o app', path: '/tutorial' },
              { icon: HelpCircle, label: 'Ajuda e Suporte', desc: 'Dúvidas e contato', path: '/ajuda' },
              { icon: Shield, label: 'Privacidade', desc: 'Política de privacidade', path: '/privacidade' },
              { icon: FileText, label: 'Termos de Uso', desc: 'Termos e condições', path: '/termos' },
            ].map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.05 }}
                className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 cursor-pointer group hover-lift"
                style={{ boxShadow: 'var(--shadow-sm)' }}
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                      <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.label}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}

            {/* Biometric Auth */}
            {biometricAvailable && isBiometricEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-card/80 backdrop-blur-sm p-4"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-muted">
                      <Fingerprint className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">Login Biométrico</h4>
                      <p className="text-xs text-muted-foreground">Ativado neste dispositivo</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive rounded-xl"
                    onClick={disableBiometric}
                  >
                    Desativar
                  </Button>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}
