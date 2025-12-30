import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, Info } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  value: Date;
  onChange: (value: Date) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingSetTime({ value, onChange, onNext, onBack }: Props) {
  const [selectedOffset, setSelectedOffset] = useState(2); // minutes from now

  useEffect(() => {
    onChange(addMinutes(new Date(), selectedOffset));
  }, [selectedOffset, onChange]);

  const timeOptions = [
    { minutes: 1, label: "1 min" },
    { minutes: 2, label: "2 min" },
    { minutes: 3, label: "3 min" },
    { minutes: 5, label: "5 min" },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Quando você quer o lembrete?
        </h1>
        <p className="text-muted-foreground">
          Para testar agora, vamos usar um horário próximo
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {/* Time selector */}
        <div className="grid grid-cols-4 gap-2">
          {timeOptions.map((option) => (
            <Button
              key={option.minutes}
              variant={selectedOffset === option.minutes ? "default" : "outline"}
              onClick={() => setSelectedOffset(option.minutes)}
              className="h-14 text-lg font-medium"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Selected time display */}
        <div className="bg-muted/50 rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Lembrete às</p>
          <p className="text-4xl font-bold text-primary">
            {format(value, "HH:mm", { locale: ptBR })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            daqui a {selectedOffset} {selectedOffset === 1 ? "minuto" : "minutos"}
          </p>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Depois do teste, você pode ajustar o horário para qualquer hora do dia.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3 pt-4"
      >
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} className="flex-1">
          Confirmar horário
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
