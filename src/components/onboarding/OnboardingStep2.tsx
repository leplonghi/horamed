import { motion } from "framer-motion";
import { Pill, AlertCircle, Crown, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function OnboardingStep2({ value, onChange }: Props) {
  const { triggerLight } = useHapticFeedback();
  const { t } = useLanguage();

  const options = [
    { value: "1-2", label: t('onboardingStep2.1to2'), icon: Pill, description: t('onboardingStep2.basic'), badge: "" },
    { value: "3-5", label: t('onboardingStep2.3to5'), icon: Pill, description: t('onboardingStep2.moderate'), badge: "" },
    { value: "6+", label: t('onboardingStep2.6plus'), icon: AlertCircle, description: t('onboardingStep2.complex'), badge: t('onboardingStep2.premiumRec') },
  ];

  const handleSelect = (optionValue: string) => {
    triggerLight();
    onChange(optionValue);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {t('onboardingStep2.title')}
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t('onboardingStep2.subtitle')}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          const isPremium = option.value === "6+";

          return (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative ${
                  isSelected
                    ? "border-primary border-2 bg-primary/5 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {isSelected && !isPremium && (
                  <motion.div
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </motion.div>
                )}
                {isPremium && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500">
                      <Crown className="h-3 w-3" />
                      Premium
                    </Badge>
                  </div>
                )}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`p-4 rounded-full ${
                      isSelected ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                    {option.badge && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                        {option.badge}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}