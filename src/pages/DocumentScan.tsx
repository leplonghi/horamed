import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Pill, Stethoscope, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type ScanType = 'medication' | 'exam' | 'document';

export default function DocumentScan() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ScanType>('medication');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setSelectedFile(file);
      setScanResult(null);
    }
  };

  const scanDocument = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    setScanning(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });

      const base64 = (reader.result as string).split(',')[1];

      // Select the appropriate edge function
      let functionName = '';
      switch (activeTab) {
        case 'medication':
          functionName = 'extract-medication';
          break;
        case 'exam':
          functionName = 'extract-exam';
          break;
        case 'document':
          functionName = 'extract-document';
          break;
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { image: base64 }
      });

      if (error) throw error;

      setScanResult(data);
      toast.success('Documento processado com sucesso!');

      // If medication, offer to add to list
      if (activeTab === 'medication' && data.medications) {
        toast.success(`${data.medications.length} medicamento(s) encontrado(s)`, {
          action: {
            label: 'Adicionar',
            onClick: () => navigate('/adicionar', { state: { ocrData: data.medications } })
          }
        });
      }

    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error('Erro ao processar documento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setScanning(false);
    }
  };

  const getTabIcon = (tab: ScanType) => {
    switch (tab) {
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'exam':
        return <Stethoscope className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTabDescription = (tab: ScanType) => {
    switch (tab) {
      case 'medication':
        return 'Extraia informações de receitas médicas e bulas';
      case 'exam':
        return 'Extraia resultados de exames laboratoriais';
      case 'document':
        return 'Extraia texto de documentos médicos gerais';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Digitalizar Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Use IA para extrair informações de documentos médicos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScanType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="medication" className="flex items-center gap-2">
              {getTabIcon('medication')}
              <span className="hidden sm:inline">Receitas</span>
            </TabsTrigger>
            <TabsTrigger value="exam" className="flex items-center gap-2">
              {getTabIcon('exam')}
              <span className="hidden sm:inline">Exames</span>
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-2">
              {getTabIcon('document')}
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Receitas Médicas
                </CardTitle>
                <CardDescription>
                  {getTabDescription('medication')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="med-file">Selecione a receita (PDF, imagem)</Label>
                  <Input
                    id="med-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                </div>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Arquivo selecionado: {selectedFile.name}
                  </div>
                )}
                <Button 
                  onClick={scanDocument}
                  disabled={!selectedFile || scanning}
                  className="w-full"
                  size="lg"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Digitalizar Receita
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exam" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Exames Laboratoriais
                </CardTitle>
                <CardDescription>
                  {getTabDescription('exam')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="exam-file">Selecione o exame (PDF, imagem)</Label>
                  <Input
                    id="exam-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                </div>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Arquivo selecionado: {selectedFile.name}
                  </div>
                )}
                <Button 
                  onClick={scanDocument}
                  disabled={!selectedFile || scanning}
                  className="w-full"
                  size="lg"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Digitalizar Exame
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="document" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos Médicos
                </CardTitle>
                <CardDescription>
                  {getTabDescription('document')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="doc-file">Selecione o documento (PDF, imagem)</Label>
                  <Input
                    id="doc-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                </div>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Arquivo selecionado: {selectedFile.name}
                  </div>
                )}
                <Button 
                  onClick={scanDocument}
                  disabled={!selectedFile || scanning}
                  className="w-full"
                  size="lg"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Digitalizar Documento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {scanResult && (
          <Card className="border-success">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                Resultado da Digitalização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(scanResult, null, 2)}
              </pre>
              
              {activeTab === 'medication' && scanResult.medications && (
                <Button 
                  className="w-full mt-4"
                  onClick={() => navigate('/adicionar', { state: { ocrData: scanResult.medications } })}
                >
                  Adicionar Medicamentos à Lista
                </Button>
              )}

              {activeTab === 'exam' && (
                <Button 
                  className="w-full mt-4"
                  onClick={() => navigate('/cofre/upload', { state: { ocrData: scanResult } })}
                >
                  Salvar no Cofre de Saúde
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
