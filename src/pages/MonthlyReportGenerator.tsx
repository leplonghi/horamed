import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, FileText, Mail, MessageCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MonthlyReportGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profiles } = useUserProfiles();
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("last_month");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedProfile) {
      toast.error("Selecione um perfil");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-monthly-report", {
        body: {
          userId: user?.id,
          profileId: selectedProfile,
          period: selectedPeriod,
        },
      });

      if (error) throw error;

      setReportUrl(data.url);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = (method: "whatsapp" | "email") => {
    if (!reportUrl) return;

    if (method === "whatsapp") {
      const text = encodeURIComponent(`Relatório HoraMed: ${reportUrl}`);
      window.open(`https://wa.me/?text=${text}`, "_blank");
    } else {
      const subject = encodeURIComponent("Relatório HoraMed");
      const body = encodeURIComponent(`Segue o relatório: ${reportUrl}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/hoje")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Relatório para o médico</h1>
        </div>

        {!reportUrl ? (
          <>
            <Card className="p-6 space-y-4 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="space-y-2">
                  <h2 className="font-bold text-foreground">O HoraMed vai montar um resumo com:</h2>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Remédios atuais</li>
                    <li>Doses tomadas e perdidas</li>
                    <li>Peso (se você registrou)</li>
                    <li>Documentos importantes do período</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Para qual pessoa?</label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Qual período?</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_month">Último mês</SelectItem>
                    <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                    <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full h-14 text-lg"
                disabled={isGenerating || !selectedProfile}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando relatório...
                  </>
                ) : (
                  "Gerar relatório"
                )}
              </Button>
            </Card>
          </>
        ) : (
          <Card className="p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Relatório pronto!</h2>
              <p className="text-muted-foreground">
                Este PDF foi feito para ser lido por médicos na consulta.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => window.open(reportUrl, "_blank")}
                className="w-full h-14 text-lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                Ver relatório
              </Button>

              <Button 
                onClick={() => handleShare("whatsapp")}
                variant="outline"
                className="w-full h-14 text-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Enviar por WhatsApp
              </Button>

              <Button 
                onClick={() => handleShare("email")}
                variant="outline"
                className="w-full h-14 text-lg"
              >
                <Mail className="w-5 h-5 mr-2" />
                Enviar por e-mail
              </Button>
            </div>

            <Button 
              onClick={() => navigate("/hoje")}
              variant="ghost"
              className="w-full"
            >
              Voltar para Hoje
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
