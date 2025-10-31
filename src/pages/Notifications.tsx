import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

export default function Notifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    push_enabled: true,
    whatsapp_enabled: false,
    whatsapp_number: "",
    whatsapp_instance_id: "",
    whatsapp_api_token: "",
  });
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          email_enabled: data.email_enabled,
          push_enabled: data.push_enabled,
          whatsapp_enabled: data.whatsapp_enabled || false,
          whatsapp_number: data.whatsapp_number || "",
          whatsapp_instance_id: data.whatsapp_instance_id || "",
          whatsapp_api_token: data.whatsapp_api_token || "",
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!preferences.whatsapp_number || !preferences.whatsapp_instance_id || !preferences.whatsapp_api_token) {
      toast.error("Preencha todos os campos do WhatsApp");
      return;
    }

    try {
      setTestingWhatsApp(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-reminder', {
        body: {
          phoneNumber: preferences.whatsapp_number,
          message: "🧪 Teste do HoraMend!\n\nSe você recebeu esta mensagem, suas notificações por WhatsApp estão configuradas corretamente! ✅",
          instanceId: preferences.whatsapp_instance_id,
          apiToken: preferences.whatsapp_api_token,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      toast.success("Mensagem de teste enviada! Verifique seu WhatsApp.");
    } catch (error) {
      console.error("Error testing WhatsApp:", error);
      toast.error("Erro ao enviar teste. Verifique suas credenciais.");
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;
      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
              <p className="text-muted-foreground">Gerencie como deseja receber lembretes</p>
            </div>
          </div>

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email">E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por e-mail
                </p>
              </div>
              <Switch
                id="email"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações no navegador
                </p>
              </div>
              <Switch
                id="push"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, push_enabled: checked })
                }
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="whatsapp">WhatsApp (Backup)</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber lembretes via WhatsApp se push falhar
                  </p>
                </div>
                <Switch
                  id="whatsapp"
                  checked={preferences.whatsapp_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, whatsapp_enabled: checked })
                  }
                />
              </div>

              {preferences.whatsapp_enabled && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                    <input
                      id="whatsapp_number"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 border rounded-md"
                      value={preferences.whatsapp_number}
                      onChange={(e) =>
                        setPreferences({ ...preferences, whatsapp_number: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instance_id">Green API Instance ID</Label>
                    <input
                      id="instance_id"
                      type="text"
                      placeholder="1234567890"
                      className="w-full px-3 py-2 border rounded-md"
                      value={preferences.whatsapp_instance_id}
                      onChange={(e) =>
                        setPreferences({ ...preferences, whatsapp_instance_id: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_token">Green API Token</Label>
                    <input
                      id="api_token"
                      type="password"
                      placeholder="abc123xyz..."
                      className="w-full px-3 py-2 border rounded-md"
                      value={preferences.whatsapp_api_token}
                      onChange={(e) =>
                        setPreferences({ ...preferences, whatsapp_api_token: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWhatsApp}
                    disabled={testingWhatsApp}
                    className="w-full"
                  >
                    {testingWhatsApp ? "Enviando..." : "Enviar Teste"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    💡 Crie uma conta gratuita em{" "}
                    <a
                      href="https://green-api.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      green-api.com
                    </a>
                    {" "}para obter suas credenciais
                  </p>
                </div>
              )}
            </div>

          </Card>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Salvando..." : "Salvar preferências"}
          </Button>
        </div>
      </div>
      <Navigation />
    </>
  );
}
