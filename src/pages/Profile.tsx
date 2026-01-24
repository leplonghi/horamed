import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  User, Bell, Shield, HelpCircle, LogOut, FileDown, 
  Crown, Users, Plus, Trash2, Settings, BookOpen,
  FileText, Smartphone, Gift, Activity, Check, Fingerprint, ArrowRight, Star
} from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import CaregiverManager from "@/components/CaregiverManager";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";
import WeightTrackingCard from "@/components/WeightTrackingCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFitnessPreferences } from "@/hooks/useFitnessPreferences";
import { motion } from "framer-motion";
import { LanguageSwitch } from "@/components/LanguageToggle";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// New components
import ProfileHeroHeader from "@/components/profile/ProfileHeroHeader";
import ProfileQuickActions from "@/components/profile/ProfileQuickActions";
import ProfileStatsGrid from "@/components/profile/ProfileStatsGrid";
import SmartProfileInsights from "@/components/profile/SmartProfileInsights";
import OceanBackground from "@/components/ui/OceanBackground";

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
  const { t } = useTranslation();

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
      toast.success(t('profile.logoutSuccess'));
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error(t('profile.logoutError'));
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
      self: t('profile.relationSelf'),
      child: t('profile.relationChild'),
      parent: t('profile.relationParent'),
      spouse: t('profile.relationSpouse'),
      other: t('profile.relationOther')
    };
    return labels[rel] || rel;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      <Header />
      
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="page-container container max-w-2xl mx-auto px-4 space-y-5 relative z-10"
      >
        {/* Hero Header */}
        <motion.div variants={itemVariants}>
          <ProfileHeroHeader userEmail={userEmail} onLogout={handleLogout} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <ProfileQuickActions />
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants}>
          <ProfileStatsGrid />
        </motion.div>

        {/* Smart Insights */}
        <motion.div variants={itemVariants}>
          <SmartProfileInsights />
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-auto p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="account" className="flex-col gap-1 py-3 rounded-xl data-[state=active]:shadow-md">
                <User className="h-5 w-5" />
                <span className="text-xs">{t('profile.account')}</span>
              </TabsTrigger>
              <TabsTrigger value="profiles" className="flex-col gap-1 py-3 rounded-xl data-[state=active]:shadow-md">
                <Users className="h-5 w-5" />
                <span className="text-xs">{t('profile.profiles')}</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex-col gap-1 py-3 rounded-xl data-[state=active]:shadow-md">
                <Crown className="h-5 w-5" />
                <span className="text-xs">{t('profile.plan')}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-col gap-1 py-3 rounded-xl data-[state=active]:shadow-md">
                <Settings className="h-5 w-5" />
                <span className="text-xs">{t('common.settings')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4 mt-5">
              {/* Referral Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-2xl p-4 cursor-pointer group",
                  "bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-primary/5",
                  "border border-purple-500/20 hover:border-purple-500/40",
                  "shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)]",
                  "transition-all duration-300"
                )}
                onClick={() => navigate('/recompensas')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{t('profile.referAndEarn')}</p>
                    <p className="text-sm text-muted-foreground">{t('profile.earnDiscounts')}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>

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
                className={cn(
                  "rounded-2xl p-5",
                  "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
                  "border border-border/30",
                  "shadow-[var(--shadow-glass)]"
                )}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-performance/10">
                    <Activity className="h-5 w-5 text-performance" />
                  </div>
                  <h3 className="font-semibold">{t('profile.wellnessPrefs')}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="fitness-widgets" className="cursor-pointer font-medium">
                      {t('profile.showWellnessWidgets')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.showWellnessWidgetsDesc')}
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
            <TabsContent value="profiles" className="space-y-4 mt-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-2xl p-5",
                  "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
                  "border border-border/30",
                  "shadow-[var(--shadow-glass)]"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{t('profile.familyProfiles')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.manageFamilyMeds')}
                    </p>
                  </div>
                  {isPremium && (
                    <Button
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={() => navigate('/perfil/criar')}
                    >
                      <Plus className="h-4 w-4" />
                      {t('common.new')}
                    </Button>
                  )}
                </div>

                {!isPremium && (
                  <div className={cn(
                    "rounded-xl p-4 mb-4",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "border border-primary/20"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">{t('profile.premiumFeature')}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {t('profile.premiumFeatureDesc')}
                        </p>
                        <Button
                          size="lg"
                          className="w-full rounded-xl"
                          onClick={() => navigate('/planos')}
                        >
                          {t('common.upgrade')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {profiles.map(profile => {
                    const isActive = activeProfile?.id === profile.id;
                    
                    return (
                      <motion.div
                        key={profile.id}
                        whileHover={{ scale: 1.01 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          isActive 
                            ? "bg-primary/10 ring-2 ring-primary/30" 
                            : "bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-border/50">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{profile.name}</p>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                                <Check className="h-3 w-3" />
                                {t('common.active')}
                              </span>
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
                              {t('profile.activate')}
                            </Button>
                          )}
                          {!profile.is_primary && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-xl hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(t('profile.confirmDeleteProfile', { name: profile.name }))) {
                                  deleteProfile(profile.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "rounded-2xl p-5",
                  "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
                  "border border-border/30",
                  "shadow-[var(--shadow-glass)]"
                )}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('profile.caregivers')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.caregiversDesc')}
                    </p>
                  </div>
                </div>
                <CaregiverManager />
              </motion.div>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4 mt-5">
              {/* Premium Upgrade CTA */}
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-2xl p-6 text-center",
                    "bg-gradient-to-br from-primary/15 via-purple-500/10 to-pink-500/10",
                    "border border-primary/30",
                    "shadow-[var(--shadow-glass)]"
                  )}
                >
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-warning to-orange-500 shadow-lg"
                  >
                    <Crown className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">{t('profile.subscribePremium')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('profile.subscribePremiumDesc')}
                  </p>
                  <div className="inline-block px-6 py-3 rounded-full mb-4 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30">
                    <p className="text-3xl font-bold text-primary">R$ 19,90<span className="text-sm font-normal text-muted-foreground">{t('common.perMonth')}</span></p>
                  </div>
                  <Button 
                    size="lg"
                    className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
                    onClick={() => navigate('/planos')}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    {t('profile.subscribeNow')}
                  </Button>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "rounded-2xl p-5",
                  "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
                  "border border-border/30",
                  "shadow-[var(--shadow-glass)]"
                )}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t('profile.currentPlan')}</h3>
                </div>
                
                <div className={cn(
                  "p-4 rounded-xl",
                  isPremium 
                    ? "bg-gradient-to-br from-warning/10 to-orange-500/5 border border-warning/20" 
                    : "bg-muted/50"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">
                      {isPremium ? 'Premium' : t('common.free')}
                    </span>
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-warning/20 to-orange-500/20 text-warning text-sm font-medium">
                        <Crown className="h-3.5 w-3.5" />
                        Premium
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                        {daysLeft !== null ? `${daysLeft} ${t('profile.daysLeft')}` : t('common.free')}
                      </span>
                    )}
                  </div>
                  {!isPremium && daysLeft !== null && (
                    <p className="text-sm text-muted-foreground">
                      {daysLeft > 0 
                        ? t('profile.freeTrialDays', { days: String(daysLeft) })
                        : t('profile.freeTrialExpired')}
                    </p>
                  )}
                </div>

                {isPremium && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {[
                        t('profile.unlimitedMeds'),
                        t('profile.unlimitedProfiles'),
                        t('profile.unlimitedAI'),
                        t('profile.pdfExport'),
                        t('profile.smartStockAlerts')
                      ].map((benefit, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <div className="mt-0.5 p-1 rounded-full bg-success/20">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-sm">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl"
                      onClick={() => navigate('/assinatura')}
                    >
                      {t('profile.manageSubscription')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>

              {/* Referral Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "rounded-2xl p-5 cursor-pointer group",
                  "bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-primary/5",
                  "border border-purple-500/20 hover:border-purple-500/40",
                  "shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)]",
                  "transition-all duration-300"
                )}
                onClick={() => navigate('/recompensas')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('profile.myRewardsInvites')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('profile.inviteFriendsDiscount')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-3 mt-5">
              {/* Language Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <LanguageSwitch />
              </motion.div>

              {[
                { icon: Bell, label: t('profile.notifLabel'), desc: t('profile.notifDesc'), path: '/notificacoes/configurar', color: "text-info", bg: "bg-info/10" },
                { icon: Smartphone, label: t('profile.alarmsLabel'), desc: t('profile.alarmsDesc'), path: '/alarmes', color: "text-primary", bg: "bg-primary/10" },
                { icon: FileDown, label: t('profile.exportLabel'), desc: t('profile.exportDesc'), path: '/exportar', color: "text-success", bg: "bg-success/10" },
                { icon: BookOpen, label: t('profile.tutorialLabel'), desc: t('profile.tutorialDesc'), path: '/tutorial', color: "text-purple-500", bg: "bg-purple-500/10" },
                { icon: HelpCircle, label: t('profile.helpLabel'), desc: t('profile.helpDesc'), path: '/ajuda', color: "text-warning", bg: "bg-warning/10" },
                { icon: Shield, label: t('profile.privacyLabel'), desc: t('profile.privacyDesc'), path: '/privacidade', color: "text-muted-foreground", bg: "bg-muted" },
                { icon: FileText, label: t('profile.termsLabel'), desc: t('profile.termsDesc'), path: '/termos', color: "text-muted-foreground", bg: "bg-muted" },
              ].map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 1) * 0.04 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "rounded-2xl p-4 cursor-pointer group",
                    "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm",
                    "border border-border/30 hover:border-border/50",
                    "shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)]",
                    "transition-all duration-200"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl transition-colors", item.bg)}>
                        <item.icon className={cn("h-5 w-5", item.color)} />
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
                  className={cn(
                    "rounded-2xl p-4",
                    "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm",
                    "border border-border/30",
                    "shadow-[var(--shadow-glass)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-success/10">
                        <Fingerprint className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-medium">{t('profile.biometricLogin')}</h4>
                        <p className="text-xs text-muted-foreground">{t('profile.biometricEnabled')}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive rounded-xl hover:bg-destructive/10"
                      onClick={disableBiometric}
                    >
                      {t('profile.disable')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.main>

      <Navigation />
    </div>
  );
}
