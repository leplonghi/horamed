import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Shield,
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { DocumentoSaude } from "@/hooks/useCofre";
import { differenceInDays, format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

interface SmartDocumentInsightsProps {
  documents: DocumentoSaude[];
  onActionClick?: (action: string, documentId?: string) => void;
}

interface Insight {
  id: string;
  type: "urgent" | "warning" | "info" | "success";
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  documentId?: string;
}

export default function SmartDocumentInsights({ documents, onActionClick }: SmartDocumentInsightsProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];
    const now = new Date();
    const in7Days = addDays(now, 7);
    const in30Days = addDays(now, 30);

    // 1. Documentos expirando em 7 dias (URGENTE)
    const expiringIn7Days = documents.filter(doc => 
      doc.expires_at && 
      isAfter(new Date(doc.expires_at), now) &&
      isBefore(new Date(doc.expires_at), in7Days)
    );

    if (expiringIn7Days.length > 0) {
      const doc = expiringIn7Days[0];
      const days = differenceInDays(new Date(doc.expires_at!), now);
      result.push({
        id: "expiring-urgent",
        type: "urgent",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: language === 'pt' ? `${doc.title} expira em ${days} dias!` : `${doc.title} expires in ${days} days!`,
        description: language === 'pt' 
          ? "Providencie a renovação para evitar problemas" 
          : "Arrange renewal to avoid issues",
        action: {
          label: language === 'pt' ? "Ver documento" : "View document",
          onClick: () => onActionClick?.("view", doc.id)
        },
        documentId: doc.id
      });
    }

    // 2. Documentos pendentes de revisão
    const pendingReview = documents.filter(doc => doc.status_extraction === "pending_review");
    if (pendingReview.length > 0) {
      result.push({
        id: "pending-review",
        type: "warning",
        icon: <Clock className="h-5 w-5" />,
        title: language === 'pt' 
          ? `${pendingReview.length} documento(s) aguardando revisão` 
          : `${pendingReview.length} document(s) awaiting review`,
        description: language === 'pt' 
          ? "Confira se os dados extraídos estão corretos" 
          : "Check if the extracted data is correct",
        action: {
          label: language === 'pt' ? "Revisar agora" : "Review now",
          onClick: () => onActionClick?.("review", pendingReview[0].id)
        }
      });
    }

    // 3. Sugestão de checkup (se não tem exame há mais de 6 meses)
    const exams = documents.filter(doc => doc.categorias_saude?.slug === "exame");
    const lastExam = exams.length > 0 
      ? exams.reduce((latest, doc) => 
          new Date(doc.issued_at || doc.created_at) > new Date(latest.issued_at || latest.created_at) 
            ? doc : latest
        )
      : null;

    if (!lastExam || differenceInDays(now, new Date(lastExam.issued_at || lastExam.created_at)) > 180) {
      result.push({
        id: "checkup-suggestion",
        type: "info",
        icon: <Lightbulb className="h-5 w-5" />,
        title: language === 'pt' ? "Hora do check-up?" : "Time for a check-up?",
        description: language === 'pt' 
          ? "Faz mais de 6 meses desde seu último exame registrado" 
          : "It's been over 6 months since your last registered exam",
        action: {
          label: language === 'pt' ? "Agendar lembrete" : "Schedule reminder",
          onClick: () => onActionClick?.("schedule-checkup")
        }
      });
    }

    // 4. Carteira completa (achievement)
    const hasVaccine = documents.some(doc => doc.categorias_saude?.slug === "vacinacao");
    const hasExam = documents.some(doc => doc.categorias_saude?.slug === "exame");
    const hasPrescription = documents.some(doc => doc.categorias_saude?.slug === "receita");

    if (hasVaccine && hasExam && hasPrescription && documents.length >= 5) {
      result.push({
        id: "complete-wallet",
        type: "success",
        icon: <Shield className="h-5 w-5" />,
        title: language === 'pt' ? "Carteira de saúde completa! 🎉" : "Health wallet complete! 🎉",
        description: language === 'pt' 
          ? "Você tem todos os tipos de documentos organizados" 
          : "You have all document types organized"
      });
    }

    // 5. Documentos expirando em 30 dias
    const expiringIn30Days = documents.filter(doc => 
      doc.expires_at && 
      isAfter(new Date(doc.expires_at), in7Days) &&
      isBefore(new Date(doc.expires_at), in30Days)
    );

    if (expiringIn30Days.length > 0) {
      result.push({
        id: "expiring-soon",
        type: "warning",
        icon: <Calendar className="h-5 w-5" />,
        title: language === 'pt' 
          ? `${expiringIn30Days.length} documento(s) expiram em breve` 
          : `${expiringIn30Days.length} document(s) expiring soon`,
        description: language === 'pt' 
          ? "Planeje a renovação com antecedência" 
          : "Plan renewal in advance"
      });
    }

    return result.slice(0, 3); // Máximo 3 insights
  }, [documents, language, onActionClick]);

  if (insights.length === 0) return null;

  const getTypeStyles = (type: Insight["type"]) => {
    switch (type) {
      case "urgent":
        return "from-destructive/20 to-destructive/10 border-destructive/40 text-destructive";
      case "warning":
        return "from-warning/20 to-warning/10 border-warning/40 text-warning";
      case "success":
        return "from-success/20 to-success/10 border-success/40 text-success";
      default:
        return "from-primary/20 to-primary/10 border-primary/40 text-primary";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-semibold text-lg">
          {language === 'pt' ? 'Insights Inteligentes' : 'Smart Insights'}
        </h2>
      </div>

      <div className="grid gap-3">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              relative overflow-hidden rounded-2xl p-4 
              bg-gradient-to-r ${getTypeStyles(insight.type)}
              border backdrop-blur-sm
            `}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground leading-snug">
                  {insight.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.description}
                </p>
                {insight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 -ml-2 text-foreground hover:bg-foreground/10"
                    onClick={insight.action.onClick}
                  >
                    {insight.action.label} →
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
