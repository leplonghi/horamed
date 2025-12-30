import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Pill } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const suggestions = [
  "Pressão",
  "Vitamina D",
  "Dipirona",
  "Omeprazol",
  "AAS",
];

export default function OnboardingFirstItem({ value, onChange, onNext, onBack }: Props) {
  const [focused, setFocused] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Pill className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Qual seu primeiro medicamento?
        </h1>
        <p className="text-muted-foreground">
          Pode ser medicamento, suplemento ou vitamina
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: Pressão, Vitamina D, Tratamento diário"
          className="h-14 text-lg"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />

        {/* Quick suggestions */}
        {(!value || focused) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="rounded-full"
              >
                {suggestion}
              </Button>
            ))}
          </motion.div>
        )}
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
        <Button 
          onClick={onNext} 
          disabled={!value.trim()}
          className="flex-1"
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
