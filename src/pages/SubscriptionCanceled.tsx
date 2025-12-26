import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const SubscriptionCanceled = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-orange-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t('subscription.canceled')}
            </h1>
            <p className="text-muted-foreground">
              {t('subscription.paymentNotCompleted')}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              {t('subscription.freeAccessInfo')}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/planos")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              {t('subscription.backToPlans')}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/hoje")}
              className="w-full"
            >
              {t('subscription.continueFreePlan')}
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => navigate("/ajuda")}
              className="w-full text-muted-foreground"
            >
              <HelpCircle className="mr-2 w-4 h-4" />
              {t('subscription.needHelp')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('subscription.questionsContact')}
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default SubscriptionCanceled;