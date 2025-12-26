import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Users, Settings, Crown, LogOut, 
  ChevronRight, HelpCircle, Shield, Bell, QrCode, Package, FolderHeart, History, BookOpen, Plane, Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function More() {
  const { t } = useLanguage();
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
      localStorage.removeItem("biometric_refresh_token");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast.success(t('profile.logoutSuccess'));
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error(t('profile.logoutError'));
    }
  };

  const menuItems = [
    {
      title: t('more.sideEffectsDiary'),
      description: t('more.sideEffectsDiaryDesc'),
      icon: Activity,
      path: "/diario-efeitos",
      badge: <Badge variant="secondary" className="ml-2">{t('common.new')}</Badge>,
    },
    {
      title: t('more.travelMode'),
      description: t('more.travelModeDesc'),
      icon: Plane,
      path: "/viagem",
      badge: <Badge variant="secondary" className="ml-2">{t('common.new')}</Badge>,
    },
    {
      title: t('more.healthWallet'),
      description: t('more.healthWalletDesc'),
      icon: FolderHeart,
      path: "/carteira",
      badge: null,
    },
    {
      title: t('more.doseHistory'),
      description: t('more.doseHistoryDesc'),
      icon: History,
      path: "/historico",
      badge: null,
    },
    {
      title: t('more.stockControl'),
      description: t('more.stockControlDesc'),
      icon: Package,
      path: "/estoque",
      badge: null,
    },
    {
      title: t('more.medicalReports'),
      description: t('more.medicalReportsDesc'),
      icon: FileText,
      path: "/relatorios",
      badge: isPremium ? null : <Badge variant="secondary" className="ml-2">{t('common.premium')}</Badge>,
    },
    {
      title: t('more.scanDocuments'),
      description: t('more.scanDocumentsDesc'),
      icon: QrCode,
      path: "/digitalizar",
      badge: null,
    },
    {
      title: t('more.familyCaregivers'),
      description: t('more.familyCaregiversDesc'),
      icon: Users,
      path: "/perfil",
      badge: isPremium ? <Badge className="ml-2">{profiles.length} {t('more.profiles')}</Badge> : <Badge variant="secondary" className="ml-2">{t('common.premium')}</Badge>,
    },
  ];

  const settingsItems = [
    {
      title: t('more.exportData'),
      description: t('more.exportDataDesc'),
      icon: FileText,
      path: "/exportar",
      badge: <Badge variant="secondary" className="ml-2">LGPD</Badge>,
    },
    {
      title: t('more.tutorial'),
      description: t('more.tutorialDesc'),
      icon: BookOpen,
      path: "/tutorial",
    },
    {
      title: t('more.notifications'),
      description: t('more.notificationsDesc'),
      icon: Bell,
      path: "/notificacoes",
    },
    {
      title: t('more.privacyData'),
      description: t('more.privacyDataDesc'),
      icon: Shield,
      path: "/privacy",
    },
    {
      title: t('more.helpSupport'),
      description: t('more.helpSupportDesc'),
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
                <h2 className="text-xl font-bold">{userName || t('more.user')}</h2>
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
                {t('more.upgradePremium')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Main Features */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">{t('more.tools')}</h3>
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
          <h3 className="text-sm font-semibold text-muted-foreground px-2">{t('more.settings')}</h3>
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
                {t('more.manageSubscription')}
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
              {t('more.signOut')}
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
              {t('more.termsOfUse')}
            </button>
            {" • "}
            <button 
              onClick={() => navigate('/privacy')}
              className="hover:underline"
            >
              {t('more.privacy')}
            </button>
          </p>
          <p className="text-xs">
            HoraMed • {t('more.tagline')}
          </p>
        </div>
      </main>
    </div>
  );
}