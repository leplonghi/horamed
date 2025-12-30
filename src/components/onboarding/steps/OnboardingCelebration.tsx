import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import Confetti from "react-confetti";

interface Props {
  onNext: () => void;
}

export default function OnboardingCelebration({ onNext }: Props) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center space-y-8">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto"
      >
        <CheckCircle className="w-14 h-14 text-primary-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold text-foreground">
          Pronto. Funcionou! 🎉
        </h1>
        <p className="text-lg text-muted-foreground">
          Sempre que for hora, a gente avisa. Você não precisa lembrar de nada.
        </p>
      </motion.div>

      {/* Stats preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-4 py-4"
      >
        {[
          { value: "1", label: "dose registrada" },
          { value: "100%", label: "adesão hoje" },
          { value: "1", label: "dia de streak" },
        ].map((stat, index) => (
          <div key={index} className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="pt-4"
      >
        <Button
          size="lg"
          onClick={onNext}
          className="w-full h-14 text-lg font-semibold"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Continuar
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
