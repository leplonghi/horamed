import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, isThisMonth, isThisYear, parseISO } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { FileText, FlaskConical, Syringe, Stethoscope, FolderOpen } from "lucide-react";
import { DocumentoSaude } from "@/hooks/useCofre";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface DocumentTimelineProps {
  documents: DocumentoSaude[];
  maxItems?: number;
}

interface TimelineGroup {
  label: string;
  documents: DocumentoSaude[];
}

export default function DocumentTimeline({ documents, maxItems = 10 }: DocumentTimelineProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const groupedDocuments = useMemo(() => {
    const sorted = [...documents]
      .sort((a, b) => 
        new Date(b.issued_at || b.created_at).getTime() - 
        new Date(a.issued_at || a.created_at).getTime()
      )
      .slice(0, maxItems);

    const groups: TimelineGroup[] = [];
    let currentGroup: TimelineGroup | null = null;

    sorted.forEach(doc => {
      const date = new Date(doc.issued_at || doc.created_at);
      let label: string;

      if (isThisMonth(date)) {
        label = language === 'pt' ? 'Este mês' : 'This month';
      } else if (isThisYear(date)) {
        label = format(date, 'MMMM', { locale: dateLocale });
      } else {
        label = format(date, 'MMMM yyyy', { locale: dateLocale });
      }

      if (!currentGroup || currentGroup.label !== label) {
        currentGroup = { label, documents: [] };
        groups.push(currentGroup);
      }

      currentGroup.documents.push(doc);
    });

    return groups;
  }, [documents, maxItems, dateLocale, language]);

  const getCategoryIcon = (slug?: string) => {
    switch (slug) {
      case "receita":
        return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "exame":
        return { Icon: FlaskConical, color: "text-green-500", bg: "bg-green-500/10" };
      case "vacinacao":
        return { Icon: Syringe, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "consulta":
        return { Icon: Stethoscope, color: "text-orange-500", bg: "bg-orange-500/10" };
      default:
        return { Icon: FolderOpen, color: "text-gray-500", bg: "bg-gray-500/10" };
    }
  };

  if (documents.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">
        {language === 'pt' ? 'Linha do Tempo' : 'Timeline'}
      </h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

        <div className="space-y-6">
          {groupedDocuments.map((group, groupIndex) => (
            <div key={group.label} className="relative">
              {/* Month label */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold z-10">
                  {group.documents.length}
                </div>
                <span className="font-medium text-foreground capitalize">
                  {group.label}
                </span>
              </motion.div>

              {/* Documents in this group */}
              <div className="ml-12 space-y-2">
                {group.documents.map((doc, docIndex) => {
                  const { Icon, color, bg } = getCategoryIcon(doc.categorias_saude?.slug);
                  const date = new Date(doc.issued_at || doc.created_at);

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (groupIndex * 0.1) + (docIndex * 0.05) }}
                    >
                      <Link to={`/carteira/${doc.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30 hover:border-primary/30 hover:bg-card transition-all group">
                          <div className={`p-2 rounded-lg ${bg} transition-transform group-hover:scale-110`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {doc.title || (language === 'pt' ? 'Sem título' : 'Untitled')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(date, 'dd MMM', { locale: dateLocale })}
                              {doc.provider && ` • ${doc.provider}`}
                            </p>
                          </div>
                          {doc.status_extraction === "pending_review" && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-warning/20 text-warning">
                              {language === 'pt' ? 'Revisar' : 'Review'}
                            </span>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
