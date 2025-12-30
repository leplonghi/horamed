import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Pill } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface Props {
  itemName: string;
  onTaken: () => void;
  onSnooze: () => void;
}

export default function OnboardingFirstDose({ itemName, onTaken, onSnooze }: Props) {
  const { triggerSuccess, triggerLight } = useHapticFeedback();

  const handleTaken = () => {
    triggerSuccess();
    onTaken();
  };

  const handleSnooze = () => {
    triggerLight();
    onSnooze();
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl font-bold text-foreground">
          🔔 Hora do remédio!
        </h1>
        <p className="text-muted-foreground">
          Esse é o lembrete que você configurou
        </p>
      </motion.div>

      {/* Dose card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
            <Pill className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">{itemName}</h3>
            <p className="text-muted-foreground">1 dose</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            onClick={handleTaken}
            className="w-full h-16 text-lg font-semibold bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="w-6 h-6 mr-3" />
            ✓ Tomado
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleSnooze}
            className="w-full h-14 text-lg"
          >
            <Clock className="w-5 h-5 mr-2" />
            ⏰ Adiar 10 min
          </Button>
        </div>
      </motion.div>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-muted-foreground"
      >
        Para esse teste, você pode clicar em "Tomado" agora
      </motion.p>
    </div>
  );
}
