import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pill, FileText, FileBarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/perfil")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Como o HoraMed funciona</h1>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-xl flex items-center justify-center flex-shrink-0">
              <Pill className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">1. Remédios</h2>
              <p className="text-muted-foreground">
                Cadastre os remédios, receba lembretes e marque o que tomou. 
                O HoraMed calcula sua adesão automaticamente.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">2. Carteira de Saúde</h2>
              <p className="text-muted-foreground">
                Fotografe receitas, exames e vacinas. Tudo fica guardado por pessoa, 
                fácil de achar na hora da consulta.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileBarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">3. Relatório para o médico</h2>
              <p className="text-muted-foreground">
                Gere um PDF com o resumo do período para levar na consulta. 
                Isso ajuda o médico a entender rapidamente o que aconteceu desde a última vez.
              </p>
            </div>
          </div>
        </Card>

        <div className="pt-4">
          <Button 
            onClick={() => navigate("/perfil")}
            className="w-full"
            size="lg"
          >
            Entendi, voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
