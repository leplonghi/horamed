import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText, Shield, Database, ArrowLeft, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addHeader, addFooter, addSectionHeader, checkPageBreak } from '@/lib/pdfReportTypes';
import logoImage from '@/assets/horamed-logo.png';

export default function DataExport() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      toast.loading('Preparando seus dados...');
      
      const { data, error } = await supabase.functions.invoke('export-user-data');

      if (error) throw error;

      toast.loading('Gerando PDF...');

      // Create PDF
      const doc = new jsPDF();
      let yPos = 20;

      // Add header with logo
      yPos = addHeader(
        doc,
        'Exportação Completa de Dados',
        'HoraMed - Seus dados de saúde',
        yPos,
        logoImage
      );

      // User info section
      yPos = addSectionHeader(doc, '📋 Informações do Usuário', yPos);
      if (data.profile) {
        const profileData = [
          ['Nome', data.profile.full_name || '-'],
          ['Data de Nascimento', data.profile.birth_date ? format(new Date(data.profile.birth_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'],
          ['Altura', data.profile.height_cm ? `${data.profile.height_cm} cm` : '-'],
          ['Peso', data.profile.weight_kg ? `${data.profile.weight_kg} kg` : '-'],
        ];
        autoTable(doc, {
          startY: yPos,
          head: [['Campo', 'Valor']],
          body: profileData,
          theme: 'striped',
          headStyles: { fillColor: [82, 109, 255] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Profiles section
      if (data.user_profiles && data.user_profiles.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        yPos = addSectionHeader(doc, '👥 Perfis de Família', yPos);
        const profilesData = data.user_profiles.map((p: any) => [
          p.name,
          p.relationship || 'Principal',
          p.birth_date ? format(new Date(p.birth_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Nome', 'Relação', 'Data de Nascimento']],
          body: profilesData,
          theme: 'striped',
          headStyles: { fillColor: [82, 109, 255] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Medications section
      if (data.items && data.items.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        yPos = addSectionHeader(doc, '💊 Medicamentos', yPos);
        const medsData = data.items.map((item: any) => [
          item.name,
          item.category || '-',
          item.dose_text || '-',
          item.is_active ? 'Ativo' : 'Inativo',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Nome', 'Categoria', 'Dosagem', 'Status']],
          body: medsData,
          theme: 'striped',
          headStyles: { fillColor: [82, 109, 255] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Doses section - summary
      if (data.dose_instances && data.dose_instances.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        yPos = addSectionHeader(doc, '📊 Histórico de Doses (Resumo)', yPos);
        const taken = data.dose_instances.filter((d: any) => d.status === 'taken').length;
        const skipped = data.dose_instances.filter((d: any) => d.status === 'skipped').length;
        const pending = data.dose_instances.filter((d: any) => d.status === 'pending').length;
        const summaryData = [
          ['Total de Doses', data.dose_instances.length.toString()],
          ['Tomadas', taken.toString()],
          ['Puladas', skipped.toString()],
          ['Pendentes', pending.toString()],
          ['Taxa de Compromisso', `${Math.round((taken / (taken + skipped)) * 100)}%`],
        ];
        autoTable(doc, {
          startY: yPos,
          head: [['Métrica', 'Valor']],
          body: summaryData,
          theme: 'striped',
          headStyles: { fillColor: [82, 109, 255] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Documents section
      if (data.documentos_saude && data.documentos_saude.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        yPos = addSectionHeader(doc, '📄 Documentos de Saúde', yPos);
        const docsData = data.documentos_saude.slice(0, 20).map((doc: any) => [
          doc.title || 'Sem título',
          doc.categoria_id || '-',
          doc.issued_at ? format(new Date(doc.issued_at), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Título', 'Categoria', 'Data']],
          body: docsData,
          theme: 'striped',
          headStyles: { fillColor: [82, 109, 255] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Health insights section
      if (data.health_insights && data.health_insights.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        yPos = addSectionHeader(doc, '💡 Insights de Saúde', yPos);
        const insightsData = data.health_insights.slice(0, 10).map((insight: any) => [
          insight.title,
          insight.severity,
          insight.insight_type,
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Título', 'Severidade', 'Tipo']],
          body: insightsData,
          theme: 'striped',
          headStyles: { fillColor: [82, 109, 255] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Summary section at the end
      doc.addPage();
      yPos = 20;
      yPos = addSectionHeader(doc, '📈 Resumo da Exportação', yPos);
      const summaryData = [
        ['Total de Perfis', (data.user_profiles?.length || 0).toString()],
        ['Total de Medicamentos', (data.items?.length || 0).toString()],
        ['Total de Doses', (data.dose_instances?.length || 0).toString()],
        ['Total de Documentos', (data.documentos_saude?.length || 0).toString()],
        ['Total de Insights', (data.health_insights?.length || 0).toString()],
        ['Data da Exportação', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
      ];
      autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Quantidade']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [82, 109, 255] },
      });

      // Add footer to all pages
      addFooter(doc, 'Documento gerado em conformidade com a LGPD. Mantenha em local seguro.');

      // Save PDF
      doc.save(`horamed-dados-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast.dismiss();
      toast.success('PDF exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      toast.dismiss();
      toast.error('Erro ao exportar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-6 pt-24 space-y-6">{/* pt-24 para compensar o header fixo */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Exportação de Dados
          </h1>
          <p className="text-muted-foreground mt-1">
            Conforme a LGPD, você tem direito a uma cópia de todos os seus dados
          </p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Conformidade LGPD</AlertTitle>
          <AlertDescription>
            Este recurso permite que você exporte todos os dados pessoais armazenados no HoraMed,
            incluindo perfis, medicamentos, histórico de doses, documentos e mais.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Dados Incluídos na Exportação</CardTitle>
            <CardDescription>
              O arquivo PDF conterá as seguintes informações organizadas de forma clara:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              {[
                'Perfil principal e perfis adicionais',
                'Informações de saúde (peso, altura, histórico)',
                'Lista de medicamentos e suplementos',
                'Histórico completo de doses',
                'Horários e lembretes configurados',
                'Documentos de saúde e exames',
                'Insights e análises geradas',
                'Consentimentos fornecidos',
                'Configurações de notificações',
                'Métricas de adesão e conquistas'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t">
              <Button 
                onClick={exportData} 
                disabled={exporting}
                size="lg"
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar em PDF
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                O arquivo será baixado em formato PDF com design profissional
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert variant="default">
          <AlertDescription className="text-xs">
            <strong>Nota:</strong> Este arquivo contém informações sensíveis. 
            Mantenha-o em local seguro e não compartilhe publicamente.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
