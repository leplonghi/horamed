import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ConfettiExplosion from "@/components/celebrations/ConfettiExplosion";
import { useLanguage } from "@/contexts/LanguageContext";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex items-center justify-center p-4">
      <ConfettiExplosion trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t('subscription.welcomePremium')}
            </h1>
            <p className="text-muted-foreground">
              {t('subscription.activatedSuccess')}
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 justify-center text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">{t('subscription.unlockedFeatures')}</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✅ {t('subscription.unlimitedMeds')}</li>
              <li>✅ {t('subscription.unlimitedDocs')}</li>
              <li>✅ {t('subscription.unlimitedAI')}</li>
              <li>✅ {t('subscription.monthlyReports')}</li>
              <li>✅ {t('subscription.allNotifications')}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/hoje")}
              className="w-full"
            >
              {t('subscription.startUsing')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/assinatura")}
              className="w-full"
            >
              {t('subscription.manageSubscription')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('subscription.trialInfo')}
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;