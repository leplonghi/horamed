import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import claraAvatar from "@/assets/clara-avatar.png";

interface Props {
  onComplete: () => void;
}

export default function OnboardingClara({ onComplete }: Props) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="relative w-28 h-28 mx-auto"
      >
        <img 
          src={claraAvatar} 
          alt="Clara" 
          className="w-full h-full rounded-full object-cover border-4 border-primary/20"
        />
        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Prazer, eu sou a Clara! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Vou te ajudar a acompanhar sua rotina e te avisar sempre no horário certo.
        </p>
      </motion.div>

      {/* Clara's features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-muted/50 rounded-xl p-4 text-left space-y-3"
      >
        <p className="font-medium text-foreground">Eu posso te ajudar com:</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">•</span>
            Dúvidas sobre medicamentos
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">•</span>
            Interações entre remédios
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">•</span>
            Ajustes na sua rotina
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">•</span>
            Relatórios de adesão
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="pt-4"
      >
        <Button
          size="lg"
          onClick={onComplete}
          className="w-full h-14 text-lg font-semibold"
        >
          Ver minha rotina
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
