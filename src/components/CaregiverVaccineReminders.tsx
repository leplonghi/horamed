import { Bell, Calendar, Syringe, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCaregiverVaccineReminders } from "@/hooks/useCaregiverVaccineReminders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CaregiverVaccineReminders() {
  const { data: reminders, isLoading } = useCaregiverVaccineReminders();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vacinas dos Dependentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!reminders || reminders.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Vacinas dos Dependentes
          <Badge variant="secondary" className="ml-auto">
            {reminders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-primary/30 bg-primary/5">
          <Syringe className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Você está acompanhando as próximas doses de vacinas dos seus dependentes
          </AlertDescription>
        </Alert>

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
                <div>
                  <p className="font-medium text-sm leading-tight">
                    {reminder.vaccine_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reminder.profile_name}
                  </p>
                </div>
                <Badge 
                  variant={
                    reminder.urgency === 'high' ? 'destructive' :
                    reminder.urgency === 'medium' ? 'secondary' :
                    'outline'
                  }
                  className="shrink-0"
                >
                  {reminder.daysUntil === 0 ? 'Hoje' :
                   reminder.daysUntil === 1 ? 'Amanhã' :
                   `${reminder.daysUntil} dias`}
                </Badge>
              </div>
              {reminder.dose_description && (
                <p className="text-xs text-muted-foreground">
                  {reminder.dose_description}
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(reminder.next_dose_date), "dd 'de' MMMM", { locale: ptBR })}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
