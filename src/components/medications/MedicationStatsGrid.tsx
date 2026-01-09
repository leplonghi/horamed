import { useMemo } from "react";
import { Pill, Leaf, Package, AlertTriangle } from "lucide-react";
import StatsGridBase, { StatItem } from "@/components/shared/StatsGridBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationItem {
  id: string;
  name: string;
  category: string;
  stock?: Array<{
    units_left: number;
    unit_label: string;
  }>;
}

interface MedicationStatsGridProps {
  items: MedicationItem[];
  onStatClick?: (filter: string) => void;
}

export default function MedicationStatsGrid({ 
  items, 
  onStatClick 
}: MedicationStatsGridProps) {
  const { language } = useLanguage();

  const stats = useMemo(() => {
    const medications = items.filter(i => i.category === 'medicamento');
    const supplements = items.filter(i => i.category === 'suplemento' || i.category === 'vitamina');
    const lowStock = items.filter(i => i.stock?.[0] && i.stock[0].units_left <= 5);

    const result: StatItem[] = [
      {
        id: "total",
        label: language === 'pt' ? 'Total de itens' : 'Total items',
        value: items.length,
        icon: <Pill className="h-4 w-4 text-primary" />,
        color: "bg-primary/10 text-primary",
        onClick: () => onStatClick?.("all")
      },
      {
        id: "medications",
        label: language === 'pt' ? 'Medicamentos' : 'Medications',
        value: medications.length,
        icon: <Pill className="h-4 w-4 text-blue-500" />,
        color: "bg-blue-500/10 text-blue-500",
        onClick: () => onStatClick?.("medicamento")
      },
      {
        id: "supplements",
        label: language === 'pt' ? 'Suplementos' : 'Supplements',
        value: supplements.length,
        icon: <Leaf className="h-4 w-4 text-performance" />,
        color: "bg-performance/10 text-performance",
        onClick: () => onStatClick?.("suplemento")
      },
      {
        id: "low-stock",
        label: language === 'pt' ? 'Estoque baixo' : 'Low stock',
        value: lowStock.length,
        icon: <AlertTriangle className="h-4 w-4 text-warning" />,
        color: lowStock.length > 0 ? "bg-warning/10 text-warning" : "bg-muted/50 text-muted-foreground",
        onClick: () => onStatClick?.("low-stock")
      }
    ];

    return result;
  }, [items, language, onStatClick]);

  return <StatsGridBase stats={stats} columns={4} />;
}
