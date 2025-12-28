import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ConfettiExplosion from "./ConfettiExplosion";
import StreakAnimation from "./StreakAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streak: number;
  milestone?: { days: number; badge: string; reward: string };
}

export default function DailyCompleteModal({
  open,
  onOpenChange,
  streak,
  milestone,
}: Props) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-none bg-gradient-to-br from-background to-primary/5">
        <ConfettiExplosion trigger={open} />
        
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <div className="p-6 rounded-full bg-primary/10">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
          </motion.div>

          <div className="space-y-2">
            <motion.h2
              className="text-3xl font-bold text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t('dailyComplete.congrats')}
            </motion.h2>
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t('dailyComplete.completedAll')}
            </motion.p>
          </div>

          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StreakAnimation streak={streak} />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{streak} {t('dailyComplete.days')}</p>
              <p className="text-sm text-muted-foreground">{t('dailyComplete.commitment')}</p>
            </div>
          </motion.div>

          {milestone && (
            <motion.div
              className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-lg font-semibold text-foreground mb-2">
                {milestone.badge}
              </p>
              <p className="text-sm text-muted-foreground">
                {milestone.reward}
              </p>
            </motion.div>
          )}

          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {t('dailyComplete.continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}