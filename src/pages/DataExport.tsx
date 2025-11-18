import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText, Shield, Database, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DataExport() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `horamed-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
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
              O arquivo JSON conterá as seguintes informações:
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
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Todos os Dados
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                O arquivo será baixado em formato JSON
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
