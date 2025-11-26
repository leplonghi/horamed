import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function EssentialShortcuts() {
  const navigate = useNavigate();

  const shortcuts = [
    {
      icon: Plus,
      label: "Adicionar remédio",
      description: "Cadastre um novo medicamento",
      onClick: () => navigate("/adicionar"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: FileText,
      label: "Adicionar documento",
      description: "Faça upload de receita ou exame",
      onClick: () => navigate("/cofre"),
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: FileDown,
      label: "Gerar relatório do mês",
      description: "Baixe o resumo para o médico",
      onClick: () => navigate("/exportar"),
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {shortcuts.map((shortcut, index) => (
        <motion.div
          key={shortcut.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            onClick={shortcut.onClick}
            className="p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary/50 group"
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${shortcut.color} flex-shrink-0 group-hover:scale-110 transition-transform`}
              >
                <shortcut.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {shortcut.label}
                </p>
                <p className="text-xs text-muted-foreground">
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
