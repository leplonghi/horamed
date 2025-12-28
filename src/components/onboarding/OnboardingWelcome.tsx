import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Bell, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/horamed-logo-transparent.png";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onStart: () => void;
  onSkip: () => void;
}

export default function OnboardingWelcome({ onStart, onSkip }: Props) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { t } = useLanguage();

  const benefits = [
    { icon: Bell, text: t('onboardingWelcome.smartReminders') },
    { icon: FileText, text: t('onboardingWelcome.organizedDocs') },
    { icon: Users, text: t('onboardingWelcome.manageFamily') },
  ];

  const handleStart = () => {
    if (!acceptedTerms) {
      toast.error(t('onboardingWelcome.acceptTerms'));
      return;
    }
    onStart();
  };

  return (
    <div className="space-y-12">
      <motion.div
        className="flex justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <img src={logo} alt="HoraMed" className="h-40 w-auto" />
      </motion.div>

      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            {t('onboardingWelcome.welcome')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('onboardingWelcome.tagline')}
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-4 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                className="flex items-center gap-3 w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-foreground text-lg font-medium">
                  {benefit.text}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <motion.div
        className="space-y-4 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border">
          <Checkbox
            id="onboarding-terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="onboarding-terms"
            className="text-sm text-muted-foreground leading-tight cursor-pointer"
          >
            {t('onboardingWelcome.acceptTermsLabel')}{" "}
            <Link 
              to="/termos" 
              target="_blank"
              className="text-primary hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {t('onboardingWelcome.termsLink')}
            </Link>
          </label>
        </div>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={!acceptedTerms}
          className="w-full text-lg h-14 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart className="h-5 w-5 mr-2" />
          {t('onboardingWelcome.letsStart')}
        </Button>

        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('onboardingWelcome.alreadyUser')}
        </button>
      </motion.div>
    </div>
  );
}