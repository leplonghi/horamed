import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Camera, TrendingDown, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AIAssistantInput() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // TODO: Implement AI assistant logic
    toast.info("Assistente IA em desenvolvimento");
    console.log("AI query:", query);
  };

  const suggestions = [
    {
      icon: Camera,
      label: "Adicionar remédios de uma receita",
      onClick: () => navigate("/cofre/upload"),
    },
    {
      icon: TrendingDown,
      label: "Ver o que vai acabar",
      onClick: () => navigate("/estoque"),
    },
    {
      icon: FileText,
      label: "Gerar relatório do mês",
      onClick: () => navigate("/relatorio-mensal"),
    },
  ];

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Pergunte ao HoraMed</label>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: 'quero adicionar os remédios desta receita'"
            className="flex-1 h-12"
          />
          <Button type="submit" size="icon" className="h-12 w-12">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={suggestion.onClick}
            className="text-xs h-9 gap-1.5"
          >
            <suggestion.icon className="w-3.5 h-3.5" />
            {suggestion.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
