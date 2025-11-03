import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Plus, Clock, Pill, Package, FolderHeart, Calendar, 
  Bell, Camera, Share2, AlertCircle, CheckCircle2,
  ArrowRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";

export default function Tutorial() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inicio");

  const tutorials = [
    {
      id: "inicio",
      title: "Primeiros Passos",
      icon: CheckCircle2,
      sections: [
        {
          title: "Como adicionar um medicamento?",
          icon: Plus,
          steps: [
            "Clique no botão + flutuante no canto inferior direito",
            "Escolha 'Manual' para digitar ou 'Ler Remédio' para tirar foto",
            "Preencha o nome, dosagem e categoria",
            "Configure os horários que você deve tomar",
            "Ative o controle de estoque (opcional)",
            "Clique em 'Salvar item'",
          ],
          tip: "Dica: Use a opção 'Ler Remédio' para fotografar a caixa ou receita e preencher automaticamente!",
        },
        {
          title: "Como confirmar que tomei um medicamento?",
          icon: CheckCircle2,
          steps: [
            "Vá para a página 'Hoje' no menu inferior",
            "Encontre o medicamento na lista",
            "Clique no botão verde '✓ Tomei'",
            "O medicamento será marcado como tomado e o estoque será atualizado",
          ],
          tip: "Você também pode adiar por 15 minutos ou pular a dose se necessário.",
        },
      ],
    },
    {
      id: "medicamentos",
      title: "Gerenciar Medicamentos",
      icon: Pill,
      sections: [
        {
          title: "Como editar horários?",
          icon: Clock,
          steps: [
            "Vá para 'Medicamentos' no menu inferior",
            "Clique no ícone de lápis ao lado do medicamento",
            "Edite os horários ou adicione novos",
            "Clique em 'Atualizar item'",
          ],
        },
        {
          title: "Como funciona o controle de estoque?",
          icon: Package,
          steps: [
            "Ao adicionar/editar medicamento, ative 'Controlar Estoque'",
            "Informe a quantidade total que você tem",
            "Configure o alerta de estoque baixo (em %)",
            "O sistema desconta automaticamente quando você confirma doses",
            "Receba alertas quando o estoque estiver acabando",
          ],
          tip: "O sistema calcula quantos dias seu estoque vai durar baseado no consumo!",
        },
        {
          title: "Duração do tratamento",
          icon: Calendar,
          steps: [
            "Ao adicionar medicamento, preencha 'Duração do Tratamento'",
            "Informe a data de início",
            "Digite quantos dias deve durar (ex: 7, 14, 30 dias)",
            "Opcionalmente, informe o total de doses",
            "O sistema calcula automaticamente a data de término",
          ],
        },
      ],
    },
    {
      id: "cofre",
      title: "Cofre de Saúde",
      icon: FolderHeart,
      sections: [
        {
          title: "Como adicionar documentos?",
          icon: Camera,
          steps: [
            "Acesse 'Cofre' no menu inferior",
            "Clique em 'Adicionar Documento'",
            "Use OCR para escanear ou selecione arquivo",
            "Preencha título, categoria e datas",
            "Configure lembretes (opcional)",
            "Clique em 'Fazer Upload'",
          ],
        },
        {
          title: "Como compartilhar com médico?",
          icon: Share2,
          steps: [
            "Abra o documento no Cofre",
            "Clique em 'Compartilhar'",
            "Defina o prazo de expiração do link",
            "Permita ou não o download",
            "Copie o link e envie para o médico",
            "Revogue o acesso quando quiser",
          ],
          tip: "Os links de compartilhamento expiram automaticamente por segurança!",
        },
      ],
    },
    {
      id: "notificacoes",
      title: "Notificações",
      icon: Bell,
      sections: [
        {
          title: "Como ativar lembretes?",
          icon: Bell,
          steps: [
            "Vá em Mais → Configurações de Notificações",
            "Ative as notificações push",
            "Permita no navegador quando solicitado",
            "Configure alertas sonoros (opcional)",
            "Os lembretes aparecerão nos horários configurados",
          ],
          tip: "As notificações funcionam mesmo com o app fechado!",
        },
      ],
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Central de Ajuda</h1>
            <p className="text-muted-foreground mt-2">
              Aprenda a usar todos os recursos do HoraMed
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {tutorials.map((tutorial) => (
                <TabsTrigger key={tutorial.id} value={tutorial.id} className="gap-2">
                  <tutorial.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tutorial.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tutorials.map((tutorial) => (
              <TabsContent key={tutorial.id} value={tutorial.id} className="space-y-4">
                {tutorial.sections.map((section, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <section.icon className="h-5 w-5 text-primary" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ol className="space-y-2">
                        {section.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                              {stepIdx + 1}
                            </span>
                            <span className="text-sm pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>

                      {section.tip && (
                        <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm">
                            <strong>Dica:</strong> {section.tip}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Ainda tem dúvidas?</h3>
                  <p className="text-sm text-muted-foreground">
                    Visite nossa central de ajuda completa
                  </p>
                </div>
                <Button onClick={() => navigate("/ajuda")}>
                  Ajuda
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}
