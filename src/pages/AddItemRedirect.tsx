import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";

/**
 * Legacy AddItem page - now redirects to unified wizard
 * For editing, redirects to AddItem page with edit param
 */
export default function AddItemRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(true);
  
  const editId = searchParams.get("edit");

  // If editing, redirect to the proper edit page
  useEffect(() => {
    if (editId) {
      navigate(`/edit/${editId}?edit=${editId}`, { replace: true });
    }
  }, [editId, navigate]);

  // If user closes wizard, go back to Rotina
  const handleClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      navigate('/rotina');
    }
  };

  // If editing, show loading while redirecting
  if (editId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <MedicationWizard open={wizardOpen} onOpenChange={handleClose} />
    </div>
  );
}
