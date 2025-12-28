import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pill, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationSummaryCardProps {
  medication: {
    id: string;
    name: string;
    doses: Array<{
      id: string;
      due_at: string;
      status: 'scheduled' | 'taken' | 'missed' | 'skipped';
    }>;
  };
  className?: string;
}

export default function MedicationSummaryCard({ medication, className }: MedicationSummaryCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  
  const takenCount = medication.doses.filter(d => d.status === 'taken').length;
  const totalCount = medication.doses.length;
  const progress = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;
  
  const nextDose = medication.doses
    .filter(d => d.status === 'scheduled' && new Date(d.due_at) > new Date())
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())[0];

  return (
    <Link to={`/medicamentos/${medication.id}/historico`}>
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer",
        className
      )}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {medication.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {takenCount} {t('medSummary.doses', { total: String(totalCount) })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>

            <Progress value={progress} className="h-2" />

            {nextDose && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Clock className="h-4 w-4" />
                <span>
                  {t('medSummary.next')}: {format(new Date(nextDose.due_at), "HH:mm", { locale: dateLocale })}
                </span>
              </div>
            )}

            {progress === 100 && totalCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-success pt-2 border-t">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">{t('medSummary.allTaken')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}