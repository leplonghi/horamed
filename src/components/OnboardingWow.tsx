import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Book, FileText, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function OnboardingWow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState<"medicamento" | "suplemento">("medicamento");
  const [doseTime, setDoseTime] = useState("08:00");
  const [loading, setLoading] = useState(false);

  const handleObjectiveSelect = (value: string) => {
    setObjective(value);
    setStep(2);
  };

  const handleQuickAdd = async () => {
    if (!user || !itemName.trim()) {
      toast.error('Preencha o nome do item');
      return;
    }

    setLoading(true);

    try {
      // Create item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          name: itemName,
          category: itemType,
          is_active: true
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Create schedule
      const { error: scheduleError } = await supabase
        .from('schedules')
        .insert({
          item_id: item.id,
          freq_type: 'daily',
          times: [doseTime]
        });

      if (scheduleError) throw scheduleError;

      toast.success('Lembrete criado com sucesso!');
      setStep(3);
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Erro ao criar lembrete');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    // Mark onboarding as complete
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);
    }

    navigate('/hoje');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-background to-pink-50 dark:from-purple-950/20 dark:via-background dark:to-pink-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold">Bem-vindo ao HoraMed!</h1>
                <p className="text-muted-foreground">O que você mais quer organizar?</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleObjectiveSelect('medicamentos')}
                  variant="outline"
                  className="w-full h-auto py-4 justify-start"
                >
                  <Pill className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Tomar medicamentos no horário</div>
                    <div className="text-xs text-muted-foreground">Nunca mais esqueça uma dose</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleObjectiveSelect('suplementos')}
                  variant="outline"
                  className="w-full h-auto py-4 justify-start"
                >
                  <Book className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Organizar suplementos e vitaminas</div>
                    <div className="text-xs text-muted-foreground">Sua rotina de saúde otimizada</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleObjectiveSelect('documentos')}
                  variant="outline"
                  className="w-full h-auto py-4 justify-start"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Carteira de Saúde</div>
                    <div className="text-xs text-muted-foreground">Documentos sempre à mão</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleObjectiveSelect('tudo')}
                  variant="outline"
                  className="w-full h-auto py-4 justify-start"
                >
                  <Sparkles className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Tudo isso</div>
                    <div className="text-xs text-muted-foreground">Controle total da sua saúde</div>
                  </div>
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">Vamos criar seu primeiro lembrete</h2>
                <p className="text-sm text-muted-foreground">Leva menos de 1 minuto</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={itemType} onValueChange={(v: any) => setItemType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicamento">Medicamento</SelectItem>
                      <SelectItem value="suplemento">Suplemento/Vitamina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder={itemType === "medicamento" ? "Ex: Losartana" : "Ex: Vitamina D"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horário do primeiro lembrete</Label>
                  <Input
                    type="time"
                    value={doseTime}
                    onChange={(e) => setDoseTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={handleQuickAdd} disabled={loading || !itemName.trim()} className="flex-1">
                  Criar lembrete
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6 text-center"
            >
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="p-4 bg-green-500/10 rounded-full"
                >
                  <Check className="h-16 w-16 text-green-500" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Pronto! 🎉</h2>
                <p className="text-muted-foreground">
                  Seu lembrete foi criado. Agora o HoraMed cuida do horário por você.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4">
                <p className="text-sm">
                  💡 <strong>Próximos passos:</strong> Adicione mais itens, organize sua Carteira de Saúde e acompanhe seu progresso.
                </p>
              </div>

              <Button onClick={handleComplete} className="w-full" size="lg">
                Começar a usar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? 'w-8 bg-primary'
                  : s < step
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
