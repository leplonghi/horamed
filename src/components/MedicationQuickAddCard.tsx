import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pill, CheckCircle2 } from "lucide-react";
import { PrescriptionBulkAddWizard } from "@/components/PrescriptionBulkAddWizard";

interface MedicationQuickAddCardProps {
  prescriptionId?: string;
  medications?: any[];
  existingMedications?: string[];
}

export function MedicationQuickAddCard({ prescriptionId, medications, existingMedications = [] }: MedicationQuickAddCardProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  // Filtrar medicamentos que ainda não foram adicionados
  const pendingMedications = useMemo(() => {
    if (!medications || !existingMedications) return medications || [];
    
    return medications.filter(med => {
      const medName = (med.commercial_name || med.drug_name || med.name || '').toLowerCase().trim();
      return !existingMedications.some((existingName: string) => 
        existingName === medName || 
        existingName.includes(medName) ||
        medName.includes(existingName)
      );
    });
  }, [medications, existingMedications]);

  const addedCount = medications ? medications.length - pendingMedications.length : 0;

  if (!medications || medications.length === 0) return null;
  
  // Se todos foram adicionados, mostrar card de sucesso
  if (pendingMedications.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-background border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="heading-card text-lg mb-1">
                ✅ Todos os remédios já foram adicionados
              </h3>
              <p className="text-subtitle">
                Os {medications.length} {medications.length === 1 ? 'medicamento' : 'medicamentos'} desta receita já estão na sua rotina.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Pill className="h-7 w-7 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="heading-card text-lg mb-2">
                💊 Adicionar remédios ao tratamento
              </h3>
              <p className="text-subtitle leading-relaxed">
                {pendingMedications.length} {pendingMedications.length === 1 ? 'remédio' : 'remédios'} {addedCount > 0 && `(${addedCount} já ${addedCount === 1 ? 'adicionado' : 'adicionados'})`}. 
                Configure horários e controle de estoque em poucos passos.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {pendingMedications.slice(0, 3).map((med, index) => (
                <div 
                  key={index}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  {med.commercial_name || med.drug_name || med.name}
                </div>
              ))}
              {pendingMedications.length > 3 && (
                <div className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  +{pendingMedications.length - 3} mais
                </div>
              )}
            </div>

            <Button 
              size="lg" 
              className="w-full sm:w-auto gap-2 text-base"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Adicionar Agora
            </Button>
          </div>
        </div>

      </CardContent>

      {prescriptionId && pendingMedications && (
        <PrescriptionBulkAddWizard
          prescriptionId={prescriptionId}
          medications={pendingMedications}
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </Card>
  );
}
