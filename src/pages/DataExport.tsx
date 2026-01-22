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
import { ptBR, enUS } from 'date-fns/locale';
import { addHeader, addFooter, addSectionHeader, checkPageBreak } from '@/lib/pdfReportTypes';
import logoImage from '@/assets/logo_HoraMed.png';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DataExport() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
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
      toast.loading(t('export.preparingData'));
      
      const { data, error } = await supabase.functions.invoke('export-user-data');

      if (error) throw error;

      toast.loading(t('export.generatingPdf'));

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
      doc.text(language === 'pt' ? 'Exportação de Dados - HoraMed' : 'Data Export - HoraMed', 105, yPos + 8, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(format(new Date(), language === 'pt' ? "dd/MM/yyyy 'às' HH:mm" : "MM/dd/yyyy 'at' HH:mm", { locale: dateLocale }), 105, yPos + 14, { align: 'center' });
      
      yPos += 25;

      // User info section
      if (selectedSections.profile && data.profile) {
        yPos = checkPageBreak(doc, yPos, 60);
        
        doc.setFillColor(82, 109, 255);
        doc.rect(15, yPos, 180, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(language === 'pt' ? 'Informacoes do Usuario' : 'User Information', 18, yPos + 4);
        yPos += 10;
        
        const profileData = [
          [language === 'pt' ? 'Nome' : 'Name', data.profile.full_name || '-'],
          [language === 'pt' ? 'Data de Nascimento' : 'Birth Date', data.profile.birth_date ? format(new Date(data.profile.birth_date), 'dd/MM/yyyy', { locale: dateLocale }) : '-'],
          [language === 'pt' ? 'Altura' : 'Height', data.profile.height_cm ? `${data.profile.height_cm} cm` : '-'],
          [language === 'pt' ? 'Peso' : 'Weight', data.profile.weight_kg ? `${data.profile.weight_kg} kg` : '-'],
        ];
        autoTable(doc, {
          startY: yPos,
          head: [[language === 'pt' ? 'Campo' : 'Field', language === 'pt' ? 'Valor' : 'Value']],
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
        doc.text(language === 'pt' ? 'Perfis de Familia' : 'Family Profiles', 18, yPos + 4);
        yPos += 10;
        
        const profilesData = data.user_profiles.map((p: any) => [
          p.name || '-',
          p.relationship || (language === 'pt' ? 'Principal' : 'Primary'),
          p.birth_date ? format(new Date(p.birth_date), 'dd/MM/yyyy', { locale: dateLocale }) : '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [[language === 'pt' ? 'Nome' : 'Name', language === 'pt' ? 'Relação' : 'Relationship', language === 'pt' ? 'Data de Nascimento' : 'Birth Date']],
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
        doc.text(language === 'pt' ? 'Medicamentos' : 'Medications', 18, yPos + 4);
        yPos += 10;
        
        const medsData = data.items.map((item: any) => [
          item.name || '-',
          item.category || '-',
          item.dose_text || '-',
          item.is_active ? (language === 'pt' ? 'Ativo' : 'Active') : (language === 'pt' ? 'Inativo' : 'Inactive'),
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [[language === 'pt' ? 'Nome' : 'Name', language === 'pt' ? 'Categoria' : 'Category', language === 'pt' ? 'Dosagem' : 'Dosage', 'Status']],
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
        doc.text(language === 'pt' ? 'Historico de Doses (Resumo)' : 'Dose History (Summary)', 18, yPos + 4);
        yPos += 10;
        
        const taken = data.dose_instances.filter((d: any) => d.status === 'taken').length;
        const skipped = data.dose_instances.filter((d: any) => d.status === 'skipped').length;
        const pending = data.dose_instances.filter((d: any) => d.status === 'pending').length;
        const adherenceRate = taken + skipped > 0 ? Math.round((taken / (taken + skipped)) * 100) : 0;
        
        const summaryData = [
          [language === 'pt' ? 'Total de Doses' : 'Total Doses', data.dose_instances.length.toString()],
          [language === 'pt' ? 'Tomadas' : 'Taken', taken.toString()],
          [language === 'pt' ? 'Puladas' : 'Skipped', skipped.toString()],
          [language === 'pt' ? 'Pendentes' : 'Pending', pending.toString()],
          [language === 'pt' ? 'Taxa de Compromisso' : 'Adherence Rate', `${adherenceRate}%`],
        ];
        autoTable(doc, {
          startY: yPos,
          head: [[language === 'pt' ? 'Métrica' : 'Metric', language === 'pt' ? 'Valor' : 'Value']],
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
        doc.text(language === 'pt' ? 'Documentos de Saude' : 'Health Documents', 18, yPos + 4);
        yPos += 10;
        
        const docsData = data.documentos_saude.slice(0, 20).map((document: any) => [
          document.title || (language === 'pt' ? 'Sem título' : 'No title'),
          document.categoria_id || '-',
          document.issued_at ? format(new Date(document.issued_at), 'dd/MM/yyyy', { locale: dateLocale }) : '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [[language === 'pt' ? 'Título' : 'Title', language === 'pt' ? 'Categoria' : 'Category', language === 'pt' ? 'Data' : 'Date']],
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
        doc.text(language === 'pt' ? 'Insights de Saude' : 'Health Insights', 18, yPos + 4);
        yPos += 10;
        
        const severityMap: Record<string, string> = language === 'pt' ? {
          critical: 'Critico',
          warning: 'Atencao',
          info: 'Info'
        } : {
          critical: 'Critical',
          warning: 'Warning',
          info: 'Info'
        };
        
        const typeMap: Record<string, string> = language === 'pt' ? {
          drug_interaction: 'Interacao Medicamentosa',
          adherence_pattern: 'Padrao de Adesao',
          stock_alert: 'Alerta de Estoque',
          schedule_conflict: 'Conflito de Horario',
          side_effect: 'Efeito Colateral',
          renewal_needed: 'Renovacao Necessaria'
        } : {
          drug_interaction: 'Drug Interaction',
          adherence_pattern: 'Adherence Pattern',
          stock_alert: 'Stock Alert',
          schedule_conflict: 'Schedule Conflict',
          side_effect: 'Side Effect',
          renewal_needed: 'Renewal Needed'
        };
        
        const insightsData = data.health_insights.slice(0, 10).map((insight: any) => [
          insight.title || '-',
          severityMap[insight.severity] || insight.severity || '-',
          typeMap[insight.insight_type] || insight.insight_type || '-',
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [[language === 'pt' ? 'Título' : 'Title', language === 'pt' ? 'Severidade' : 'Severity', language === 'pt' ? 'Tipo' : 'Type']],
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
      doc.text(language === 'pt' ? 'Resumo da Exportacao' : 'Export Summary', 18, yPos + 4);
      yPos += 10;
      
      const finalSummaryData = [
        [language === 'pt' ? 'Total de Perfis' : 'Total Profiles', (data.user_profiles?.length || 0).toString()],
        [language === 'pt' ? 'Total de Medicamentos' : 'Total Medications', (data.items?.length || 0).toString()],
        [language === 'pt' ? 'Total de Doses' : 'Total Doses', (data.dose_instances?.length || 0).toString()],
        [language === 'pt' ? 'Total de Documentos' : 'Total Documents', (data.documentos_saude?.length || 0).toString()],
        [language === 'pt' ? 'Total de Insights' : 'Total Insights', (data.health_insights?.length || 0).toString()],
        [language === 'pt' ? 'Data da Exportação' : 'Export Date', format(new Date(), language === 'pt' ? "dd/MM/yyyy 'às' HH:mm" : "MM/dd/yyyy 'at' HH:mm", { locale: dateLocale })],
      ];
      autoTable(doc, {
        startY: yPos,
        head: [['Item', language === 'pt' ? 'Quantidade' : 'Quantity']],
        body: finalSummaryData,
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
          language === 'pt' 
            ? `Página ${i} de ${pageCount} | HoraMed - Gestão de Saúde`
            : `Page ${i} of ${pageCount} | HoraMed - Health Management`,
          105,
          287,
          { align: 'center' }
        );
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text(
          language === 'pt'
            ? 'Documento gerado em conformidade com a LGPD. Mantenha em local seguro.'
            : 'Document generated in compliance with GDPR. Keep in a secure location.',
          105, 292, { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`horamed-${language === 'pt' ? 'dados' : 'data'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast.dismiss();
      toast.success(t('export.pdfSuccess'));
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      toast.dismiss();
      toast.error(t('export.pdfError') + ' ' + (error.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-6 pt-24 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            {t('export.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('export.subtitle')}
          </p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>{t('export.lgpdCompliance')}</AlertTitle>
          <AlertDescription>
            {t('export.lgpdDesc')}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>{t('export.dataIncluded')}</CardTitle>
            <CardDescription>
              {t('export.dataIncludedDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <p className="text-sm font-semibold">{t('export.selectData')}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleAll}
                  className="h-8 text-xs"
                >
                  {Object.values(selectedSections).every(v => v) ? t('export.unselectAll') : t('export.selectAll')}
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
                    {t('export.profileInfo')}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="profiles" 
                    checked={selectedSections.profiles}
                    onCheckedChange={() => toggleSection('profiles')}
                  />
                  <label htmlFor="profiles" className="text-sm cursor-pointer flex-1">
                    {t('export.familyProfiles')}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="medications" 
                    checked={selectedSections.medications}
                    onCheckedChange={() => toggleSection('medications')}
                  />
                  <label htmlFor="medications" className="text-sm cursor-pointer flex-1">
                    {t('export.medsSupplements')}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="doses" 
                    checked={selectedSections.doses}
                    onCheckedChange={() => toggleSection('doses')}
                  />
                  <label htmlFor="doses" className="text-sm cursor-pointer flex-1">
                    {t('export.doseHistory')}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="documents" 
                    checked={selectedSections.documents}
                    onCheckedChange={() => toggleSection('documents')}
                  />
                  <label htmlFor="documents" className="text-sm cursor-pointer flex-1">
                    {t('export.healthDocs')}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="insights" 
                    checked={selectedSections.insights}
                    onCheckedChange={() => toggleSection('insights')}
                  />
                  <label htmlFor="insights" className="text-sm cursor-pointer flex-1">
                    {t('export.healthInsights')}
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
                    {t('export.exporting')}
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    {t('export.exportPdf')}
                  </>
                )}
              </Button>
              {!Object.values(selectedSections).some(v => v) && (
                <p className="text-xs text-destructive text-center mt-2">
                  {t('export.selectAtLeast')}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t('export.pdfDownload')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert variant="default">
          <AlertDescription className="text-xs">
            <strong>{language === 'pt' ? 'Nota:' : 'Note:'}</strong> {t('export.sensitiveNote')}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}