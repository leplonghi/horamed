import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Calendar, MapPin, Syringe, FileText, Trash2, Edit } from "lucide-react";
import { VaccinationRecord } from "@/hooks/useVaccinationRecords";
import { useLanguage } from "@/contexts/LanguageContext";

interface VaccineCardProps {
  record: VaccinationRecord;
  onEdit?: (record: VaccinationRecord) => void;
  onDelete?: (id: string) => void;
}

export default function VaccineCard({ record, onEdit, onDelete }: VaccineCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const isAdult = record.vaccine_type === 'adulto';
  
  return (
    <Card className={`${isAdult ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-pink-500'} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Syringe className={`h-4 w-4 ${isAdult ? 'text-blue-600' : 'text-pink-600'}`} />
              <h3 className="font-semibold text-lg">{record.vaccine_name}</h3>
            </div>
            {record.disease_prevention && (
              <p className="text-sm text-muted-foreground">
                {t('vaccines.prevents')}: {record.disease_prevention}
              </p>
            )}
          </div>
          <Badge variant={isAdult ? "default" : "secondary"}>
            {isAdult ? t('vaccines.adult') : t('vaccines.child')}
          </Badge>
        </div>

        {record.dose_description && (
          <div className="mb-3">
            <Badge variant="outline">{record.dose_description}</Badge>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t('vaccines.appliedOn')}: {format(new Date(record.application_date), "dd/MM/yyyy", { locale: dateLocale })}</span>
          </div>

          {record.next_dose_date && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <Calendar className="h-4 w-4" />
              <span>{t('vaccines.nextDose')}: {format(new Date(record.next_dose_date), "dd/MM/yyyy", { locale: dateLocale })}</span>
            </div>
          )}

          {record.vaccination_location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{record.vaccination_location}</span>
            </div>
          )}

          {record.vaccinator_name && (
            <div className="text-muted-foreground">
              <span className="font-medium">{t('vaccines.vaccinator')}:</span> {record.vaccinator_name}
            </div>
          )}

          {(record.batch_number || record.manufacturer) && (
            <div className="pt-2 border-t">
              {record.batch_number && (
                <p className="text-xs text-muted-foreground">{t('vaccines.batch')}: {record.batch_number}</p>
              )}
              {record.manufacturer && (
                <p className="text-xs text-muted-foreground">{t('vaccines.manufacturer')}: {record.manufacturer}</p>
              )}
            </div>
          )}

          {record.notes && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">{record.notes}</p>
              </div>
            </div>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(record)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                {t('common.edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(record.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {record.official_source && record.official_source !== 'Manual' && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="outline" className="text-xs">
              {t('vaccines.source')}: {record.official_source}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}