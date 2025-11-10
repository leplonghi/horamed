import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Upload, CheckCircle2, Sparkles, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { fileToDataURL } from '@/lib/fileToDataURL';

export default function DocumentScan() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      
      try {
        const dataURL = await fileToDataURL(file);
        setPreview(dataURL);
        setSelectedFile(file);
        setScanResult(null);
      } catch (error: any) {
        toast.error(error.message ?? 'Erro ao carregar arquivo');
      }
    }
  };

  const scanDocument = async () => {
    if (!selectedFile || !preview) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    setScanning(true);
    toast.loading('Analisando documento com IA...', { id: 'scan' });
    
    try {
      // Usar extract-document que é o mais completo e detecta automaticamente o tipo
      const { data, error } = await supabase.functions.invoke('extract-document', {
        body: { image: preview }
      });

      if (error) throw error;

      toast.dismiss('scan');
      setScanResult(data);
      
      // Auto-redirecionar baseado no tipo de documento detectado pela IA
      if (data.category === 'receita' && data.medications && data.medications.length > 0) {
        toast.success(`✨ Receita médica detectada! ${data.medications.length} medicamento(s) encontrado(s)`, {
          duration: 3000
        });
        setTimeout(() => {
          navigate('/adicionar', { state: { ocrData: data.medications } });
        }, 2000);
      } else if (data.category === 'exame' || data.title) {
        toast.success(`✨ ${data.category === 'exame' ? 'Exame' : 'Documento'} detectado! Redirecionando...`, {
          duration: 3000
        });
        setTimeout(() => {
          navigate('/cofre/upload', { state: { ocrData: data } });
        }, 2000);
      } else {
        toast.success('Documento processado com sucesso!');
      }

    } catch (error: any) {
      console.error('Scan error:', error);
      toast.dismiss('scan');
      toast.error(error.message ?? 'Erro ao processar documento');
    } finally {
      setScanning(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setScanResult(null);
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Digitalizar Documento
          </h1>
          <p className="text-muted-foreground mt-1">
            A IA detecta automaticamente o tipo de documento (receita, exame, atestado, etc)
          </p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Enviar Documento Médico
            </CardTitle>
            <CardDescription>
              Formatos aceitos: PDF, PNG, JPG, WEBP (máximo 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!preview ? (
              <>
                <div>
                  <Label htmlFor="file-input" className="text-base font-medium">
                    Selecione ou arraste o arquivo
                  </Label>
                  <Input
                    id="file-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearFile}>
                      Remover
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
                  {preview.startsWith('data:application/pdf') ? (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">{selectedFile?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain bg-muted" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearFile} className="flex-1">
                    Trocar arquivo
                  </Button>
                  <Button 
                    onClick={scanDocument}
                    disabled={scanning}
                    className="flex-1"
                    size="lg"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Extrair com IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {scanResult && (
          <Card className="border-success">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                ✨ Documento processado com sucesso!
              </CardTitle>
              <CardDescription>
                Tipo detectado: <strong>{scanResult.category || 'documento'}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                {scanResult.title && (
                  <div>
                    <span className="text-muted-foreground">Título:</span>
                    <span className="ml-2 font-medium">{scanResult.title}</span>
                  </div>
                )}
                {scanResult.issued_at && (
                  <div>
                    <span className="text-muted-foreground">Data de emissão:</span>
                    <span className="ml-2 font-medium">{new Date(scanResult.issued_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {scanResult.provider && (
                  <div>
                    <span className="text-muted-foreground">Prestador:</span>
                    <span className="ml-2 font-medium">{scanResult.provider}</span>
                  </div>
                )}
                {scanResult.medications && scanResult.medications.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Medicamentos:</span>
                    <span className="ml-2 font-medium">{scanResult.medications.length} encontrado(s)</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Redirecionando automaticamente...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
