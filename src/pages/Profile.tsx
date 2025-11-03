import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  CheckCircle2, User, Bell, Shield, CreditCard, 
  HelpCircle, LogOut, FileDown, ChevronRight, Crown, Activity, Package, FileText, Users, Plus, Trash2, 
  History, Settings, BookOpen
} from "lucide-react";
import CaregiverManager from "@/components/CaregiverManager";
import ConsultationCardGenerator from "@/components/ConsultationCardGenerator";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import logo from "@/assets/horamend-logo.png";

export default function Profile() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<any>({
    full_name: "",
    weight_kg: null,
    height_cm: null,
  });
  const { subscription, isPremium, daysLeft, refresh } = useSubscription();
  const { profiles, activeProfile, deleteProfile, switchProfile } = useUserProfiles();
  const { isEnabled } = useFeatureFlags();

  useEffect(() => {
    loadProfile();
    refresh(); // Force refresh subscription on mount
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

      if (data) setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const calculateBMI = () => {
    if (profile.weight_kg && profile.height_cm) {
      const heightM = profile.height_cm / 100;
      const bmi = profile.weight_kg / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return "Abaixo do peso";
    if (bmi < 25) return "Peso normal";
    if (bmi < 30) return "Sobrepeso";
    return "Obesidade";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleExportPDF = async () => {
    if (!isPremium) {
      toast.error("Esta funcionalidade é exclusiva para usuários Premium", {
        action: {
          label: "Ver Planos",
          onClick: () => navigate('/planos'),
        },
      });
      return;
    }

    try {
      const loadingToast = toast.loading("Coletando dados...");
      
      // Fetch all necessary data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Fetch items with schedules and stock
      const { data: items } = await supabase
        .from("items")
        .select(`
          id,
          name,
          dose_text,
          category,
          with_food,
          schedules (
            id,
            times,
            freq_type
          ),
          stock (
            units_left,
            unit_label
          )
        `)
        .eq("is_active", true)
        .order("category")
        .order("name");

      // Format items data to match expected structure
      const formattedItems = (items || []).map(item => ({
        name: item.name,
        dose_text: item.dose_text,
        category: item.category,
        with_food: item.with_food,
        schedules: (item.schedules || []).map(s => ({
          times: s.times,
          freq_type: s.freq_type,
        })),
        stock: item.stock ? [{
          units_left: item.stock.units_left,
          units_total: item.stock.units_left,
          unit_label: item.stock.unit_label,
        }] : undefined,
      }));

      // Fetch health history
      const { data: healthHistory } = await supabase
        .from("health_history")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(30);

      toast.dismiss(loadingToast);
      toast.loading("Gerando PDF...");

      // Load logo as base64
      const logoImage = await fetch('/src/assets/horamend-logo.png')
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .catch(() => undefined);

      const { generateCompletePDF } = await import('@/lib/pdfExport');
      
      await generateCompletePDF({
        userEmail,
        profile,
        bmi,
        items: formattedItems,
        healthHistory: healthHistory || [],
      }, logoImage);
      
      toast.dismiss();
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.dismiss();
      toast.error("Erro ao gerar PDF");
    }
  };

  const bmi = calculateBMI();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 p-4 pb-24 max-w-md mx-auto">
        <div className="space-y-4">

          {/* User Profiles Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Perfis de Usuários
              </h2>
              {isPremium && (
                <Button
                  size="sm"
                  onClick={() => navigate('/perfis/novo')}
                  className="gap-1 h-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Novo
                </Button>
              )}
            </div>

            <Card className="divide-y divide-border overflow-hidden">
              {profiles.map(profile => {
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

                const isActive = activeProfile?.id === profile.id;

                return (
                  <button
                    key={profile.id}
                    onClick={() => {
                      if (!isActive) {
                        switchProfile(profile);
                      }
                    }}
                    className={`w-full p-3 flex items-center gap-2.5 transition-colors text-left ${
                      isActive 
                        ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-sm">{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-medium text-sm truncate">{profile.name}</p>
                        {isActive && (
                          <Badge className="text-[10px] h-5">Ativo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getRelationshipLabel(profile.relationship)}
                      </p>
                    </div>
                    {!profile.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja remover o perfil de ${profile.name}?`)) {
                            deleteProfile(profile.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </button>
                );
              })}
            </Card>

            {!isPremium && (
              <p className="text-xs text-center text-muted-foreground px-2">
                Múltiplos perfis disponível apenas no Premium. Gerencie medicamentos de toda família!
              </p>
            )}
          </div>

          {/* Plan Card */}
          <Card className="p-4 border-2 border-primary/20">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {isPremium ? 'Premium' : 'Gratuito'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isPremium 
                      ? 'Acesso completo' 
                      : daysLeft !== null && daysLeft > 0
                      ? `${daysLeft} dias restantes`
                      : 'Período expirado'
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Tudo do Plus</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Até 2 cuidadores</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Arquivo de ocorrências por IA</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Backup e restauração</span>
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate(isPremium ? '/assinatura' : '/planos')}
              >
                {isPremium ? 'Gerenciar Assinatura' : 'Fazer Upgrade'}
              </Button>
            </div>
          </Card>

          {/* Quick Access Section */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground px-2">Acesso Rápido</h2>
            
            <div className="grid grid-cols-1 gap-3">
              <Card 
                className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate('/estoque')}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-foreground">Gerenciar Estoque</h3>
                    <p className="text-sm text-muted-foreground">Controle de medicamentos</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </Card>

              <Card 
                className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate('/historico')}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-foreground">Histórico de Doses</h3>
                    <p className="text-sm text-muted-foreground">Veja seu histórico completo</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </Card>

              <Card 
                className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate('/relatorios')}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-foreground">Relatórios Médicos</h3>
                    <p className="text-sm text-muted-foreground">Documentos e análises</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground px-2">Configurações</h2>
            
            <Card className="divide-y divide-border">
              <button 
                onClick={() => navigate('/profile/edit')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <User className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Dados pessoais</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate('/notificacoes')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <Bell className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Notificações</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate('/alarme')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <Bell className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Configurações de Alarme</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => navigate('/privacy')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <Shield className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Privacidade e segurança</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => navigate('/terms')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <FileText className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Termos de Uso e LGPD</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate('/planos')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Cobrança e pagamentos</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate('/help-support')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <HelpCircle className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Ajuda e suporte</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate('/tutorial')}
                className="flex items-center gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Tutorial Interativo</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </Card>
          </div>


          {/* Health Data Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground px-2">Dados de Saúde</h2>
            
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Altura</p>
                  <p className="text-lg font-semibold text-foreground">
                    {profile.height_cm ? `${(profile.height_cm / 100).toFixed(2)} m` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Peso</p>
                  <p className="text-lg font-semibold text-foreground">
                    {profile.weight_kg ? `${profile.weight_kg} kg` : '-'}
                  </p>
                </div>
              </div>

              {bmi && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">IMC (Índice de Massa Corporal)</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{bmi}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Classificado como: {getBMIStatus(parseFloat(bmi))}
                  </p>
                </div>
              )}

              <Button 
                variant="link" 
                className="text-primary p-0 h-auto mt-3"
                onClick={() => navigate('/profile/edit')}
              >
                Editar dados
              </Button>
            </Card>
          </div>

          {/* Export Data Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground px-2">Dados & Insights</h2>
            
            <Card className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Acesse análises preditivas e exporte seus dados
              </p>
              
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/analise-saude')}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Análise Preditiva com IA
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/digitalizar')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Digitalizar Documentos (OCR)
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleExportPDF}
                disabled={!isPremium}
              >
                <FileDown className="h-4 w-4" />
                Exportar relatório (PDF) {!isPremium && "- Premium"}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/exportar-dados')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exportar todos os dados (LGPD)
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              {!isPremium && (
                <p className="text-xs text-muted-foreground">
                  A exportação de relatórios PDF está disponível apenas para usuários Premium
                </p>
              )}
            </Card>
          </div>

          {/* Logout Button */}
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>

          {/* Features Diferenciais */}
          {isEnabled('caregiverHandshake') && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Cuidadores</h2>
              </div>
              <CaregiverManager />
            </Card>
          )}

          {isEnabled('consultationQR') && (
            <ConsultationCardGenerator />
          )}

          {/* Warning Message */}
          <Card className="p-4 bg-warning/10 border-warning/20">
            <p className="text-xs text-foreground">
              <span className="font-semibold">Aviso importante:</span> Este aplicativo é apenas informativo e não substitui a consulta com um profissional médico antes de alterar tratamentos.
            </p>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}