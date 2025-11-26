import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, FileBarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EssentialShortcuts() {
  const navigate = useNavigate();

  const shortcuts = [
    {
      icon: Plus,
      label: "Adicionar remédio",
      description: "Cadastre um remédio e receba lembretes",
      onClick: () => navigate("/adicionar"),
      color: "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400",
    },
    {
      icon: FileText,
      label: "Adicionar documento",
      description: "Guarde receitas, exames e vacinas",
      onClick: () => navigate("/cofre/upload"),
      color: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
    },
    {
      icon: FileBarChart,
      label: "Gerar relatório do mês",
      description: "Resumo para levar na consulta",
      onClick: () => navigate("/relatorio-mensal"),
      color: "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-3">
      {shortcuts.map((shortcut, index) => (
        <Card
          key={index}
          className="p-4 hover:border-primary transition-colors cursor-pointer"
          onClick={shortcut.onClick}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${shortcut.color}`}>
              <shortcut.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{shortcut.label}</h3>
              <p className="text-sm text-muted-foreground">{shortcut.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
