import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pill } from "lucide-react";
import { PrescriptionBulkAddWizard } from "@/components/PrescriptionBulkAddWizard";

interface MedicationQuickAddCardProps {
  prescriptionId?: string;
  medications?: any[];
}

export function MedicationQuickAddCard({ prescriptionId, medications }: MedicationQuickAddCardProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  if (!medications || medications.length === 0) return null;

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
                {medications.length} {medications.length === 1 ? 'remédio' : 'remédios'} da sua receita. 
                Configure horários e controle de estoque em poucos passos.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {medications.slice(0, 3).map((med, index) => (
                <div 
                  key={index}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  {med.commercial_name || med.drug_name || med.name}
                </div>
              ))}
              {medications.length > 3 && (
                <div className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  +{medications.length - 3} mais
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

      {prescriptionId && medications && (
        <PrescriptionBulkAddWizard
          prescriptionId={prescriptionId}
          medications={medications}
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </Card>
  );
}
