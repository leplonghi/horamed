import { useState } from "react";
import logoImageSrc from "@/assets/horamed-logo-web.webp";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { 
  FileText, 
  Download, 
  Calendar, 
  Activity, 
  Pill,
  ChevronLeft,
  Clock,
  FileCheck
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MedicalReports() {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const generateReport = async (type: 'complete' | 'medication' | 'adherence' | 'health') => {
    if (!isPremium) {
      toast.error("Esta funcionalidade é exclusiva para usuários Premium", {
        action: {
          label: "Ver Planos",
          onClick: () => navigate('/planos'),
        },
      });
      return;
    }

    setIsGenerating(true);

    try {
      const loadingToast = toast.loading("Coletando dados...");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch items with schedules and stock
      const { data: items } = await supabase
        .from("items")
        .select(`
          id,
          name,
          dose_text,
          category,
          with_food,
          notes,
          schedules (
            id,
            times,
            freq_type,
            days_of_week
          ),
          stock (
            units_left,
            units_total,
            unit_label,
            projected_end_at
          )
        `)
        .eq("is_active", true)
        .order("category")
        .order("name");

      // Fetch health history based on period
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: healthHistory } = await supabase
        .from("health_history")
        .select("*")
        .eq("user_id", user.id)
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: false });

      // Fetch dose instances for adherence
      const { data: doseInstances } = await supabase
        .from("dose_instances")
        .select(`
          id,
          status,
          due_at,
          taken_at,
          item_id,
          items (name)
        `)
        .gte("due_at", startDate.toISOString())
        .order("due_at", { ascending: false });

      toast.dismiss(loadingToast);
      toast.loading("Gerando PDF...");

      // Load logo
      const logoImage = await fetch(logoImageSrc)
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .catch(() => undefined);

      const pdfModule = await import('@/lib/pdfExport');
      
      const formattedItems = (items || []).map(item => {
        const stockData = item.stock as any;
        return {
          name: item.name,
          dose_text: item.dose_text,
          category: item.category,
          with_food: item.with_food,
          notes: item.notes,
          schedules: (item.schedules || []).map(s => ({
            times: s.times,
            freq_type: s.freq_type,
            days_of_week: s.days_of_week,
          })),
          stock: stockData ? [{
            units_left: stockData.units_left || 0,
            units_total: stockData.units_total || 0,
            unit_label: stockData.unit_label || '',
            projected_end_at: stockData.projected_end_at,
          }] : undefined,
        };
      });

      const bmi = profile?.weight_kg && profile?.height_cm 
        ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
        : undefined;

      const exportData = {
        userEmail: user.email || '',
        profile: profile || {},
        bmi,
        items: formattedItems,
        healthHistory: healthHistory || [],
        doseInstances: doseInstances || [],
        period: parseInt(selectedPeriod),
      };

      switch (type) {
        case 'complete':
          await pdfModule.generateCompletePDF(exportData, logoImage);
          break;
        case 'medication':
          await pdfModule.generateMedicationReport(exportData, logoImage);
          break;
        case 'adherence':
          await pdfModule.generateProgressReport(exportData, logoImage);
          break;
        case 'health':
          await pdfModule.generateHealthReport(exportData, logoImage);
          break;
      }
      
      toast.dismiss();
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.dismiss();
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/perfil')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Relatórios Médicos</h1>
              <p className="text-sm text-muted-foreground">Gere relatórios profissionais em PDF</p>
            </div>
          </div>

          {/* Premium Notice */}
          {!isPremium && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Recurso Premium</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    A geração de relatórios médicos está disponível apenas para usuários Premium.
                  </p>
                  <Button size="sm" onClick={() => navigate('/planos')}>
                    Ver Planos Premium
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Period Selection */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Período do Relatório</h3>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* Report Types */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground px-2">Tipos de Relatório</h2>

            {/* Complete Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">Relatório Completo</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Documento completo com todos os dados: perfil de saúde, medicamentos, estoque, agendamentos, histórico de aderência e evolução de saúde.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                    <li>✓ Dados pessoais e de saúde</li>
                    <li>✓ Lista completa de medicamentos</li>
                    <li>✓ Calendário e horários</li>
                    <li>✓ Controle de estoque</li>
                    <li>✓ Histórico de aderência</li>
                    <li>✓ Evolução de peso e IMC</li>
                  </ul>
                  <Button 
                    className="w-full"
                    onClick={() => generateReport('complete')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório Completo
                  </Button>
                </div>
              </div>
            </Card>

            {/* Medication Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Pill className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">Relatório de Medicamentos</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Documento focado em medicamentos: lista detalhada com dosagens, horários, frequências, observações e controle de estoque.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                    <li>✓ Lista de medicamentos ativos</li>
                    <li>✓ Dosagens e instruções</li>
                    <li>✓ Horários e frequências</li>
                    <li>✓ Estoque e alertas</li>
                  </ul>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => generateReport('medication')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório de Medicamentos
                  </Button>
                </div>
              </div>
            </Card>

            {/* Adherence Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">Relatório de Aderência</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Análise completa da aderência ao tratamento: estatísticas, gráficos, doses tomadas, perdidas e padrões de comportamento.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                    <li>✓ Taxa de aderência geral</li>
                    <li>✓ Aderência por medicamento</li>
                    <li>✓ Doses tomadas vs. perdidas</li>
                    <li>✓ Padrões e tendências</li>
                  </ul>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => generateReport('adherence')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório de Aderência
                  </Button>
                </div>
              </div>
            </Card>

            {/* Health Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">Relatório de Saúde</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acompanhamento da evolução de saúde: histórico de peso, altura, IMC e dados vitais ao longo do tempo.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                    <li>✓ Evolução de peso</li>
                    <li>✓ Histórico de IMC</li>
                    <li>✓ Gráficos de tendência</li>
                    <li>✓ Análise temporal</li>
                  </ul>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => generateReport('health')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório de Saúde
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Importante:</strong> Estes relatórios são documentos informativos gerados com base nos dados cadastrados no aplicativo.
                </p>
                <p>
                  • Os relatórios podem ser compartilhados com seu médico durante consultas
                </p>
                <p>
                  • Todos os dados são processados localmente no seu dispositivo
                </p>
                <p>
                  • Os PDFs incluem dados do período selecionado acima
                </p>
                <p className="text-xs italic">
                  Este relatório não substitui consulta médica profissional.
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>
      <Navigation />
    </>
  );
}
