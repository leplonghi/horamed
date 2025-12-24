import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
export default function EssentialShortcuts() {
  const navigate = useNavigate();
  const shortcuts = [{
    icon: Plus,
    label: "Adicionar remédio",
    description: "Cadastre um novo medicamento",
    onClick: () => navigate("/adicionar"),
    color: "from-blue-500 to-cyan-500"
  }, {
    icon: FileText,
    label: "Adicionar documento",
    description: "Faça upload de receita ou exame",
    onClick: () => navigate("/carteira"),
    color: "from-green-500 to-emerald-500"
  }, {
    icon: FileDown,
    label: "Gerar relatório do mês",
    description: "Baixe o resumo para o médico",
    onClick: () => navigate("/exportar"),
    color: "from-purple-500 to-pink-500"
  }];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {shortcuts.map((shortcut, index) => (
        <motion.div
          key={shortcut.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="min-w-0"
        >
          <Card
            onClick={shortcut.onClick}
            className="p-4 cursor-pointer border-2 transition-shadow md:hover:shadow-lg md:hover:border-primary/50 group overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${shortcut.color} flex-shrink-0 md:group-hover:scale-110 transition-transform`}
                aria-hidden="true"
              >
                <shortcut.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground md:group-hover:text-primary transition-colors leading-tight break-words">
                  {shortcut.label}
                </p>
                <p className="text-xs text-muted-foreground leading-snug break-words whitespace-normal">
                  {shortcut.description}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}