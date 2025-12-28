import { AlertTriangle, Calendar, FileText, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExpiredPrescriptions } from "@/hooks/usePrescriptionControl";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function ExpiredPrescriptionsAlert() {
  const { activeProfile } = useUserProfiles();
  const { data: expiredPrescriptions, isLoading } = useExpiredPrescriptions(activeProfile?.id);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  if (isLoading || !expiredPrescriptions || expiredPrescriptions.length === 0) {
    return null;
  }

  const visiblePrescriptions = expiredPrescriptions.filter(p => !dismissed.includes(p.id));

  if (visiblePrescriptions.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {t('expiredPrescriptions.title')}
          <Badge variant="destructive" className="ml-auto">
            {visiblePrescriptions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-destructive/30 bg-background">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm">
            {t('expiredPrescriptions.description')}
          </AlertDescription>
        </Alert>

        {visiblePrescriptions.map((prescription) => (
          <div
            key={prescription.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-background"
          >
            <FileText className="h-4 w-4 text-destructive mt-1 shrink-0" />
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-tight">
                  {prescription.title}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => setDismissed([...dismissed, prescription.id])}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {prescription.medications.slice(0, 2).map((med: any, idx: number) => (
                  <p key={idx} className="text-xs text-muted-foreground">
                    • {med.name}
                  </p>
                ))}
                {prescription.medications.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    {t('expiredPrescriptions.andMore', { count: String(prescription.medications.length - 2) })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <Calendar className="h-3 w-3" />
                  {t('expiredPrescriptions.expiredAgo', { 
                    days: String(prescription.daysExpired),
                    daysLabel: prescription.daysExpired === 1 ? t('expiredPrescriptions.day') : t('expiredPrescriptions.days')
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/carteira")}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            {t('expiredPrescriptions.viewInWallet')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              navigate("/consultas");
            }}
            className="flex-1"
          >
            {t('expiredPrescriptions.scheduleAppointment')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}