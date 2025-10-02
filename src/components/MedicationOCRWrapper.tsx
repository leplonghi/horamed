import { useState } from "react";
import MedicationOCR from "./MedicationOCR";
import UpgradeModal from "./UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";

interface MedicationOCRWrapperProps {
  onResult: (result: { name: string; dose?: string; category?: string }) => void;
}

export default function MedicationOCRWrapper({ onResult }: MedicationOCRWrapperProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeature } = useSubscription();

  if (!hasFeature('ocr')) {
    return (
      <>
        <div className="p-6 text-center bg-muted/30 rounded-lg border-2 border-dashed border-primary/20">
          <p className="text-muted-foreground mb-4">
            OCR de receitas está disponível apenas no Plano Premium
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="text-primary underline"
          >
            Ver Planos
          </button>
        </div>
        <UpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          feature="OCR de receitas"
        />
      </>
    );
  }

  return <MedicationOCR onResult={onResult} />;
}
