import { motion } from "framer-motion";
import { 
  Camera, 
  Upload, 
  FileText, 
  Syringe, 
  FlaskConical,
  Stethoscope,
  Scan,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}

interface DocumentQuickActionsProps {
  onScanDocument: () => void;
  onUploadFile: () => void;
  onAddPrescription: () => void;
  onAddVaccine: () => void;
  onAddExam: () => void;
}

export default function DocumentQuickActions({
  onScanDocument,
  onUploadFile,
  onAddPrescription,
  onAddVaccine,
  onAddExam
}: DocumentQuickActionsProps) {
  const { t, language } = useLanguage();

  const quickActions: QuickAction[] = [
    {
      id: "scan",
      icon: <Camera className="h-6 w-6" />,
      label: language === 'pt' ? "Escanear" : "Scan",
      description: language === 'pt' ? "Fotografe o documento" : "Photo document",
      color: "from-blue-500 to-blue-600",
      onClick: onScanDocument
    },
    {
      id: "upload",
      icon: <Upload className="h-6 w-6" />,
      label: language === 'pt' ? "Upload" : "Upload",
      description: language === 'pt' ? "PDF ou imagem" : "PDF or image",
      color: "from-purple-500 to-purple-600",
      onClick: onUploadFile
    },
    {
      id: "prescription",
      icon: <FileText className="h-6 w-6" />,
      label: language === 'pt' ? "Receita" : "Prescription",
      description: language === 'pt' ? "Adicionar receita" : "Add prescription",
      color: "from-emerald-500 to-emerald-600",
      onClick: onAddPrescription
    },
    {
      id: "vaccine",
      icon: <Syringe className="h-6 w-6" />,
      label: language === 'pt' ? "Vacina" : "Vaccine",
      description: language === 'pt' ? "Registrar vacina" : "Register vaccine",
      color: "from-amber-500 to-amber-600",
      onClick: onAddVaccine
    }
  ];

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">
        {language === 'pt' ? 'Ações Rápidas' : 'Quick Actions'}
      </h2>

      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all group"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white transition-transform group-hover:scale-110`}>
              {action.icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
