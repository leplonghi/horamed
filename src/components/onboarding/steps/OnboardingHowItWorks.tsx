import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, TrendingUp, ArrowRight, ArrowLeft } from "lucide-react";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingHowItWorks({ onNext, onBack }: Props) {
  const features = [
    {
      icon: Bell,
      title: "Avisamos no horário certo",
      description: "Notificações precisas para nunca esquecer",
    },
    {
      icon: CheckCircle,
      title: "Registramos o que foi feito",
      description: "Histórico completo de todas as doses",
    },
    {
      icon: TrendingUp,
      title: "Mostramos seu progresso",
      description: "Acompanhe sua adesão ao tratamento",
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Como funciona
        </h1>
        <p className="text-muted-foreground">
          Simples, confiável, eficiente
        </p>
      </motion.div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex gap-3 pt-4"
      >
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} className="flex-1">
          Vamos configurar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
