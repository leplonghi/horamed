import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface VaccineReviewScreenProps {
  documentId: string;
  extractedData: any;
  onComplete: () => void;
}

export default function VaccineReviewScreen({ documentId, extractedData, onComplete }: VaccineReviewScreenProps) {
  const [vaccineName, setVaccineName] = useState(extractedData.vaccine_name || "");
  const [doseNumber, setDoseNumber] = useState(extractedData.dose_number || "");
  const [applicationDate, setApplicationDate] = useState(extractedData.issued_at || new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState(extractedData.provider || "");
  const [professional, setProfessional] = useState(extractedData.doctor_name || "");
  const [processing, setProcessing] = useState(false);

  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const handleSave = async () => {
    if (!vaccineName) {
      toast.error(t('vaccine.nameRequired'));
      return;
    }

    setProcessing(true);
    toast.loading(t('vaccine.saving'), { id: "save-vaccine" });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.notAuthenticated'));

      // Update document
      await supabase
        .from('documentos_saude')
        .update({
          status_extraction: 'reviewed',
          meta: {
            ...extractedData,
            vaccine_name: vaccineName,
            dose_number: doseNumber,
            provider: location,
            doctor_name: professional,
          }
        })
        .eq('id', documentId);

      // Create vaccination record
      await supabase
        .from('vaccination_records')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id,
          document_id: documentId,
          vaccine_name: vaccineName,
          dose_number: doseNumber ? parseInt(doseNumber) : null,
          application_date: applicationDate,
          vaccination_location: location || null,
          vaccinator_name: professional || null,
        });

      toast.dismiss("save-vaccine");
      toast.success(t('vaccine.savedSuccess'));

      navigate("/carteira-vacina");

    } catch (error: any) {
      console.error('Error saving vaccine:', error);
      toast.dismiss("save-vaccine");
      toast.error(t('vaccine.saveError'));
    } finally {
      setProcessing(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (language === 'pt') {
      return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    return format(new Date(dateStr), "MMMM d, yyyy", { locale: enUS });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-page">{t('vaccine.reviewTitle')}</h1>
          <p className="text-description">
            {t('vaccine.reviewDesc')}
          </p>
        </div>

        {/* Document Info */}
        {(extractedData.provider || extractedData.issued_at) && (
          <Card>
            <CardContent className="p-4 space-y-2">
              {extractedData.provider && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">🏥</span>
                  <span className="text-sm">{extractedData.provider}</span>
                </div>
              )}
              {extractedData.issued_at && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">📅</span>
                  <span className="text-sm">
                    {formatDateDisplay(extractedData.issued_at)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('vaccine.info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('vaccine.name')} *</Label>
              <Input
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
                placeholder={t('vaccine.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('vaccine.dose')}</Label>
              <Input
                value={doseNumber}
                onChange={(e) => setDoseNumber(e.target.value)}
                placeholder={t('vaccine.dosePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('vaccine.applicationDate')}</Label>
              <Input
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('vaccine.location')} ({t('wizard.optional')})</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('vaccine.locationPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('vaccine.professional')} ({t('wizard.optional')})</Label>
              <Input
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                placeholder={t('vaccine.professionalPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          className="w-full h-12"
          disabled={processing || !vaccineName}
        >
          <Check className="mr-2 h-5 w-5" />
          {t('vaccine.saveToWallet')}
        </Button>
      </div>
    </div>
  );
}
