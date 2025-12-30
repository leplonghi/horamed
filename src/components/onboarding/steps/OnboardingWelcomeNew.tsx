import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

interface Props {
  onNext: () => void;
  onSkip: () => void;
}

export default function OnboardingWelcomeNew({ onNext, onSkip }: Props) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
      >
        <Heart className="w-12 h-12 text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold text-foreground">
          Vamos organizar sua rotina juntos
        </h1>
        <p className="text-lg text-muted-foreground">
          Você não precisa lembrar de tudo. O HoraMed cuida dos horários para você.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3 pt-4"
      >
        <Button
          size="lg"
          onClick={onNext}
          className="w-full h-14 text-lg font-semibold"
        >
          Começar agora
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground"
        >
          Pular e explorar
        </Button>
      </motion.div>
    </div>
  );
}
