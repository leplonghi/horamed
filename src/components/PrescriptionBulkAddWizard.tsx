import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserProfiles } from "@/hooks/useUserProfiles";

type SchedulePreset = "1x" | "2x" | "3x";

interface Medication {
  name: string;
  dose: string;
  selected: boolean;
  schedulePreset: SchedulePreset;
  withFood: boolean;
  stockTotal: string;
  enableStock: boolean;
}

const presetSchedules = {
  "1x": { label: "1x/dia (8h)", times: ["08:00"], icon: "☀️" },
  "2x": { label: "2x/dia (8h/20h)", times: ["08:00", "20:00"], icon: "🌗" },
  "3x": { label: "3x/dia (8h/14h/20h)", times: ["08:00", "14:00", "20:00"], icon: "🕐" },
};

interface Props {
  prescriptionId: string;
  medications: any[];
  open: boolean;
  onClose: () => void;
}

export function PrescriptionBulkAddWizard({ prescriptionId, medications, open, onClose }: Props) {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [meds, setMeds] = useState<Medication[]>(
    medications.map(m => ({
      name: m.commercial_name || m.drug_name || m.name || "",
      dose: m.dosage || m.dose || "1 comprimido",
      selected: true,
      schedulePreset: "2x" as SchedulePreset,
      withFood: false,
      stockTotal: "30",
      enableStock: true,
    }))
  );

  const selectedMeds = meds.filter(m => m.selected);

  const handleToggleMed = (index: number) => {
    const newMeds = [...meds];
    newMeds[index].selected = !newMeds[index].selected;
    setMeds(newMeds);
  };

  const handleScheduleChange = (index: number, preset: SchedulePreset) => {
    const newMeds = [...meds];
    newMeds[index].schedulePreset = preset;
    setMeds(newMeds);
  };

  const handleStockChange = (index: number, value: string) => {
    const newMeds = [...meds];
    newMeds[index].stockTotal = value;
    setMeds(newMeds);
  };

  const handleToggleStock = (index: number) => {
    const newMeds = [...meds];
    newMeds[index].enableStock = !newMeds[index].enableStock;
    setMeds(newMeds);
  };

  const handleToggleFood = (index: number) => {
    const newMeds = [...meds];
    newMeds[index].withFood = !newMeds[index].withFood;
    setMeds(newMeds);
  };

  const handleNext = () => {
    if (step === 1 && selectedMeds.length === 0) {
      toast.error("Selecione pelo menos 1 medicamento");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let successCount = 0;
      
      for (const med of selectedMeds) {
        try {
          // Create medication item
          const { data: item, error: itemError } = await supabase
            .from("items")
            .insert({
              user_id: user.id,
              profile_id: activeProfile?.id || null,
              name: med.name,
              dose_text: med.dose,
              with_food: med.withFood,
              category: "medicamento",
            })
            .select()
            .single();

          if (itemError) throw itemError;

          // Create schedule
          const times = presetSchedules[med.schedulePreset].times;
          const { error: scheduleError } = await supabase
            .from("schedules")
            .insert({
              item_id: item.id,
              freq_type: "daily",
              times,
            });

          if (scheduleError) throw scheduleError;

          // Create stock if enabled
          if (med.enableStock && med.stockTotal) {
            const { error: stockError } = await supabase
              .from("stock")
              .insert({
                item_id: item.id,
                units_total: parseInt(med.stockTotal),
                units_left: parseInt(med.stockTotal),
              });

            if (stockError) console.error("Stock error:", stockError);
          }

          successCount++;
        } catch (err) {
          console.error(`Error adding ${med.name}:`, err);
        }
      }

      // Mark prescription as purchased
      await supabase
        .from("documentos_saude")
        .update({ 
          meta: { 
            ...(medications as any), 
            is_purchased: true 
          } 
        })
        .eq("id", prescriptionId);

      toast.success(`✓ ${successCount} ${successCount === 1 ? 'medicamento adicionado' : 'medicamentos adicionados'}!`);
      onClose();
      navigate("/hoje");
    } catch (error) {
      console.error("Error saving medications:", error);
      toast.error("Erro ao salvar medicamentos");
    } finally {
      setLoading(false);
    }
  };

  const progressSteps = [
    { number: 1, label: "Selecionar", active: step >= 1 },
    { number: 2, label: "Horários", active: step >= 2 },
    { number: 3, label: "Estoque", active: step >= 3 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="heading-card">
            Adicionar Medicamentos da Receita
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {progressSteps.map((s, idx) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.number}
                </div>
                <span className="text-tiny mt-1">{s.label}</span>
              </div>
              {idx < progressSteps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 transition-colors ${
                    step > s.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Step 1 - Select Medications */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Quais medicamentos você quer adicionar?</CardTitle>
                <CardDescription>
                  Selecione os remédios que você vai tomar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {meds.map((med, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-all cursor-pointer hover:bg-accent ${
                      med.selected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                    onClick={() => handleToggleMed(idx)}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        med.selected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {med.selected && <Check className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{med.name}</h4>
                      <p className="text-subtitle">{med.dose}</p>
                    </div>
                  </div>
                ))}
                <p className="text-subtitle text-center pt-2">
                  {selectedMeds.length} de {meds.length} selecionados
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2 - Schedule Presets */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Quando você toma cada remédio?</CardTitle>
                <CardDescription>
                  Escolha a frequência para cada medicamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedMeds.map((med, idx) => {
                  const actualIdx = meds.findIndex(m => m === med);
                  return (
                    <div key={actualIdx} className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {med.name}
                      </h4>
                      <RadioGroup 
                        value={med.schedulePreset} 
                        onValueChange={(v) => handleScheduleChange(actualIdx, v as SchedulePreset)}
                      >
                        {Object.entries(presetSchedules).map(([key, preset]) => (
                          <div
                            key={key}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          >
                            <RadioGroupItem value={key} id={`${actualIdx}-${key}`} />
                            <Label htmlFor={`${actualIdx}-${key}`} className="flex-1 cursor-pointer">
                              <span className="mr-2">{preset.icon}</span>
                              {preset.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <Label htmlFor={`food-${actualIdx}`} className="text-sm">
                          Tomar com alimento 🍽️
                        </Label>
                        <Switch
                          id={`food-${actualIdx}`}
                          checked={med.withFood}
                          onCheckedChange={() => handleToggleFood(actualIdx)}
                        />
                      </div>
                      {idx < selectedMeds.length - 1 && <div className="border-t pt-4" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Step 3 - Stock */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Configure o controle de estoque</CardTitle>
                <CardDescription>
                  Quantas unidades você tem de cada remédio?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedMeds.map((med, idx) => {
                  const actualIdx = meds.findIndex(m => m === med);
                  return (
                    <div key={actualIdx} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{med.name}</h4>
                          <p className="text-subtitle">{med.dose}</p>
                        </div>
                        <Switch
                          checked={med.enableStock}
                          onCheckedChange={() => handleToggleStock(actualIdx)}
                        />
                      </div>
                      {med.enableStock && (
                        <div className="space-y-2">
                          <Label htmlFor={`stock-${actualIdx}`}>
                            Quantidade total (comprimidos, cápsulas, etc)
                          </Label>
                          <Input
                            id={`stock-${actualIdx}`}
                            type="number"
                            placeholder="Ex: 30"
                            value={med.stockTotal}
                            onChange={(e) => handleStockChange(actualIdx, e.target.value)}
                          />
                          <p className="text-tiny">
                            💡 Você será avisado quando o estoque estiver acabando
                          </p>
                        </div>
                      )}
                      {idx < selectedMeds.length - 1 && <div className="border-t pt-4" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {step < 3 && (
              <Button onClick={handleNext} className="flex-1">
                Continuar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? "Adicionando..." : `Adicionar ${selectedMeds.length} ${selectedMeds.length === 1 ? 'Remédio' : 'Remédios'} ✓`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
