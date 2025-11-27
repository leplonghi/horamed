import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MedicationWizard from "./medication-wizard/MedicationWizard";

/**
 * Floating Action Button that opens the unified medication wizard
 * Replaces scattered "Add Medication" entry points
 */
export default function FloatingAddButton() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setWizardOpen(true)}
        size="lg"
        className="fixed bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl z-40 hover:scale-110 transition-transform"
      >
        <Plus className="h-8 w-8" />
      </Button>

      <MedicationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
