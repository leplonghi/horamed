import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navigation from "@/components/Navigation";
import ConsentManager from "@/components/ConsentManager";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from "@/contexts/AuthContext";

export default function Privacy() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const { logAction } = useAuditLog();

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log account deletion attempt
      await logAction({
        action: "delete_account",
        resource: "user",
        resource_id: user.id,
        metadata: { email: user.email }
      });

      // Delete all user data in correct order (respecting foreign keys)
      // First delete dependent records
      await supabase.from("dose_instances").delete().match({ item_id: user.id });
      await supabase.from("schedules").delete().match({ item_id: user.id });
      await supabase.from("stock").delete().match({ item_id: user.id });
      
      // Delete health vault data
      await supabase.from("compartilhamentos_doc").delete().eq("user_id", user.id);
      await supabase.from("eventos_saude").delete().eq("user_id", user.id);
      await supabase.from("documentos_saude").delete().eq("user_id", user.id);
      
      // Delete profiles and health data
      await supabase.from("user_profiles").delete().eq("user_id", user.id);
      await supabase.from("health_history").delete().eq("user_id", user.id);
      await supabase.from("health_insights").delete().eq("user_id", user.id);
      
      // Then delete main records
      await supabase.from("items").delete().eq("user_id", user.id);
      await supabase.from("medical_exams").delete().eq("user_id", user.id);
      await supabase.from("notification_preferences").delete().eq("user_id", user.id);
      await supabase.from("subscriptions").delete().eq("user_id", user.id);
      await supabase.from("consents").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      
      // Sign out and clear all data
      await signOut();
      localStorage.removeItem("biometric_refresh_token");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast.success("Conta deletada com sucesso");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Erro ao deletar conta");
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
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Privacidade e Segurança
              </h2>
              <p className="text-muted-foreground">Gerencie seus dados e privacidade</p>
            </div>
          </div>

          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Privacidade e LGPD</h3>
              <p className="text-sm text-muted-foreground">
                O HoraMed está em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
                Todos os seus dados são armazenados de forma segura e criptografada.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground mb-2">🛡️ Proteção de Dados</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li>Dados médicos criptografados</li>
                  <li>Criptografia HTTPS em trânsito</li>
                  <li>Controle de acesso e autenticação</li>
                  <li>Nunca comercializamos seus dados</li>
                  <li>Compartilhamento limitado ao necessário</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">📋 Dados Coletados</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li><strong>Cadastro:</strong> Nome, e-mail, senha protegida</li>
                  <li><strong>Perfis familiares:</strong> Nome, data de nascimento, relação</li>
                  <li><strong>Saúde (sensíveis):</strong> Medicamentos, doses, documentos</li>
                  <li><strong>Uso:</strong> Logs de ações, dispositivo, notificações</li>
                  <li><strong>Assinatura:</strong> Status via lojas (não dados de cartão)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">✅ Seus Direitos LGPD</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li><strong>Acesso:</strong> Ver todos os dados coletados</li>
                  <li><strong>Correção:</strong> Atualizar dados incorretos</li>
                  <li><strong>Portabilidade:</strong> Exportar em formato legível</li>
                  <li><strong>Eliminação:</strong> Deletar permanentemente</li>
                  <li><strong>Revogação:</strong> Cancelar consentimentos</li>
                </ul>
              </div>

              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold text-foreground mb-2">📄 Documento Legal Completo</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Para informações detalhadas sobre Termos de Uso, Assinaturas, Cookies e Segurança, consulte o documento legal completo.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate("/termos")}
                >
                  Ver Documento Legal Completo
                </Button>
              </div>
            </div>
          </Card>

          <ConsentManager />

          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Gerenciar Dados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você tem controle total sobre seus dados pessoais e de saúde.
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/perfil")}
                >
                  Exportar meus dados
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 border-destructive/50">
            <div>
              <h3 className="font-semibold text-destructive mb-2">Zona de Perigo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ações irreversíveis que afetarão permanentemente sua conta.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar minha conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá deletar permanentemente sua conta
                      e remover todos os seus dados dos nossos servidores.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {loading ? "Deletando..." : "Sim, deletar conta"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}
