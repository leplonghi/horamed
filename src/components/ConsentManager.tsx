import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useConsents, ConsentPurpose } from "@/hooks/useConsents";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Shield, Bell, Share2, TrendingUp, Mail } from "lucide-react";

const consentLabels: Record<ConsentPurpose, { label: string; description: string; icon: any }> = {
  health_data: {
    label: "Dados de Saúde",
    description: "Armazenar e processar seus dados de saúde (medicamentos, exames, consultas)",
    icon: Shield,
  },
  notifications: {
    label: "Notificações",
    description: "Enviar lembretes de medicação por push, SMS e e-mail",
    icon: Bell,
  },
  data_sharing: {
    label: "Compartilhamento",
    description: "Permitir compartilhamento de documentos com profissionais de saúde",
    icon: Share2,
  },
  marketing: {
    label: "Marketing",
    description: "Receber novidades, promoções e conteúdo educativo",
    icon: Mail,
  },
  analytics: {
    label: "Análises",
    description: "Melhorar o app através de análise anônima de uso",
    icon: TrendingUp,
  },
};

export default function ConsentManager() {
  const { consents, loading, grantConsent, revokeConsent, hasConsent } = useConsents();
  const { logAction } = useAuditLog();

  const handleToggle = async (purpose: ConsentPurpose, granted: boolean) => {
    if (granted) {
      await grantConsent(purpose);
      await logAction({
        action: "grant_consent",
        resource: "consent",
        metadata: { purpose, granted: true }
      });
    } else {
      await revokeConsent(purpose);
      await logAction({
        action: "revoke_consent",
        resource: "consent",
        metadata: { purpose, granted: false }
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consentimentos</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Consentimentos</CardTitle>
        <CardDescription>
          Controle como o HoraMed usa seus dados de acordo com a LGPD
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(consentLabels).map(([purpose, { label, description, icon: Icon }]) => {
          const consentPurpose = purpose as ConsentPurpose;
          const isGranted = hasConsent(consentPurpose);
          
          return (
            <div key={purpose} className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
              <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <Label htmlFor={purpose} className="text-base font-medium cursor-pointer">
                  {label}
                </Label>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Switch
                id={purpose}
                checked={isGranted}
                onCheckedChange={(checked) => handleToggle(consentPurpose, checked)}
              />
            </div>
          );
        })}
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            Você pode revogar esses consentimentos a qualquer momento. Alguns recursos do app podem ficar limitados caso você revogue certos consentimentos essenciais.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
