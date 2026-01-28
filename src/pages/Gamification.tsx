import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { GamificationHub } from "@/components/gamification/GamificationHub";
import { useLanguage } from "@/contexts/LanguageContext";
import AchievementTease from "@/components/fomo/AchievementTease";
import SocialProofBanner from "@/components/fomo/SocialProofBanner";

export default function Gamification() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background page-container">
      <PageHeader
        title={t('gamification.title') || "Sua Jornada"}
        description={t('gamification.description') || "Acompanhe seu progresso e conquistas"}
      />

      {/* FOMO: Social proof banner */}
      <SocialProofBanner className="mb-4" />

      <motion.div 
        className="container mx-auto p-4 pb-24 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <GamificationHub />
        
        {/* FOMO: Premium achievement teaser */}
        <AchievementTease className="mt-6" />
      </motion.div>
    </div>
  );
}
