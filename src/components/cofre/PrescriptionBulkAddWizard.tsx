import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Pill, AlertCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMedicationLimits } from "@/hooks/useMedicationLimits";
import PaywallDialog from "@/components/PaywallDialog";

interface ExtractedMedication {
  drug_name: string;
  dose?: string;
  frequency?: string;
  duration_days?: number;
}

interface PrescriptionBulkAddWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: ExtractedMedication[];
  prescriptionId?: string;
  onComplete?: () => void;
}

export default function PrescriptionBulkAddWizard({
  open,
  onOpenChange,
  medications,
  prescriptionId,
  onComplete,
}: PrescriptionBulkAddWizardProps) {
  const [selectedMeds, setSelectedMeds] = useState<Set<number>>(
    new Set(medications.map((_, idx) => idx))
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const navigate = useNavigate();
  const { canAddMedication, remaining, isPremium } = useMedicationLimits();

  const toggleMed = (idx: number) => {
    const newSet = new Set(selectedMeds);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setSelectedMeds(newSet);
  };

  const handleAddSelected = () => {
    const selectedCount = selectedMeds.size;

    // Check limits for Free users
    if (!isPremium && selectedCount > remaining) {
      setShowPaywall(true);
      return;
    }

    if (selectedMeds.size === 0) {
      toast.error("Selecione pelo menos um medicamento");
      return;
    }

    // Navigate to wizard with pre-filled data for first medication
    const firstIdx = Array.from(selectedMeds)[0];
    const firstMed = medications[firstIdx];

    navigate("/adicionar", {
      state: {
        prefillData: {
          name: firstMed.drug_name,
          dose_text: firstMed.dose,
          notes: firstMed.frequency ? `Frequência: ${firstMed.frequency}` : undefined,
          category: "medicamento",
          prescriptionId,
        },
        remainingMedications: Array.from(selectedMeds)
          .slice(1)
          .map((idx) => medications[idx]),
      },
    });

    toast.success("Abrindo cadastro de medicamentos...");
    onOpenChange(false);
    if (onComplete) onComplete();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Medicamentos Extraídos da Receita
            </DialogTitle>
            <DialogDescription>
              Selecione os medicamentos que deseja adicionar à sua rotina
            </DialogDescription>
          </DialogHeader>

          {!isPremium && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Plano Gratuito: você pode adicionar {remaining} medicamento(s) ativo(s)
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Selecionados: {selectedMeds.size} | Disponíveis: {remaining}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {medications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum medicamento foi detectado nesta receita
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tente fotografar a receita novamente ou cadastre manualmente
                  </p>
                </CardContent>
              </Card>
            ) : (
              medications.map((med, idx) => {
                const isSelected = selectedMeds.has(idx);

                return (
                  <Card
                    key={idx}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => toggleMed(idx)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMed(idx)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            💊 {med.drug_name}
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {med.dose && (
                              <Badge variant="secondary" className="text-xs">
                                Dose: {med.dose}
                              </Badge>
                            )}
                            {med.frequency && (
                              <Badge variant="secondary" className="text-xs">
                                {med.frequency}
                              </Badge>
                            )}
                            {med.duration_days && (
                              <Badge variant="secondary" className="text-xs">
                                {med.duration_days} dias
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedMeds.size === 0}
              className="flex-1"
            >
              {selectedMeds.size === 0
                ? "Selecione medicamentos"
                : `Adicionar ${selectedMeds.size} medicamento(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaywallDialog
        open={showPaywall}
        onOpenChange={setShowPaywall}
        feature="active_items"
      />
    </>
  );
}
