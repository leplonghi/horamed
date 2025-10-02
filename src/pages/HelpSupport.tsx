import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpSupport() {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    window.location.href = "mailto:appmedhora@gmail.com";
  };


  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Ajuda e Suporte</h2>
              <p className="text-muted-foreground">Estamos aqui para ajudar você</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Entre em Contato</h3>
            
            <Card className="p-4 hover:bg-accent/50 transition-colors">
              <button
                onClick={handleContactSupport}
                className="w-full text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">E-mail</p>
                    <p className="text-sm text-muted-foreground">appmedhora@gmail.com</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </button>
            </Card>

          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Perguntas Frequentes</h3>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Como adicionar um medicamento?</AccordionTrigger>
                <AccordionContent>
                  Vá para a página "Adicionar" no menu inferior e preencha as informações do medicamento.
                  Você pode adicionar manualmente ou usar a IA para ler sua receita médica.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Como funciona o OCR de receitas?</AccordionTrigger>
                <AccordionContent>
                  Com o plano Premium, você pode tirar uma foto da sua receita médica e nossa IA
                  extrairá automaticamente o nome do medicamento, dosagem e outras informações.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Posso editar um lembrete?</AccordionTrigger>
                <AccordionContent>
                  Sim! Vá para a página "Rotina", encontre o medicamento que deseja editar e clique no ícone de lápis.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Como funciona o controle de estoque?</AccordionTrigger>
                <AccordionContent>
                  Ao adicionar um medicamento, você pode ativar o controle de estoque informando a quantidade total.
                  O app descontará automaticamente cada vez que você marcar uma dose como tomada.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>O que é adesão ao tratamento?</AccordionTrigger>
                <AccordionContent>
                  A adesão mede o percentual de doses tomadas corretamente em relação ao total programado.
                  Acompanhe sua adesão na página "Hoje" e "Gráficos".
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Tempo de resposta:</span>
              <br />
              E-mail: até 72 horas
            </p>
          </Card>

          <Card className="p-6 bg-warning/10 border-warning/20 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-warning" />
              Aviso Legal e Responsabilidade
            </h3>
            <div className="space-y-2 text-sm text-foreground">
              <p>
                <span className="font-semibold">Responsabilidade do Usuário:</span> O MedHora é uma ferramenta de organização e lembrete de medicamentos. Cada usuário é totalmente responsável por suas próprias decisões de saúde e tratamento médico.
              </p>
              <p>
                <span className="font-semibold">Não Substitui Orientação Médica:</span> Este aplicativo não substitui consultas médicas, diagnósticos ou orientações de profissionais de saúde habilitados. Sempre consulte seu médico antes de iniciar, alterar ou interromper qualquer tratamento.
              </p>
              <p>
                <span className="font-semibold">Limitação de Responsabilidade:</span> O MedHora não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Decisões de saúde tomadas com base nas informações do app</li>
                <li>Erros de digitação ou interpretação de receitas médicas</li>
                <li>Falhas técnicas, notificações não recebidas ou perda de dados</li>
                <li>Interações medicamentosas ou efeitos adversos</li>
                <li>Consequências do uso inadequado da ferramenta</li>
              </ul>
              <p className="font-semibold mt-3">
                Ao usar o MedHora, você concorda com estes termos e assume total responsabilidade pela sua saúde e tratamento.
              </p>
            </div>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}
