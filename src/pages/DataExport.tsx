import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileText, Shield, Database, ArrowLeft, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addHeader, addFooter, addSectionHeader, checkPageBreak } from '@/lib/pdfReportTypes';
import logoImage from '@/assets/horamed-logo-optimized.webp';

export default function DataExport() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    profile: true,
    profiles: true,
    medications: true,
    doses: true,
    documents: true,
    insights: true,
  });

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAll = () => {
    const allSelected = Object.values(selectedSections).every(v => v);
    const newState = !allSelected;
    setSelectedSections({
      profile: newState,
      profiles: newState,
      medications: newState,
      doses: newState,
      documents: newState,
      insights: newState,
    });
  };

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

      // Add compact header with logo
      if (logoImage) {
        try {
          doc.addImage(logoImage, 'PNG', 15, yPos, 20, 20);
        } catch (error) {
          console.error('Error adding logo:', error);
        }
      }
      
      doc.setFontSize(16);
      doc.setTextColor(82, 109, 255);
      doc.text('Exportação de Dados - HoraMed', 105, yPos + 8, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, yPos + 14, { align: 'center' });
      
      yPos += 25;

      // User info section
      if (selectedSections.profile && data.profile) {
        yPos = checkPageBreak(doc, yPos, 60);
        
        doc.setFillColor(82, 109, 255);
        doc.rect(15, yPos, 180, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Informacoes do Usuario', 18, yPos + 4);
        yPos += 10;
        
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
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 245],
            textColor: [30, 30, 30],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50]
          },
          columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 120 }
          },
          margin: { left: 15, right: 15 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Profiles section
      if (selectedSections.profiles && data.user_profiles && data.user_profiles.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        
        doc.setFillColor(82, 109, 255);
        doc.rect(15, yPos, 180, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Perfis de Familia', 18, yPos + 4);
        yPos += 10;
        
        const profilesData = data.user_profiles.map((p: any) => [
          p.name || '-',
          p.relationship || 'Principal',
          p.birth_date ? format(new Date(p.birth_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Nome', 'Relação', 'Data de Nascimento']],
          body: profilesData,
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 245],
            textColor: [30, 30, 30],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50]
          },
          margin: { left: 15, right: 15 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Medications section
      if (selectedSections.medications && data.items && data.items.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        
        doc.setFillColor(82, 109, 255);
        doc.rect(15, yPos, 180, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Medicamentos', 18, yPos + 4);
        yPos += 10;
        
        const medsData = data.items.map((item: any) => [
          item.name || '-',
          item.category || '-',
          item.dose_text || '-',
          item.is_active ? 'Ativo' : 'Inativo',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Nome', 'Categoria', 'Dosagem', 'Status']],
          body: medsData,
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 245],
            textColor: [30, 30, 30],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50]
          },
          margin: { left: 15, right: 15 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Doses section - summary
      if (selectedSections.doses && data.dose_instances && data.dose_instances.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        
        doc.setFillColor(82, 109, 255);
        doc.rect(15, yPos, 180, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Historico de Doses (Resumo)', 18, yPos + 4);
        yPos += 10;
        
        const taken = data.dose_instances.filter((d: any) => d.status === 'taken').length;
        const skipped = data.dose_instances.filter((d: any) => d.status === 'skipped').length;
        const pending = data.dose_instances.filter((d: any) => d.status === 'pending').length;
        const adherenceRate = taken + skipped > 0 ? Math.round((taken / (taken + skipped)) * 100) : 0;
        
        const summaryData = [
          ['Total de Doses', data.dose_instances.length.toString()],
          ['Tomadas', taken.toString()],
          ['Puladas', skipped.toString()],
          ['Pendentes', pending.toString()],
          ['Taxa de Compromisso', `${adherenceRate}%`],
        ];
        autoTable(doc, {
          startY: yPos,
          head: [['Métrica', 'Valor']],
          body: summaryData,
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 245],
            textColor: [30, 30, 30],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50]
          },
          columnStyles: {
            0: { cellWidth: 100, fontStyle: 'bold' },
            1: { cellWidth: 80 }
          },
          margin: { left: 15, right: 15 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Documents section
      if (selectedSections.documents && data.documentos_saude && data.documentos_saude.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        
        doc.setFillColor(82, 109, 255);
        doc.rect(15, yPos, 180, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Documentos de Saude', 18, yPos + 4);
        yPos += 10;
        
        const docsData = data.documentos_saude.slice(0, 20).map((document: any) => [
          document.title || 'Sem título',
          document.categoria_id || '-',
          document.issued_at ? format(new Date(document.issued_at), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Título', 'Categoria', 'Data']],
          body: docsData,
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 245],
            textColor: [30, 30, 30],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50]
          },
          margin: { left: 15, right: 15 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Health insights section
      if (selectedSections.insights && data.health_insights && data.health_insights.length > 0) {
        yPos = checkPageBreak(doc, yPos, 60);
        
        doc.setFillColor(82, 109, 255);
        doc.rect(15, yPos, 180, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Insights de Saude', 18, yPos + 4);
        yPos += 10;
        
        const severityMap: Record<string, string> = {
          critical: 'Critico',
          warning: 'Atencao',
          info: 'Info'
        };
        
        const typeMap: Record<string, string> = {
          drug_interaction: 'Interacao Medicamentosa',
          adherence_pattern: 'Padrao de Adesao',
          stock_alert: 'Alerta de Estoque',
          schedule_conflict: 'Conflito de Horario',
          side_effect: 'Efeito Colateral',
          renewal_needed: 'Renovacao Necessaria'
        };
        
        const insightsData = data.health_insights.slice(0, 10).map((insight: any) => [
          insight.title || '-',
          severityMap[insight.severity] || insight.severity || '-',
          typeMap[insight.insight_type] || insight.insight_type || '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Título', 'Severidade', 'Tipo']],
          body: insightsData,
          theme: 'grid',
          headStyles: { 
            fillColor: [240, 240, 245],
            textColor: [30, 30, 30],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50]
          },
          margin: { left: 15, right: 15 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Summary section at the end
      doc.addPage();
      yPos = 20;
      
      doc.setFillColor(82, 109, 255);
      doc.rect(15, yPos, 180, 6, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('Resumo da Exportacao', 18, yPos + 4);
      yPos += 10;
      
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
        theme: 'grid',
        headStyles: { 
          fillColor: [240, 240, 245],
          textColor: [30, 30, 30],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50]
        },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: 'bold' },
          1: { cellWidth: 60 }
        },
        margin: { left: 15, right: 15 }
      });

      // Add footer to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Página ${i} de ${pageCount} | HoraMed - Gestão de Saúde`,
          105,
          287,
          { align: 'center' }
        );
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('Documento gerado em conformidade com a LGPD. Mantenha em local seguro.', 105, 292, { align: 'center' });
      }

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
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <p className="text-sm font-semibold">Selecione os dados para exportar:</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleAll}
                  className="h-8 text-xs"
                >
                  {Object.values(selectedSections).every(v => v) ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="profile" 
                    checked={selectedSections.profile}
                    onCheckedChange={() => toggleSection('profile')}
                  />
                  <label htmlFor="profile" className="text-sm cursor-pointer flex-1">
                    Perfil principal e informações pessoais
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="profiles" 
                    checked={selectedSections.profiles}
                    onCheckedChange={() => toggleSection('profiles')}
                  />
                  <label htmlFor="profiles" className="text-sm cursor-pointer flex-1">
                    Perfis adicionais (família)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="medications" 
                    checked={selectedSections.medications}
                    onCheckedChange={() => toggleSection('medications')}
                  />
                  <label htmlFor="medications" className="text-sm cursor-pointer flex-1">
                    Medicamentos e suplementos
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="doses" 
                    checked={selectedSections.doses}
                    onCheckedChange={() => toggleSection('doses')}
                  />
                  <label htmlFor="doses" className="text-sm cursor-pointer flex-1">
                    Histórico de doses e horários
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="documents" 
                    checked={selectedSections.documents}
                    onCheckedChange={() => toggleSection('documents')}
                  />
                  <label htmlFor="documents" className="text-sm cursor-pointer flex-1">
                    Documentos de saúde e exames
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="insights" 
                    checked={selectedSections.insights}
                    onCheckedChange={() => toggleSection('insights')}
                  />
                  <label htmlFor="insights" className="text-sm cursor-pointer flex-1">
                    Insights e análises de saúde
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <Button 
                onClick={exportData} 
                disabled={exporting || !Object.values(selectedSections).some(v => v)}
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
              {!Object.values(selectedSections).some(v => v) && (
                <p className="text-xs text-destructive text-center mt-2">
                  Selecione ao menos uma seção para exportar
                </p>
              )}
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
