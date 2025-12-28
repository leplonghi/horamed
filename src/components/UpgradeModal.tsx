import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export default function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getFeatureText = (feat: string) => {
    return t(`upgrade.feature.${feat}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('upgrade.title')}
          </DialogTitle>
          <DialogDescription>
            {feature === 'ai_agent' ? t('upgrade.aiLimit') : 
             feature ? t('upgrade.forFeature', { feature: getFeatureText(feature) }) : 
             t('upgrade.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('upgrade.unlimitedMeds')}</p>
                <p className="text-sm text-muted-foreground">{t('upgrade.unlimitedMedsDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('upgrade.aiUnlocked')}</p>
                <p className="text-sm text-muted-foreground">{t('upgrade.aiUnlockedDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('upgrade.unlimitedWallet')}</p>
                <p className="text-sm text-muted-foreground">{t('upgrade.unlimitedWalletDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('upgrade.monthlyReport')}</p>
                <p className="text-sm text-muted-foreground">{t('upgrade.monthlyReportDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('upgrade.smartAlerts')}</p>
                <p className="text-sm text-muted-foreground">{t('upgrade.smartAlertsDesc')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-primary">{t('upgrade.price')}</p>
              <p className="text-xs text-muted-foreground">{t('upgrade.priceDaily')}</p>
              <p className="text-xs text-accent-foreground font-medium mt-1">{t('upgrade.freeTrial')}</p>
            </div>
            
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate('/planos');
              }}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('upgrade.subscribe')}
            </Button>
            
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate('/perfil');
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {t('upgrade.referBenefits')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
