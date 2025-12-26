import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, AlertCircle, CreditCard, Lock, Cookie, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Documento Legal</h2>
              <p className="text-muted-foreground">Termos, Privacidade e LGPD</p>
            </div>
          </div>

          {/* Header Info */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="space-y-2 text-sm">
              <p><strong>Aplicativo:</strong> HoraMed</p>
              <p><strong>Responsável:</strong> Luis Eduardo Paim Longhi</p>
              <p><strong>Última atualização:</strong> 25/11/2025</p>
              <p><strong>Contato:</strong> <a href="mailto:app.medhora@gmail.com" className="text-primary hover:underline">app.medhora@gmail.com</a></p>
              <p><strong>Localização:</strong> São Luís - MA</p>
            </div>
          </Card>

          {/* Accordion with all sections */}
          <Accordion type="multiple" className="space-y-4">
            
            {/* 1. Terms of Use */}
            <AccordionItem value="terms" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">1. Termos de Uso do HoraMed</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <div>
                  <h4 className="font-semibold mb-2">1.1. Aceitação dos Termos</h4>
                  <p className="text-muted-foreground">
                    Ao instalar, acessar ou utilizar o aplicativo HoraMed, você declara que leu, compreendeu e concorda integralmente com este Documento Legal. 
                    Caso não concorde com qualquer disposição, não deve utilizar o HoraMed.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">1.2. Elegibilidade</h4>
                  <p className="text-muted-foreground mb-2">O HoraMed é destinado a:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Usuários com 18 (dezoito) anos ou mais; ou</li>
                    <li>Menores de 18 anos sob responsabilidade de pais, mães ou responsáveis legais</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">1.3. Objeto do Serviço</h4>
                  <p className="text-muted-foreground mb-2">O HoraMed oferece:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Registro de medicamentos, doses, horários e rotinas</li>
                    <li>Lembretes de tomada de medicamentos</li>
                    <li>Gestão de estoque de medicamentos</li>
                    <li>Carteira de Saúde digital (receitas, exames, vacinas)</li>
                    <li>Geração de relatórios periódicos para consultas médicas</li>
                    <li>Recursos de IA para organizar dados de saúde</li>
                  </ul>
                  <p className="text-warning font-semibold mt-2">
                    ⚠️ O HoraMed não é serviço médico, não realiza diagnóstico, não prescreve ou altera tratamentos e não substitui consulta com profissionais de saúde.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">1.4. Conta e Cadastro</h4>
                  <p className="text-muted-foreground mb-2">O Usuário se compromete a:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Fornecer informações verdadeiras, completas e atualizadas</li>
                    <li>Manter a confidencialidade de suas credenciais</li>
                    <li>Notificar imediatamente em caso de suspeita de acesso indevido</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">1.5. Uso Adequado</h4>
                  <p className="text-muted-foreground mb-2">É vedado ao Usuário:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Utilizar o HoraMed para fins ilícitos ou discriminatórios</li>
                    <li>Tentar burlar medidas de segurança</li>
                    <li>Realizar engenharia reversa ou descompilar</li>
                    <li>Cadastrar dados falsos ou de terceiros sem autorização</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">1.6. Licença de Uso</h4>
                  <p className="text-muted-foreground">
                    O HoraMed é disponibilizado por meio de licença de uso <strong>limitada, pessoal, não exclusiva, intransferível e revogável</strong>, 
                    para fins estritamente pessoais e não comerciais.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">1.7. Propriedade Intelectual</h4>
                  <p className="text-muted-foreground">
                    Todos os direitos sobre a marca "HoraMed", interface, layout, conteúdos e código-fonte pertencem a Luis Eduardo Paim Longhi. 
                    O uso não autorizado é proibido e poderá ensejar medidas legais.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Medical Disclaimer */}
            <AccordionItem value="disclaimer" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <span className="font-semibold">2. Aviso Médico e Limitação de Responsabilidade</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
                  <h4 className="font-semibold mb-2 text-warning">⚠️ Natureza Informativa do HoraMed</h4>
                  <p className="text-muted-foreground mb-2">O HoraMed é uma ferramenta de apoio à organização de informações de saúde, e <strong>não substitui</strong>:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Atendimento médico presencial ou por telemedicina</li>
                    <li>Diagnóstico, prescrição ou acompanhamento por profissional habilitado</li>
                  </ul>
                  <p className="text-warning font-semibold mt-3">
                    Qualquer decisão sobre tratamentos deve ser tomada exclusivamente com seu médico.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Conteúdos e Assistente de IA</h4>
                  <p className="text-muted-foreground mb-2">Explicações e resumos exibidos no app têm caráter informativo, baseados em:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Dados inseridos pelo próprio Usuário</li>
                    <li>Documentos enviados (receitas, exames, vacinas)</li>
                    <li>Regras de negócio do sistema</li>
                  </ul>
                  <p className="text-muted-foreground mt-2 font-semibold">O HoraMed NÃO:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Garante interpretação médica exata</li>
                    <li>Fornece diagnóstico</li>
                    <li>Recomenda ajustes de posologia</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Limitação de Responsabilidade</h4>
                  <p className="text-muted-foreground">
                    O Responsável não é responsável por decisões médicas tomadas com base exclusivamente em informações do HoraMed. 
                    O app é disponibilizado "no estado em que se encontra" (as is), sem garantias de funcionamento contínuo ou livre de erros.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Subscriptions */}
            <AccordionItem value="subscriptions" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-semibold">3. Assinaturas, Cobrança e Cancelamento</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <div>
                  <h4 className="font-semibold mb-2">3.1. Planos Free e Premium</h4>
                  <p className="text-muted-foreground">O HoraMed oferece plano gratuito (Free) com funcionalidades básicas e plano Premium com recursos adicionais.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3.2. Assinaturas via Lojas</h4>
                  <p className="text-muted-foreground mb-2">A assinatura Premium é realizada por meio de:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Google Play Store (Android)</li>
                    <li>Apple App Store (iOS)</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    A cobrança, faturamento e reembolsos obedecem aos termos da respectiva loja e à legislação de defesa do consumidor.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3.3. Renovação Automática</h4>
                  <p className="text-muted-foreground">
                    O plano Premium tem renovação automática ao final de cada período. Alterações de preço serão avisadas com antecedência, 
                    permitindo cancelamento antes da renovação.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3.4. Como Cancelar</h4>
                  <p className="text-muted-foreground mb-2">Cancele a qualquer momento diretamente pela loja:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li><strong>Android:</strong> Pagamentos e assinaturas → Assinaturas</li>
                    <li><strong>iOS:</strong> Ajustes → [seu nome] → Assinaturas</li>
                  </ul>
                  <p className="text-warning font-semibold mt-2">
                    ⚠️ Desinstalar o app não cancela a assinatura!
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3.5. Período de Teste (Trial)</h4>
                  <p className="text-muted-foreground">
                    Períodos de avaliação gratuita podem ser oferecidos. Caso não cancele antes do fim, a cobrança iniciará automaticamente.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3.6. Reembolsos</h4>
                  <p className="text-muted-foreground">
                    Pedidos de reembolso devem ser feitos diretamente à loja (Google Play ou App Store), seguindo suas políticas específicas.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Privacy & LGPD */}
            <AccordionItem value="privacy" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold">4. Política de Privacidade e LGPD</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2">Controlador de Dados</h4>
                  <p className="text-muted-foreground">
                    <strong>Luis Eduardo Paim Longhi</strong>, pessoa física responsável pelo HoraMed.<br />
                    Legislação: LGPD (Lei nº 13.709/2018)
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados Coletados</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">1. Dados de cadastro:</p>
                      <p className="text-muted-foreground text-xs">Nome, e-mail, senha (protegida), idioma, fuso horário</p>
                    </div>
                    <div>
                      <p className="font-medium">2. Perfis de saúde familiares:</p>
                      <p className="text-muted-foreground text-xs">Nome do perfil, data de nascimento, relação, foto de perfil</p>
                    </div>
                    <div>
                      <p className="font-medium">3. Dados de saúde (sensíveis):</p>
                      <p className="text-muted-foreground text-xs">Medicamentos, doses, horários, documentos (receitas, exames, vacinas), estoque</p>
                    </div>
                    <div>
                      <p className="font-medium">4. Dados de uso:</p>
                      <p className="text-muted-foreground text-xs">Logs de ações, dispositivo, notificações</p>
                    </div>
                    <div>
                      <p className="font-medium">5. Dados de pagamento:</p>
                      <p className="text-muted-foreground text-xs">Status de assinatura (via lojas)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Finalidades do Tratamento</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Criar e manter sua conta</li>
                    <li>Registrar e organizar informações de saúde</li>
                    <li>Enviar lembretes e alertas</li>
                    <li>Gerar relatórios periódicos</li>
                    <li>Operar recursos de IA organizacional</li>
                    <li>Cumprir obrigações legais</li>
                    <li>Prevenir fraude e melhorar o serviço</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Bases Legais</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Execução de contrato</li>
                    <li>Cumprimento de obrigação legal</li>
                    <li>Legítimo interesse</li>
                    <li>Consentimento (especialmente para dados sensíveis)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Compartilhamento de Dados</h4>
                  <p className="text-muted-foreground mb-2">Compartilhamos dados com:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Fornecedores de infraestrutura (hospedagem, banco de dados)</li>
                    <li>Serviços de notificação (push, e-mail)</li>
                    <li>Lojas de aplicativos (validação de assinaturas)</li>
                  </ul>
                  <p className="text-primary font-semibold mt-2">
                    ✓ NÃO comercializamos seus dados com terceiros
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Seus Direitos (LGPD)</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li><strong>Confirmação:</strong> Saber se tratamos seus dados</li>
                    <li><strong>Acesso:</strong> Visualizar todos os dados coletados</li>
                    <li><strong>Correção:</strong> Atualizar dados incorretos</li>
                    <li><strong>Anonimização/Bloqueio/Eliminação:</strong> Remover dados desnecessários</li>
                    <li><strong>Portabilidade:</strong> Exportar dados em formato legível</li>
                    <li><strong>Eliminação:</strong> Deletar dados tratados com consentimento</li>
                    <li><strong>Informação:</strong> Saber com quem compartilhamos</li>
                    <li><strong>Revogação:</strong> Revogar consentimento</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    <strong>Exercer direitos:</strong> <a href="mailto:app.medhora@gmail.com" className="text-primary hover:underline">app.medhora@gmail.com</a>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Prazo de Retenção</h4>
                  <p className="text-muted-foreground">
                    Dados mantidos enquanto conta ativa ou pelo tempo necessário para cumprimento de obrigações legais.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Security */}
            <AccordionItem value="security" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <span className="font-semibold">5. Segurança da Informação</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <p className="text-muted-foreground">
                  Adotamos medidas técnicas e organizacionais para proteger dados contra acessos não autorizados, uso indevido, perda ou destruição.
                </p>
                <div>
                  <h4 className="font-semibold mb-2">Medidas de Segurança:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Criptografia de dados em trânsito (HTTPS)</li>
                    <li>Controle de acesso e autenticação</li>
                    <li>Políticas internas de segurança</li>
                    <li>Monitoramento de incidentes</li>
                  </ul>
                </div>
                <p className="text-muted-foreground">
                  Nenhum sistema é 100% seguro. Em caso de incidente relevante, notificaremos autoridades e usuários conforme exigido pela LGPD.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Cookies */}
            <AccordionItem value="cookies" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  <span className="font-semibold">6. Cookies e Rastreamento</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <p className="text-muted-foreground">
                  Na landing page e interfaces web relacionadas, utilizamos:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li><strong>Cookies essenciais:</strong> Necessários ao funcionamento básico</li>
                  <li><strong>Cookies analíticos:</strong> Para entender uso e melhorar experiência</li>
                  <li><strong>Cookies de marketing:</strong> Para campanhas e medição de resultados</li>
                </ul>
                <p className="text-muted-foreground">
                  Gerencie preferências nas configurações do navegador.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 7. User Rights */}
            <AccordionItem value="rights" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-semibold">7. Direitos do Usuário e Suporte</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <div>
                  <h4 className="font-semibold mb-2">Encerramento de Conta</h4>
                  <p className="text-muted-foreground">
                    Você pode solicitar encerramento de conta e exclusão de dados a qualquer momento, respeitadas obrigações legais de retenção.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Suspensão por Violação</h4>
                  <p className="text-muted-foreground">
                    Podemos suspender ou encerrar contas em casos de fraude, uso abusivo ou violação destes Termos.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Suporte e Contato</h4>
                  <p className="text-muted-foreground">
                    Dúvidas sobre uso, assinaturas ou privacidade:<br />
                    <a href="mailto:app.medhora@gmail.com" className="text-primary hover:underline font-semibold">app.medhora@gmail.com</a>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 8. Changes */}
            <AccordionItem value="changes" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">8. Alterações deste Documento</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm pt-4">
                <p className="text-muted-foreground">
                  Este Documento pode ser atualizado periodicamente para refletir mudanças legislativas, ajustes no aplicativo ou melhorias de clareza.
                </p>
                <p className="text-muted-foreground">
                  Alterações significativas serão comunicadas por aviso no app, e-mail ou destaque na data de atualização.
                </p>
                <p className="text-muted-foreground font-semibold">
                  O uso contínuo após alterações será interpretado como concordância com as novas condições.
                </p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Contact Card */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-3">Dados do Responsável</h3>
            <div className="space-y-2 text-sm">
              <p><strong>E-mail:</strong> <a href="mailto:contato@horamed.net" className="text-primary hover:underline">contato@horamed.net</a></p>
            </div>
          </Card>

        </div>
      </div>
      <Navigation />
    </>
  );
}
