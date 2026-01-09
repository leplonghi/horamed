import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  FolderOpen, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  FileText,
  FlaskConical,
  Syringe,
  Stethoscope,
  TrendingUp
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DocumentoSaude } from "@/hooks/useCofre";
import { differenceInDays, addDays, isAfter, isBefore } from "date-fns";

interface DocumentStatsGridProps {
  documents: DocumentoSaude[];
  onStatClick?: (filter: string) => void;
}

export default function DocumentStatsGrid({ documents, onStatClick }: DocumentStatsGridProps) {
  const { language } = useLanguage();

  const stats = useMemo(() => {
    const now = new Date();
    const in30Days = addDays(now, 30);

    const expiringSoon = documents.filter(doc => 
      doc.expires_at && 
      isAfter(new Date(doc.expires_at), now) &&
      isBefore(new Date(doc.expires_at), in30Days)
    ).length;

    const needsReview = documents.filter(doc => doc.status_extraction === "pending_review").length;
    const reviewed = documents.filter(doc => doc.status_extraction === "reviewed").length;

    const byCategory = {
      receita: documents.filter(doc => doc.categorias_saude?.slug === "receita").length,
      exame: documents.filter(doc => doc.categorias_saude?.slug === "exame").length,
      vacinacao: documents.filter(doc => doc.categorias_saude?.slug === "vacinacao").length,
      consulta: documents.filter(doc => doc.categorias_saude?.slug === "consulta").length,
    };

    return { total: documents.length, expiringSoon, needsReview, reviewed, byCategory };
  }, [documents]);

  const mainStats = [
    {
      id: "total",
      icon: <FolderOpen className="h-5 w-5" />,
      label: language === 'pt' ? 'Total' : 'Total',
      value: stats.total,
      sublabel: language === 'pt' ? 'documentos' : 'documents',
      color: "from-primary/20 to-primary/10 border-primary/30",
      iconColor: "text-primary"
    },
    {
      id: "expiring",
      icon: <Clock className="h-5 w-5" />,
      label: language === 'pt' ? 'Expirando' : 'Expiring',
      value: stats.expiringSoon,
      sublabel: language === 'pt' ? 'em 30 dias' : 'in 30 days',
      color: stats.expiringSoon > 0 
        ? "from-destructive/20 to-destructive/10 border-destructive/30" 
        : "from-muted/50 to-muted/30 border-border/50",
      iconColor: stats.expiringSoon > 0 ? "text-destructive" : "text-muted-foreground"
    },
    {
      id: "review",
      icon: <AlertTriangle className="h-5 w-5" />,
      label: language === 'pt' ? 'Revisar' : 'Review',
      value: stats.needsReview,
      sublabel: language === 'pt' ? 'pendentes' : 'pending',
      color: stats.needsReview > 0 
        ? "from-warning/20 to-warning/10 border-warning/30" 
        : "from-muted/50 to-muted/30 border-border/50",
      iconColor: stats.needsReview > 0 ? "text-warning" : "text-muted-foreground"
    },
    {
      id: "reviewed",
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: language === 'pt' ? 'Revisados' : 'Reviewed',
      value: stats.reviewed,
      sublabel: language === 'pt' ? 'completos' : 'complete',
      color: "from-success/20 to-success/10 border-success/30",
      iconColor: "text-success"
    }
  ];

  const categoryStats = [
    {
      id: "receita",
      icon: <FileText className="h-4 w-4" />,
      label: language === 'pt' ? 'Receitas' : 'Prescriptions',
      value: stats.byCategory.receita,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/30"
    },
    {
      id: "exame",
      icon: <FlaskConical className="h-4 w-4" />,
      label: language === 'pt' ? 'Exames' : 'Exams',
      value: stats.byCategory.exame,
      color: "bg-green-500/10 text-green-500 border-green-500/30"
    },
    {
      id: "vacinacao",
      icon: <Syringe className="h-4 w-4" />,
      label: language === 'pt' ? 'Vacinas' : 'Vaccines',
      value: stats.byCategory.vacinacao,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/30"
    },
    {
      id: "consulta",
      icon: <Stethoscope className="h-4 w-4" />,
      label: language === 'pt' ? 'Consultas' : 'Consultations',
      value: stats.byCategory.consulta,
      color: "bg-orange-500/10 text-orange-500 border-orange-500/30"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {mainStats.map((stat, index) => (
          <motion.button
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStatClick?.(stat.id)}
            className={`
              relative overflow-hidden rounded-2xl p-4 text-left
              bg-gradient-to-br ${stat.color} border backdrop-blur-sm
              transition-all hover:shadow-lg
            `}
          >
            <div className={`mb-2 ${stat.iconColor}`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stat.sublabel}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categoryStats.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + (index * 0.05) }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStatClick?.(cat.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-full border
              ${cat.color} transition-all hover:shadow-md
            `}
          >
            {cat.icon}
            <span className="text-sm font-medium">{cat.value}</span>
            <span className="text-xs opacity-80">{cat.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
