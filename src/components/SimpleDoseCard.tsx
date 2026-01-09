import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Pill, Info } from "lucide-react";
import { motion } from "framer-motion";
import MedicationInfoSheet from "./MedicationInfoSheet";
import { useMedicationInfo } from "@/hooks/useMedicationInfo";
import { useLanguage } from "@/contexts/LanguageContext";

interface SimpleDoseCardProps {
  time: string;
  medicationName: string;
  dose?: string;
  status: "pending" | "taken" | "missed";
  onTake: () => void;
  onSkip: () => void;
  onSnooze: () => void;
}

export default function SimpleDoseCard({
  time,
  medicationName,
  dose,
  status,
  onTake,
  onSkip,
  onSnooze,
}: SimpleDoseCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { info, isLoading, error, fetchInfo, clearInfo } = useMedicationInfo();
  const { t } = useLanguage();

  const statusColors = {
    pending: "border-l-yellow-500 bg-gradient-to-br from-yellow-50/60 to-yellow-50/30 dark:from-yellow-950/20 dark:to-yellow-950/5 backdrop-blur-sm",
    taken: "border-l-green-500 bg-gradient-to-br from-green-50/60 to-green-50/30 dark:from-green-950/20 dark:to-green-950/5 backdrop-blur-sm opacity-70",
    missed: "border-l-red-500 bg-gradient-to-br from-red-50/60 to-red-50/30 dark:from-red-950/20 dark:to-red-950/5 backdrop-blur-sm",
  };

  const isPending = status === "pending";

  const handleShowInfo = () => {
    setShowInfo(true);
    fetchInfo(medicationName);
  };

  const handleCloseInfo = (open: boolean) => {
    setShowInfo(open);
    if (!open) {
      clearInfo();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card
          className={`p-5 border-l-4 ${statusColors[status]} transition-all shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)]`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-foreground">
                      {medicationName}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={handleShowInfo}
                      title={t('doseCard.viewMedInfo')}
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  {dose && (
                    <p className="text-sm text-muted-foreground">{dose}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isPending && (
              <div className="flex gap-2">
                <Button
                  onClick={onTake}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold h-11"
                >
                  ✓ {t('doseCard.takeNow')}
                </Button>
                <Button
                  onClick={onSkip}
                  variant="outline"
                  className="h-11 px-4"
                >
                  {t('doseCard.skip')}
                </Button>
                <Button
                  onClick={onSnooze}
                  variant="outline"
                  className="h-11 px-4"
                >
                  {t('doseCard.snooze')}
                </Button>
              </div>
            )}

            {status === "taken" && (
              <div className="text-center py-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ {t('doseCard.taken')}
                </span>
              </div>
            )}

            {status === "missed" && (
              <div className="text-center py-2">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t('doseCard.missed')}
                </span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <MedicationInfoSheet
        open={showInfo}
        onOpenChange={handleCloseInfo}
        medicationName={medicationName}
        info={info}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}