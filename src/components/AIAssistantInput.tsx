import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AIAssistantInputProps {
  onSubmit: (query: string) => void;
}

export default function AIAssistantInput({ onSubmit }: AIAssistantInputProps) {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await onSubmit(query.trim());
      setQuery("");
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-4 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Assistente HoraMed
            </p>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pergunte ao HoraMed (ex.: quero adicionar os remédios desta receita)"
                className="flex-1 bg-background"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!query.trim() || isProcessing}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use o assistente para adicionar remédios, gerar relatórios ou consultar informações
            </p>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
