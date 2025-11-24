import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Users, Settings, Crown, LogOut, 
  ChevronRight, HelpCircle, Shield, Bell, QrCode, Package, FolderHeart, History, BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { toast } from "sonner";

export default function More() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const { isPremium } = useSubscription();
  const { profiles } = useUserProfiles();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, nickname")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setUserName(profile.nickname || profile.full_name || "");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
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

  const menuItems = [
    {
      title: "Cofre de Saúde",
      description: "Documentos e exames",
      icon: FolderHeart,
      path: "/cofre",
      badge: null,
    },
    {
      title: "Histórico de Doses",
      description: "Ver suas doses",
      icon: History,
      path: "/historico",
      badge: null,
    },
    {
      title: "Controle de Estoque",
      description: "Gerencie seu estoque",
      icon: Package,
      path: "/estoque",
      badge: null,
    },
    {
      title: "Relatórios Médicos",
      description: "Gere relatórios para consultas",
      icon: FileText,
      path: "/relatorios",
      badge: isPremium ? null : <Badge variant="secondary" className="ml-2">Premium</Badge>,
    },
    {
      title: "Digitalizar Documentos",
      description: "OCR para receitas e exames",
      icon: QrCode,
      path: "/digitalizar",
      badge: null,
    },
    {
      title: "Família & Cuidadores",
      description: "Gerencie perfis familiares",
      icon: Users,
      path: "/perfil",
      badge: isPremium ? <Badge className="ml-2">{profiles.length} perfis</Badge> : <Badge variant="secondary" className="ml-2">Premium</Badge>,
    },
  ];

  const settingsItems = [
    {
      title: "Tutorial Interativo",
      description: "Aprenda a usar o app",
      icon: BookOpen,
      path: "/tutorial",
    },
    {
      title: "Notificações",
      description: "Configurar lembretes",
      icon: Bell,
      path: "/notificacoes",
    },
    {
      title: "Privacidade e Dados",
      description: "LGPD e segurança",
      icon: Shield,
      path: "/privacy",
    },
    {
      title: "Ajuda e Suporte",
      description: "Tire suas dúvidas",
      icon: HelpCircle,
      path: "/help-support",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8">
        {/* User Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{userName || "Usuário"}</h2>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
              <SubscriptionBadge />
            </div>
            
            {!isPremium && (
              <Button 
                onClick={() => navigate('/planos')} 
                className="w-full mt-4"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade para Premium
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Main Features */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">Ferramentas</h3>
          {menuItems.map((item) => (
            <Card 
              key={item.path} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-semibold">{item.title}</h4>
                        {item.badge}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">Configurações</h3>
          {settingsItems.map((item) => (
            <Card 
              key={item.path} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Section */}
        {isPremium && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/assinatura')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Assinatura
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>

        {/* Legal */}
        <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
          <p>
            <button 
              onClick={() => navigate('/terms')}
              className="hover:underline"
            >
              Termos de Uso
            </button>
            {" • "}
            <button 
              onClick={() => navigate('/privacy')}
              className="hover:underline"
            >
              Privacidade
            </button>
          </p>
          <p className="text-xs">
            HoraMed • Organizador de Rotina de Saúde
          </p>
        </div>
      </main>
    </div>
  );
}
