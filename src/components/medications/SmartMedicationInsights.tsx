import { useMemo } from "react";
import { Pill, Leaf, AlertTriangle, TrendingUp, Package, Clock } from "lucide-react";
import SmartInsightsBase, { Insight } from "@/components/shared/SmartInsightsBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationItem {
  id: string;
  name: string;
  category: string;
  stock?: Array<{
    units_left: number;
    unit_label: string;
  }>;
  schedules: Array<{
    id: string;
    times: any;
    freq_type: string;
  }>;
}

interface SmartMedicationInsightsProps {
  items: MedicationItem[];
  onActionClick: (action: string, itemId?: string) => void;
}

export default function SmartMedicationInsights({ 
  items, 
  onActionClick 
}: SmartMedicationInsightsProps) {
  const { language } = useLanguage();

  const insights = useMemo(() => {
    const result: Insight[] = [];

    // Check for low stock items
    const lowStockItems = items.filter(item => {
      const stock = item.stock?.[0];
      return stock && stock.units_left <= 5;
    });

    if (lowStockItems.length > 0) {
      result.push({
        id: "low-stock",
        type: "warning",
        icon: <Package className="h-5 w-5 text-warning" />,
        title: language === 'pt' 
          ? `${lowStockItems.length} ${lowStockItems.length === 1 ? 'item' : 'itens'} com estoque baixo`
          : `${lowStockItems.length} ${lowStockItems.length === 1 ? 'item' : 'items'} with low stock`,
        description: language === 'pt'
          ? `Verifique: ${lowStockItems.slice(0, 2).map(i => i.name).join(", ")}${lowStockItems.length > 2 ? ` e mais ${lowStockItems.length - 2}` : ""}`
          : `Check: ${lowStockItems.slice(0, 2).map(i => i.name).join(", ")}${lowStockItems.length > 2 ? ` and ${lowStockItems.length - 2} more` : ""}`,
        action: {
          label: language === 'pt' ? 'Ver estoque' : 'View stock',
          onClick: () => onActionClick('/estoque')
        }
      });
    }

    // Check for items without schedules
    const noScheduleItems = items.filter(item => 
      !item.schedules || item.schedules.length === 0
    );

    if (noScheduleItems.length > 0) {
      result.push({
        id: "no-schedule",
        type: "info",
        icon: <Clock className="h-5 w-5 text-primary" />,
        title: language === 'pt'
          ? `${noScheduleItems.length} ${noScheduleItems.length === 1 ? 'item sem horário' : 'itens sem horários'}`
          : `${noScheduleItems.length} ${noScheduleItems.length === 1 ? 'item without schedule' : 'items without schedules'}`,
        description: language === 'pt'
          ? 'Configure horários para receber lembretes'
          : 'Set up schedules to receive reminders',
        action: {
          label: language === 'pt' ? 'Configurar' : 'Configure',
          onClick: () => onActionClick(`/adicionar?edit=${noScheduleItems[0].id}`)
        }
      });
    }

    // Success message if everything is good
    if (items.length > 0 && lowStockItems.length === 0 && noScheduleItems.length === 0) {
      result.push({
        id: "all-good",
        type: "success",
        icon: <TrendingUp className="h-5 w-5 text-success" />,
        title: language === 'pt' ? 'Tudo em ordem!' : 'All good!',
        description: language === 'pt'
          ? 'Seus medicamentos estão configurados corretamente'
          : 'Your medications are properly configured',
      });
    }

    // Count supplements
    const supplements = items.filter(i => 
      i.category === 'suplemento' || i.category === 'vitamina'
    );
    const medications = items.filter(i => i.category === 'medicamento');

    if (supplements.length > 0 && medications.length > 0) {
      result.push({
        id: "mix-info",
        type: "info",
        icon: <Leaf className="h-5 w-5 text-performance" />,
        title: language === 'pt'
          ? `${medications.length} medicamentos + ${supplements.length} suplementos`
          : `${medications.length} medications + ${supplements.length} supplements`,
        description: language === 'pt'
          ? 'Rotina completa de saúde'
          : 'Complete health routine',
      });
    }

    return result;
  }, [items, language, onActionClick]);

  return <SmartInsightsBase insights={insights} maxVisible={2} />;
}
