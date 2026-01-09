import { useNavigate } from "react-router-dom";
import { Settings, Bell, FileDown, HelpCircle, Gift, Crown } from "lucide-react";
import QuickActionsBase, { QuickAction } from "@/components/shared/QuickActionsBase";
import { useTranslation } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";

export default function ProfileQuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPremium } = useSubscription();

  const actions: QuickAction[] = [
    {
      id: "edit",
      icon: <Settings className="h-5 w-5 text-primary" />,
      label: t('profile.editProfile'),
      color: "bg-primary/10",
      onClick: () => navigate('/profile/edit')
    },
    {
      id: "notifications",
      icon: <Bell className="h-5 w-5 text-info" />,
      label: t('profile.notifications'),
      color: "bg-info/10",
      onClick: () => navigate('/notificacoes/config')
    },
    {
      id: "export",
      icon: <FileDown className="h-5 w-5 text-success" />,
      label: t('profile.exportLabel'),
      color: "bg-success/10",
      onClick: () => navigate('/exportar')
    },
    {
      id: "rewards",
      icon: <Gift className="h-5 w-5 text-purple-500" />,
      label: t('profile.myRewardsInvites'),
      color: "bg-purple-500/10",
      onClick: () => navigate('/recompensas')
    }
  ];

  // Add upgrade action for non-premium users
  if (!isPremium) {
    actions.splice(3, 0, {
      id: "upgrade",
      icon: <Crown className="h-5 w-5 text-warning" />,
      label: t('common.upgrade'),
      color: "bg-warning/10",
      onClick: () => navigate('/planos'),
      badge: "PRO"
    });
  }

  return <QuickActionsBase actions={actions.slice(0, 4)} columns={4} />;
}
