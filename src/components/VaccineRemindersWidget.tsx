import { Bell, Calendar, Syringe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVaccineReminders } from "@/hooks/useVaccineReminders";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export function VaccineRemindersWidget() {
  const { activeProfile } = useUserProfiles();
  const { data: reminders, isLoading } = useVaccineReminders(activeProfile?.id);
  const { t, language } = useLanguage();
  
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const dateFormat = language === 'pt' ? "dd 'de' MMMM" : "MMMM dd";

  // Don't show anything if no active profile yet
  if (!activeProfile) {
    return null;
  }

  // Don't show skeleton if no data exists
  if (!isLoading && (!reminders || reminders.length === 0)) {
    return null;
  }

  const getDaysLabel = (daysUntil: number) => {
    if (daysUntil === 0) return t('vaccines.today');
    if (daysUntil === 1) return t('vaccines.tomorrow');
    return `${daysUntil} ${t('vaccines.days')}`;
  };

  // Only show skeleton when actively loading and profile exists
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            {t('vaccines.upcoming')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Syringe className="h-5 w-5" />
          {t('vaccines.upcoming')}
          <Badge variant="outline" className="ml-auto">
            {reminders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className={`mt-1 ${
              reminder.urgency === 'high' ? 'text-destructive' :
              reminder.urgency === 'medium' ? 'text-warning' :
              'text-primary'
            }`}>
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-tight">
                  {reminder.vaccine_name}
                </p>
                <Badge 
                  variant={
                    reminder.urgency === 'high' ? 'destructive' :
                    reminder.urgency === 'medium' ? 'secondary' :
                    'outline'
                  }
                  className="shrink-0"
                >
                  {getDaysLabel(reminder.daysUntil)}
                </Badge>
              </div>
              {reminder.dose_description && (
                <p className="text-xs text-muted-foreground">
                  {reminder.dose_description}
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(reminder.next_dose_date), dateFormat, { locale: dateLocale })}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
