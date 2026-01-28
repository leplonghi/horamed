import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Clock, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

const SOCIAL_PROOF_MESSAGES_PT = [
  { icon: Users, text: "127 pessoas assinaram hoje", color: "text-green-500" },
  { icon: TrendingUp, text: "Adesão média dos Premium: 94%", color: "text-blue-500" },
  { icon: Star, text: "4.9★ avaliação dos usuários Premium", color: "text-yellow-500" },
  { icon: Clock, text: "Economize 15min/dia com relatórios automáticos", color: "text-purple-500" },
  { icon: Users, text: "5.234 famílias confiam no HoraMed", color: "text-primary" },
];

const SOCIAL_PROOF_MESSAGES_EN = [
  { icon: Users, text: "127 people subscribed today", color: "text-green-500" },
  { icon: TrendingUp, text: "Premium average adherence: 94%", color: "text-blue-500" },
  { icon: Star, text: "4.9★ rating from Premium users", color: "text-yellow-500" },
  { icon: Clock, text: "Save 15min/day with auto reports", color: "text-purple-500" },
  { icon: Users, text: "5,234 families trust HoraMed", color: "text-primary" },
];

interface SocialProofBannerProps {
  className?: string;
  onClick?: () => void;
}

export default function SocialProofBanner({ className, onClick }: SocialProofBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { language } = useLanguage();
  
  const messages = language === 'pt' ? SOCIAL_PROOF_MESSAGES_PT : SOCIAL_PROOF_MESSAGES_EN;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Don't show for premium users
  if (isPremium) return null;

  const current = messages[currentIndex];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <button
        type="button"
        onClick={onClick || (() => navigate("/planos"))}
        className="w-full py-2 px-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-2"
          >
            <Icon className={`h-4 w-4 ${current.color}`} />
            <span className="text-sm font-medium">{current.text}</span>
          </motion.div>
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
