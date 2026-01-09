import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Crown, Bell, AlertTriangle, CheckCircle, 
  FileText, Scale, Users, Gift
} from "lucide-react";
import SmartInsightsBase, { Insight } from "@/components/shared/SmartInsightsBase";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useTranslation } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SmartProfileInsights() {
  const navigate = useNavigate();
  const { isPremium, daysLeft } = useSubscription();
  const { profiles } = useUserProfiles();
  const { t } = useTranslation();

  // Check if user has weight records
  const { data: hasWeightRecords } = useQuery({
    queryKey: ["profile-weight-check"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { count } = await supabase
        .from("sinais_vitais")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("peso_kg", "is", null);
      
      return (count || 0) > 0;
    }
  });

  // Check notification preferences
  const { data: notificationsEnabled } = useQuery({
    queryKey: ["profile-notifications-check"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true;
      
      const { data } = await supabase
        .from("notification_preferences")
        .select("push_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      
      return data?.push_enabled ?? false;
    }
  });

  // Check referral stats
  const { data: referralCount = 0 } = useQuery({
    queryKey: ["profile-referral-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", user.id)
        .eq("status", "active");
      
      return count || 0;
    }
  });

  const insights = useMemo(() => {
    const result: Insight[] = [];

    // Trial expiring soon
    if (!isPremium && daysLeft !== null && daysLeft > 0 && daysLeft <= 3) {
      result.push({
        id: "trial-expiring",
        type: "warning",
        icon: <Crown className="h-5 w-5" />,
        title: t('profile.trialExpiringSoon'),
        description: `${daysLeft} ${t('profile.daysRemaining')}`,
        action: {
          label: t('common.upgrade'),
          onClick: () => navigate('/planos')
        }
      });
    }

    // Trial expired
    if (!isPremium && daysLeft !== null && daysLeft <= 0) {
      result.push({
        id: "trial-expired",
        type: "urgent",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: t('profile.freeTrialExpired'),
        description: t('profile.upgradeToUnlock'),
        action: {
          label: t('common.upgrade'),
          onClick: () => navigate('/planos')
        }
      });
    }

    // Notifications not enabled
    if (!notificationsEnabled) {
      result.push({
        id: "notifications-disabled",
        type: "warning",
        icon: <Bell className="h-5 w-5" />,
        title: t('profile.notificationsDisabled'),
        description: t('profile.enableNotificationsDesc'),
        action: {
          label: t('profile.enable'),
          onClick: () => navigate('/notificacoes/config')
        }
      });
    }

    // No weight records
    if (!hasWeightRecords) {
      result.push({
        id: "no-weight",
        type: "info",
        icon: <Scale className="h-5 w-5" />,
        title: t('profile.trackYourWeight'),
        description: t('profile.trackYourWeightDesc'),
        action: {
          label: t('common.start'),
          onClick: () => navigate('/peso')
        }
      });
    }

    // Single profile - suggest adding family
    if (profiles.length === 1 && isPremium) {
      result.push({
        id: "add-family",
        type: "info",
        icon: <Users className="h-5 w-5" />,
        title: t('profile.addFamilyProfiles'),
        description: t('profile.addFamilyProfilesDesc'),
        action: {
          label: t('common.add'),
          onClick: () => navigate('/perfil/criar')
        }
      });
    }

    // Referral success
    if (referralCount > 0) {
      result.push({
        id: "referral-success",
        type: "success",
        icon: <Gift className="h-5 w-5" />,
        title: t('profile.referralSuccess', { count: String(referralCount) }),
        description: t('profile.referralSuccessDesc'),
        action: {
          label: t('common.view'),
          onClick: () => navigate('/recompensas')
        }
      });
    }

    // All good!
    if (result.length === 0) {
      result.push({
        id: "all-good",
        type: "success",
        icon: <CheckCircle className="h-5 w-5" />,
        title: t('profile.allConfigured'),
        description: t('profile.allConfiguredDesc')
      });
    }

    return result.slice(0, 2);
  }, [isPremium, daysLeft, notificationsEnabled, hasWeightRecords, profiles, referralCount, navigate, t]);

  if (insights.length === 0) return null;

  return <SmartInsightsBase insights={insights} />;
}
