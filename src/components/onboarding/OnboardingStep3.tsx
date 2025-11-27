import { motion } from "framer-motion";
import { Bell, FileText, Users, Sparkles, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { value: "reminders", label: "Esquecer horários", icon: Bell, description: "Nunca mais esquecer uma dose" },
  { value: "documents", label: "Organizar documentos", icon: FileText, description: "Carteira digital de saúde" },
  { value: "family", label: "Saúde da família", icon: Users, description: "Cuidar de quem amo" },
  { value: "all", label: "Tudo isso", icon: Sparkles, description: "Experiência completa" },
];

export default function OnboardingStep3({ value, onChange }: Props) {
  const { triggerLight } = useHapticFeedback();

  const handleSelect = (optionValue: string) => {
    triggerLight();
    onChange(optionValue);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          O que mais te preocupa?
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Vamos focar no que importa para você
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative ${
                  isSelected
                    ? "border-primary border-2 bg-primary/5 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {isSelected && (
                  <motion.div
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </motion.div>
                )}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`p-4 rounded-full ${
                      isSelected ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
