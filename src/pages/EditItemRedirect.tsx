import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";

/**
 * Opens the unified MedicationWizard for editing an existing medication.
 * Uses the same wizard as AddItemRedirect for consistency.
 */
export default function EditItemRedirect() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [wizardOpen, setWizardOpen] = useState(true);

  const handleOpenChange = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      // Navigate back when wizard closes
      navigate(-1);
    }
  };

  if (!id) {
    navigate(-1);
    return null;
  }

  return (
    <MedicationWizard 
      open={wizardOpen} 
      onOpenChange={handleOpenChange}
      editItemId={id}
    />
  );
}
