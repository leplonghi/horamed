import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, Trash2, Download } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";

export default function Privacy() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const { logAction } = useAuditLog();

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await logAction({
        action: "delete_account",
        resource: "user",
        resource_id: user.id,
        metadata: { email: user.email }
      });

      await supabase.from("dose_instances").delete().match({ item_id: user.id });
      await supabase.from("schedules").delete().match({ item_id: user.id });
      await supabase.from("stock").delete().match({ item_id: user.id });
      
      await supabase.from("compartilhamentos_doc").delete().eq("user_id", user.id);
      await supabase.from("eventos_saude").delete().eq("user_id", user.id);
      await supabase.from("documentos_saude").delete().eq("user_id", user.id);
      
      await supabase.from("user_profiles").delete().eq("user_id", user.id);
      await supabase.from("health_history").delete().eq("user_id", user.id);
      await supabase.from("health_insights").delete().eq("user_id", user.id);
      
      await supabase.from("items").delete().eq("user_id", user.id);
      await supabase.from("medical_exams").delete().eq("user_id", user.id);
      await supabase.from("notification_preferences").delete().eq("user_id", user.id);
      await supabase.from("subscriptions").delete().eq("user_id", user.id);
      await supabase.from("consents").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      
      await signOut();
      localStorage.removeItem("biometric_refresh_token");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast.success(t('privacy.deleteSuccess'));
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t('privacy.deleteError'));
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
                {t('privacy.title')}
              </h2>
              <p className="text-muted-foreground">{t('privacy.subtitle')}</p>
            </div>
          </div>

          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.lgpdTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('privacy.lgpdDesc')}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground mb-2">🛡️ {t('privacy.dataProtection')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li>{t('privacy.dataEncrypted')}</li>
                  <li>{t('privacy.httpsEncryption')}</li>
                  <li>{t('privacy.accessControl')}</li>
                  <li>{t('privacy.noDataSale')}</li>
                  <li>{t('privacy.limitedSharing')}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">📋 {t('privacy.dataCollected')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li><strong>{t('privacy.registration')}:</strong> {t('privacy.registrationData')}</li>
                  <li><strong>{t('privacy.familyProfiles')}:</strong> {t('privacy.familyProfilesData')}</li>
                  <li><strong>{t('privacy.healthSensitive')}:</strong> {t('privacy.healthData')}</li>
                  <li><strong>{t('privacy.usage')}:</strong> {t('privacy.usageData')}</li>
                  <li><strong>{t('privacy.subscription')}:</strong> {t('privacy.subscriptionData')}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">✅ {t('privacy.lgpdRights')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li><strong>{t('privacy.access')}:</strong> {t('privacy.accessDesc')}</li>
                  <li><strong>{t('privacy.correction')}:</strong> {t('privacy.correctionDesc')}</li>
                  <li><strong>{t('privacy.portability')}:</strong> {t('privacy.portabilityDesc')}</li>
                  <li><strong>{t('privacy.elimination')}:</strong> {t('privacy.eliminationDesc')}</li>
                  <li><strong>{t('privacy.revocation')}:</strong> {t('privacy.revocationDesc')}</li>
                </ul>
              </div>

              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold text-foreground mb-2">📄 {t('privacy.legalDocument')}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('privacy.legalDocumentDesc')}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate("/termos")}
                >
                  {t('privacy.viewLegalDocument')}
                </Button>
              </div>
            </div>
          </Card>

          <ConsentManager />

          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.manageData')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('privacy.manageDataDesc')}
              </p>
              
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/exportar')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('privacy.exportMyData')}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 ml-1">
                  {t('privacy.downloadAllData')}
                </p>
              </CardContent>
            </div>
          </Card>

          <Card className="p-6 space-y-4 border-destructive/50">
            <div>
              <h3 className="font-semibold text-destructive mb-2">{t('privacy.dangerZone')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('privacy.dangerZoneDesc')}
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('privacy.deleteAccount')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('privacy.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('privacy.deleteConfirmDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('privacy.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {loading ? t('privacy.deleting') : t('privacy.confirmDelete')}
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