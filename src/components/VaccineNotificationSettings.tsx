import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Users, Syringe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function VaccineNotificationSettings() {
  const [vaccineRemindersEnabled, setVaccineRemindersEnabled] = useState(true);
  const [caregiverRemindersEnabled, setCaregiverRemindersEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Por enquanto usando push_enabled como proxy para vacinas
        setVaccineRemindersEnabled(data.push_enabled ?? true);
        // Assumindo que email_enabled pode ser usado para cuidadores
        setCaregiverRemindersEnabled(data.email_enabled ?? true);
      }
    } catch (error) {
      console.error("Error loading vaccine notification preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (field: string, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          [field]: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success("Preferência atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating preference:", error);
      toast.error("Erro ao atualizar preferência");
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Syringe className="h-5 w-5" />
          Notificações de Vacinas
        </CardTitle>
        <CardDescription>
          Configure como você deseja receber lembretes sobre vacinas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="vaccine-reminders">Lembretes de Vacinas</Label>
                <Badge variant="secondary" className="text-xs">
                  30/15/7 dias antes
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Receba alertas antes das próximas doses de vacinas
              </p>
            </div>
            <Switch
              id="vaccine-reminders"
              checked={vaccineRemindersEnabled}
              onCheckedChange={(checked) => {
                setVaccineRemindersEnabled(checked);
                updatePreference("push_enabled", checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="caregiver-reminders">Vacinas de Dependentes</Label>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre vacinas dos perfis que você gerencia
              </p>
            </div>
            <Switch
              id="caregiver-reminders"
              checked={caregiverRemindersEnabled}
              onCheckedChange={(checked) => {
                setCaregiverRemindersEnabled(checked);
                updatePreference("email_enabled", checked);
              }}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Bell className="h-3 w-3 mt-0.5 shrink-0" />
            <p>
              Os lembretes são enviados automaticamente 30, 15 e 7 dias antes da data da próxima dose.
              Você pode desativar as notificações a qualquer momento.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
