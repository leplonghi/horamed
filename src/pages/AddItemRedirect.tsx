import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";

/**
 * Legacy AddItem page - now redirects to unified wizard
 * Kept for backward compatibility with existing routes
 */
export default function AddItemRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(true);

  // If user closes wizard, go back to Rotina
  const handleClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      navigate('/rotina');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <MedicationWizard open={wizardOpen} onOpenChange={handleClose} />
    </div>
  );
}
