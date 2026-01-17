import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Stethoscope, 
  Download, 
  Share2,
  Calendar,
  Pill,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConsultationMetrics {
  periodDays: number;
  adherenceRate: number;
  medicationsCount: number;
  sideEffectsCount: number;
  adherenceByMedication: Array<{
    name: string;
    rate: number;
    taken: number;
    total: number;
  }>;
}

export default function ClaraConsultationPrep() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ConsultationMetrics | null>(null);
  const [period, setPeriod] = useState(30);

  const t = {
    title: language === 'pt' ? 'Preparação para Consulta' : 'Consultation Prep',
    subtitle: language === 'pt' 
      ? 'Gere um relatório completo para seu médico' 
      : 'Generate a complete report for your doctor',
    generate: language === 'pt' ? 'Gerar Relatório' : 'Generate Report',
    period30: language === 'pt' ? '30 dias' : '30 days',
    period60: language === 'pt' ? '60 dias' : '60 days',
    period90: language === 'pt' ? '90 dias' : '90 days',
    medications: language === 'pt' ? 'Medicamentos' : 'Medications',
    adherence: language === 'pt' ? 'Adesão' : 'Adherence',
    sideEffects: language === 'pt' ? 'Efeitos adversos' : 'Side effects',
    copy: language === 'pt' ? 'Copiar' : 'Copy',
    share: language === 'pt' ? 'Compartilhar' : 'Share',
    copied: language === 'pt' ? 'Copiado!' : 'Copied!',
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clara-consultation-prep', {
        body: { period }
      });
      
      if (error) throw error;
      
      setReport(data.report);
      setMetrics(data.metrics);
      
      toast.success(language === 'pt' ? 'Relatório gerado!' : 'Report generated!');
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(language === 'pt' ? 'Erro ao gerar relatório' : 'Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    toast.success(t.copied);
  };

  const handleShare = async () => {
    if (!report) return;
    
    try {
      await navigator.share({
        title: t.title,
        text: report,
      });
    } catch {
      handleCopy();
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </div>
          {t.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t.subtitle}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : report ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Quick Metrics */}
            {metrics && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <Pill className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{metrics.medicationsCount}</p>
                  <p className="text-xs text-muted-foreground">{t.medications}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-bold">{metrics.adherenceRate}%</p>
                  <p className="text-xs text-muted-foreground">{t.adherence}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <FileText className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                  <p className="text-lg font-bold">{metrics.sideEffectsCount}</p>
                  <p className="text-xs text-muted-foreground">{t.sideEffects}</p>
                </div>
              </div>
            )}

            {/* Report Content */}
            <div className="p-4 rounded-lg bg-card border text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {report}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                {t.copy}
              </Button>
              <Button
                size="sm"
                onClick={handleShare}
                className="flex-1 gap-2"
              >
                <Share2 className="h-4 w-4" />
                {t.share}
              </Button>
            </div>

            {/* Generate new */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReport(null)}
              className="w-full"
            >
              {language === 'pt' ? 'Gerar novo relatório' : 'Generate new report'}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Period Selection */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'pt' ? 'Período do relatório:' : 'Report period:'}
              </p>
              <div className="flex gap-2">
                {[
                  { value: 30, label: t.period30 },
                  { value: 60, label: t.period60 },
                  { value: 90, label: t.period90 },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={period === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriod(option.value)}
                    className="flex-1"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm">
                {language === 'pt'
                  ? '📋 O relatório inclui: medicamentos em uso, taxa de adesão, efeitos adversos e pontos para discutir com seu médico.'
                  : '📋 The report includes: medications in use, adherence rate, side effects, and points to discuss with your doctor.'}
              </p>
            </div>

            <Button onClick={generateReport} disabled={loading} className="w-full gap-2">
              <FileText className="h-4 w-4" />
              {t.generate}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
