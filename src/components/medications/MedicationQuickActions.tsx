import { Plus, Camera, Package, Calendar, Pill, FileText } from "lucide-react";
import QuickActionsBase, { QuickAction } from "@/components/shared/QuickActionsBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationQuickActionsProps {
  onAddMedication: () => void;
  onScanPrescription: () => void;
  onViewStock: () => void;
  onViewSchedule: () => void;
}

export default function MedicationQuickActions({
  onAddMedication,
  onScanPrescription,
  onViewStock,
  onViewSchedule
}: MedicationQuickActionsProps) {
  const { language } = useLanguage();

  const actions: QuickAction[] = [
    {
      id: "add",
      icon: <Plus className="h-5 w-5 text-primary" />,
      label: language === 'pt' ? 'Adicionar' : 'Add',
      color: "bg-primary/10",
      onClick: onAddMedication
    },
    {
      id: "scan",
      icon: <Camera className="h-5 w-5 text-purple-500" />,
      label: language === 'pt' ? 'Escanear Receita' : 'Scan Prescription',
      color: "bg-purple-500/10",
      onClick: onScanPrescription
    },
    {
      id: "stock",
      icon: <Package className="h-5 w-5 text-warning" />,
      label: language === 'pt' ? 'Estoque' : 'Stock',
      color: "bg-warning/10",
      onClick: onViewStock
    },
    {
      id: "schedule",
      icon: <Calendar className="h-5 w-5 text-success" />,
      label: language === 'pt' ? 'Agenda' : 'Schedule',
      color: "bg-success/10",
      onClick: onViewSchedule
    }
  ];

  return <QuickActionsBase actions={actions} columns={4} />;
}
