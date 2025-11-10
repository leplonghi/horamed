import { useState } from "react";
import DocumentOCR from "./DocumentOCR";
import UpgradeModal from "./UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";

interface DocumentOCRWrapperProps {
  onResult: (result: {
    title: string;
    issued_at?: string;
    expires_at?: string;
    provider?: string;
    category?: string;
    extracted_values?: Array<{
      parameter: string;
      value: number;
      unit: string;
      reference_range?: string;
    }>;
  }) => void;
}

export default function DocumentOCRWrapper({ onResult }: DocumentOCRWrapperProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeature } = useSubscription();

  if (!hasFeature('ocr')) {
    return (
      <>
        <div className="p-6 text-center bg-muted/30 rounded-lg border-2 border-dashed border-primary/20">
          <p className="text-muted-foreground mb-4">
            OCR de documentos está disponível apenas no Plano Premium
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
          feature="OCR de documentos"
        />
      </>
    );
  }

  return <DocumentOCR onResult={onResult} />;
}
