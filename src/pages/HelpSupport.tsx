import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, FileText, ExternalLink, BookOpen, Lightbulb, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
              <p className="text-muted-foreground">Aprenda a usar o HoraMed</p>
            </div>
          </div>

          <Tabs defaultValue="tutorial" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tutorial">
                <Play className="h-4 w-4 mr-2" />
                Tutorial
              </TabsTrigger>
              <TabsTrigger value="dicas">
                <Lightbulb className="h-4 w-4 mr-2" />
                Dicas
              </TabsTrigger>
              <TabsTrigger value="faq">
                <FileText className="h-4 w-4 mr-2" />
                FAQ
              </TabsTrigger>
            </TabsList>

            {/* Tutorial Tab */}
            <TabsContent value="tutorial" className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Como Funciona o HoraMed</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">📱 Passo 1: Configure seu Perfil</h4>
                    <p className="text-sm text-muted-foreground">
                      Vá em "Perfil" e adicione suas informações básicas. Você pode criar múltiplos perfis 
                      para gerenciar medicamentos de familiares.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">💊 Passo 2: Adicione Medicamentos</h4>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Adicionar" no menu inferior. Você pode:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                      <li>Digitar manualmente as informações</li>
                      <li>Usar OCR para escanear receitas (Premium)</li>
                      <li>Definir horários e frequência</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">⏰ Passo 3: Gerencie seus Horários</h4>
                    <p className="text-sm text-muted-foreground">
                      Na página "Rotina", visualize todos os medicamentos e horários configurados. 
                      Edite ou exclua conforme necessário.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">✅ Passo 4: Confirme suas Doses</h4>
                    <p className="text-sm text-muted-foreground">
                      Na página "Hoje", veja as doses do dia e marque como tomada, pulada ou atrasada. 
                      Isso ajuda a acompanhar sua adesão ao tratamento.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">📊 Passo 5: Acompanhe seu Progresso</h4>
                    <p className="text-sm text-muted-foreground">
                      Use "Gráficos" para visualizar sua adesão ao longo do tempo e identificar padrões.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">🎯 Recursos Principais</h3>
                
                <div className="space-y-3">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">Controle de Estoque</h4>
                    <p className="text-xs text-muted-foreground">
                      Ative ao adicionar um medicamento para ser alertado quando o estoque estiver baixo.
                    </p>
                  </div>

                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">Histórico de Saúde</h4>
                    <p className="text-xs text-muted-foreground">
                      Armazene exames, consultas e documentos médicos na "Carteira de Saúde".
                    </p>
                  </div>

                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">Compartilhamento</h4>
                    <p className="text-xs text-muted-foreground">
                      Compartilhe seu histórico com médicos ou cuidadores de forma segura.
                    </p>
                  </div>

                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">Relatórios Mensais</h4>
                    <p className="text-xs text-muted-foreground">
                      Gere PDFs automáticos com resumo da sua adesão e histórico mensal.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Dicas Tab */}
            <TabsContent value="dicas" className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Dicas para Melhor Uso</h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tip-1">
                    <AccordionTrigger>💡 Maximize suas Notificações</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>Configure múltiplos lembretes para medicamentos críticos:</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>Ative sons e vibração em "Configurações de Alarme"</li>
                        <li>Configure um lembrete 10 minutos antes do horário principal</li>
                        <li>Use o recurso de "lembrete persistente" para não esquecer</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-2">
                    <AccordionTrigger>📝 Organize seu Tratamento</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>Use tags e categorias para organizar melhor:</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>Separe medicamentos contínuos dos temporários</li>
                        <li>Adicione notas sobre efeitos colaterais observados</li>
                        <li>Mantenha a Carteira de Saúde atualizada com exames recentes</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-3">
                    <AccordionTrigger>⚡ Economize Tempo com OCR</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>Para melhores resultados com OCR de receitas:</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>Tire fotos em boa iluminação</li>
                        <li>Mantenha a receita reta e sem sombras</li>
                        <li>Capture apenas uma receita por vez</li>
                        <li>Sempre revise as informações extraídas</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-4">
                    <AccordionTrigger>🎯 Melhore sua Adesão</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>Estratégias para não esquecer:</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>Associe medicamentos a rotinas diárias (café da manhã, jantar)</li>
                        <li>Deixe medicamentos em locais visíveis</li>
                        <li>Use o gráfico de adesão para identificar padrões de esquecimento</li>
                        <li>Configure lembretes para reabastecer com antecedência</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-5">
                    <AccordionTrigger>👨‍⚕️ Prepare-se para Consultas</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>Use o app para facilitar consultas médicas:</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>Gere relatórios PDF antes da consulta</li>
                        <li>Mostre seu gráfico de adesão ao médico</li>
                        <li>Anote dúvidas sobre medicamentos nas notas</li>
                        <li>Compartilhe histórico diretamente com o médico</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>

              <Card className="p-4 bg-accent/50">
                <p className="text-sm text-foreground">
                  <strong>💡 Dica Pro:</strong> Crie o hábito de abrir o app pela manhã para 
                  revisar as doses do dia. Isso aumenta significativamente a adesão!
                </p>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Perguntas Frequentes</h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-1">
                    <AccordionTrigger>Como adicionar um medicamento?</AccordionTrigger>
                    <AccordionContent>
                      Vá para a página "Adicionar" no menu inferior e preencha as informações do medicamento.
                      Você pode adicionar manualmente ou usar a IA para ler sua receita médica (Premium).
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2">
                    <AccordionTrigger>Como funciona o OCR de receitas?</AccordionTrigger>
                    <AccordionContent>
                      Com o plano Premium, tire uma foto da receita médica e a IA extrairá automaticamente 
                      nome, dosagem e frequência. Sempre revise as informações antes de salvar.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3">
                    <AccordionTrigger>Posso editar um lembrete depois de criar?</AccordionTrigger>
                    <AccordionContent>
                      Sim! Vá em "Rotina", encontre o medicamento e clique no ícone de lápis para editar 
                      horários, dosagens ou frequência.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4">
                    <AccordionTrigger>Como funciona o controle de estoque?</AccordionTrigger>
                    <AccordionContent>
                      Ative o controle ao adicionar o medicamento e informe a quantidade. O app desconta 
                      automaticamente a cada dose marcada como tomada e avisa quando estiver acabando.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-5">
                    <AccordionTrigger>O que é adesão ao tratamento?</AccordionTrigger>
                    <AccordionContent>
                      Adesão é o percentual de doses tomadas corretamente. O ideal é manter acima de 80%. 
                      Acompanhe na página "Hoje" e "Gráficos".
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6">
                    <AccordionTrigger>Como criar perfis para familiares?</AccordionTrigger>
                    <AccordionContent>
                      Vá em "Perfil" → "Gerenciar Perfis" → "Criar Novo Perfil". Você pode alternar entre 
                      perfis para gerenciar medicamentos de diferentes pessoas.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-7">
                    <AccordionTrigger>Posso usar o app offline?</AccordionTrigger>
                    <AccordionContent>
                      Funcionalidades básicas funcionam offline, mas sincronização, OCR e recursos Premium 
                      requerem conexão com internet.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-8">
                    <AccordionTrigger>Como compartilhar meu histórico com o médico?</AccordionTrigger>
                    <AccordionContent>
                      Vá em "Carteira de Saúde", selecione documentos e clique em "Compartilhar". Você pode 
                      gerar um link temporário ou exportar como PDF.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-9">
                    <AccordionTrigger>O app substitui consultas médicas?</AccordionTrigger>
                    <AccordionContent>
                      NÃO! O HoraMed é apenas uma ferramenta de organização. Sempre consulte profissionais 
                      de saúde para decisões sobre seu tratamento.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-10">
                    <AccordionTrigger>Como exportar meus dados?</AccordionTrigger>
                    <AccordionContent>
                      Vá em "Perfil" → "Privacidade" → "Exportar meus dados". Você receberá um arquivo JSON 
                      com todas as suas informações (LGPD).
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Contact Section */}
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
                  <p className="font-medium text-foreground">Ainda precisa de ajuda?</p>
                  <p className="text-sm text-muted-foreground">appmedhora@gmail.com</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Tempo de resposta:</span> até 72 horas
            </p>
          </Card>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/terms")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Termos de Uso e LGPD
          </Button>
        </div>
      </div>
      <Navigation />
    </>
  );
}
