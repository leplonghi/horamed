import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface ProfileHeroHeaderProps {
  userEmail: string;
  onLogout: () => void;
}

export default function ProfileHeroHeader({ userEmail, onLogout }: ProfileHeroHeaderProps) {
  const { isPremium, daysLeft } = useSubscription();
  const { activeProfile } = useUserProfiles();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl p-6",
        "bg-gradient-to-br from-primary/20 via-primary/10 to-background",
        "border border-primary/20"
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        {/* Profile info */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <Avatar className="h-24 w-24 ring-4 ring-primary/30 shadow-xl">
              {activeProfile?.avatar_url ? (
                <AvatarImage src={activeProfile.avatar_url} alt={activeProfile.name} />
              ) : (
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                  {getInitials(activeProfile?.name || '')}
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Premium badge */}
            {isPremium && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-br from-warning to-orange-500 shadow-lg"
              >
                <Crown className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.div>
          
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-bold truncate"
            >
              {activeProfile?.name}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground truncate"
            >
              {userEmail}
            </motion.p>
            
            {/* Status badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex justify-center sm:justify-start gap-2 flex-wrap"
            >
              {isPremium ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-warning/20 to-orange-500/20 text-warning text-sm font-medium border border-warning/30">
                  <Crown className="h-3.5 w-3.5" />
                  Premium
                  <Sparkles className="h-3 w-3" />
                </span>
              ) : daysLeft !== null && daysLeft > 0 ? (
                <button 
                  onClick={() => navigate('/planos')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium border border-orange-500/30 hover:bg-orange-500/20 transition-colors"
                >
                  ⏱️ {daysLeft} {t('profile.daysLeft')}
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/planos')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium border border-border hover:bg-muted/80 transition-colors"
                >
                  {t('common.free')} • {t('common.upgrade')}
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Logout button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-0 right-0"
        >
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
