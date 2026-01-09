import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle, Navigation, Pill, BarChart3, Bot, Mic } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface VoiceCommandsSheetProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const commands = {
  navigation: [
    { command: "Ir para hoje", description: "Abre a página inicial" },
    { command: "Abrir rotina", description: "Mostra seus medicamentos" },
    { command: "Ver estoque", description: "Gerencia seu estoque" },
    { command: "Abrir perfil", description: "Suas configurações" },
    { command: "Ir para carteira", description: "Seus documentos" },
  ],
  medications: [
    { command: "Adicionar [nome]", description: "Cadastra novo medicamento" },
    { command: "Tomei dose", description: "Marca dose como tomada" },
    { command: "Pular dose", description: "Pula a dose atual" },
  ],
  queries: [
    { command: "Meu progresso", description: "Veja sua evolução" },
    { command: "Buscar [termo]", description: "Pesquisa no app" },
  ],
  assistant: [
    { command: "Perguntar [questão]", description: "Fala com a Clara" },
    { command: "Ajuda com [assunto]", description: "Pede orientação" },
  ],
};

const commandsEn = {
  navigation: [
    { command: "Go to today", description: "Opens home page" },
    { command: "Open routine", description: "Shows your medications" },
    { command: "View stock", description: "Manage your stock" },
    { command: "Open profile", description: "Your settings" },
    { command: "Go to wallet", description: "Your documents" },
  ],
  medications: [
    { command: "Add [name]", description: "Register new medication" },
    { command: "Took dose", description: "Mark dose as taken" },
    { command: "Skip dose", description: "Skip current dose" },
  ],
  queries: [
    { command: "My progress", description: "See your evolution" },
    { command: "Search [term]", description: "Search in app" },
  ],
  assistant: [
    { command: "Ask [question]", description: "Talk to Clara" },
    { command: "Help with [topic]", description: "Ask for guidance" },
  ],
};

const categories = [
  { key: "navigation", icon: Navigation, label: "Navegação", labelEn: "Navigation" },
  { key: "medications", icon: Pill, label: "Medicamentos", labelEn: "Medications" },
  { key: "queries", icon: BarChart3, label: "Consultas", labelEn: "Queries" },
  { key: "assistant", icon: Bot, label: "Assistente", labelEn: "Assistant" },
];

export default function VoiceCommandsSheet({ trigger, open, onOpenChange }: VoiceCommandsSheetProps) {
  const { language } = useLanguage();
  const cmds = language === 'pt' ? commands : commandsEn;

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <HelpCircle className="h-4 w-4" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Mic className="h-5 w-5 text-primary" />
            {language === 'pt' ? 'Comandos de Voz' : 'Voice Commands'}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-4rem)] space-y-6 pb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryCommands = cmds[category.key as keyof typeof cmds];

            return (
              <div key={category.key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {language === 'pt' ? category.label : category.labelEn}
                  </h3>
                </div>
                
                <div className="space-y-2 pl-10">
                  {categoryCommands.map((cmd, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-3 py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                        "{cmd.command}"
                      </code>
                      <span className="text-sm text-muted-foreground">
                        {cmd.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mt-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">💡 {language === 'pt' ? 'Dica:' : 'Tip:'}</span>{' '}
              {language === 'pt' 
                ? 'Fale naturalmente! Você pode combinar comandos, por exemplo: "Adicionar Dipirona 500mg"'
                : 'Speak naturally! You can combine commands, for example: "Add Ibuprofen 400mg"'}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
