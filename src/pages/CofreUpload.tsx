import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowLeft, Loader2, Camera, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";
import { isPDF } from "@/lib/pdfProcessor";


export default function CofreUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const { activeProfile } = useUserProfiles();

  const validateImageQuality = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file size
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return { valid: false, error: "Arquivo muito grande. Máximo: 20MB" };
    }

    // For images, check resolution
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        
        img.onload = () => {
          const minWidth = 800;
          const minHeight = 600;
          
          if (img.width < minWidth || img.height < minHeight) {
            resolve({ 
              valid: false, 
              error: `Imagem muito pequena (${img.width}x${img.height}). Mínimo recomendado: ${minWidth}x${minHeight}px` 
            });
          } else {
            resolve({ valid: true });
          }
        };
        
        img.onerror = () => {
          resolve({ valid: false, error: "Não foi possível ler a imagem" });
        };
        
        reader.readAsDataURL(file);
      });
    }
    
    return { valid: true };
  };

  const extractFromImage = async (base64: string) => {
    let attempts = 0;
    let success = false;
    
    while (attempts < 3 && !success) {
      try {
        const { data, error } = await supabase.functions.invoke('extract-document', {
          body: { image: base64 }
        });

        if (error) {
          if (error.message?.includes('400') || error.message?.includes('Invalid')) {
            throw error;
          }
          if (attempts === 2) throw error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }

        if (data) {
          success = true;
          return data;
        }
        break;
      } catch (err: any) {
        if (attempts === 2 || err.message?.includes('400') || err.message?.includes('Invalid')) {
          throw err;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);

      const firstFile = newFiles[0];
      if (firstFile) {
        // Validate quality first
        const validation = await validateImageQuality(firstFile);
        if (!validation.valid) {
          toast.error(validation.error, { duration: 6000 });
          setFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (cameraInputRef.current) cameraInputRef.current.value = '';
          return;
        }

        setIsExtracting(true);
        setUploading(true);
        toast.loading("Analisando documento...", { id: "extract" });
        
        try {
          // First, upload the file
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuário não autenticado");

          const fileExt = firstFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          toast.loading("Enviando arquivo...", { id: "extract" });

          const { error: uploadError } = await supabase.storage
            .from('cofre-saude')
            .upload(filePath, firstFile);

          if (uploadError) throw uploadError;

          // Now extract data from the file
          toast.loading("Analisando conteúdo com IA...", { id: "extract" });

          if (isPDF(firstFile)) {
            console.log('Processando PDF completo...');
            
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64 = reader.result as string;
                const data = await extractFromImage(base64);
                
                if (data) {
                  await saveDocumentAutomatically(data, user.id, filePath, firstFile.type);
                } else {
                  throw new Error("Não foi possível extrair dados do PDF");
                }
              } catch (err) {
                await supabase.storage.from('cofre-saude').remove([filePath]);
                throw err;
              }
            };
            reader.readAsDataURL(firstFile);
          } else {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = reader.result as string;
              
              try {
                const data = await extractFromImage(base64);
                
                if (data) {
                  await saveDocumentAutomatically(data, user.id, filePath, firstFile.type);
                } else {
                  await supabase.storage.from('cofre-saude').remove([filePath]);
                  throw new Error("Não foi possível extrair informações da imagem");
                }
              } catch (err: any) {
                await supabase.storage.from('cofre-saude').remove([filePath]);
                throw err;
              }
            };
            reader.readAsDataURL(firstFile);
          }
        } catch (error: any) {
          console.error('Erro ao processar documento:', error);
          toast.dismiss("extract");
          
          let errorMessage = "Não conseguimos processar o documento. ";
          let suggestions = "";
          
          if (error.message?.includes('Invalid') || error.message?.includes('formato')) {
            errorMessage = "Formato de arquivo inválido.";
            suggestions = "Use apenas PDF, PNG ou JPEG.";
          } else if (error.message?.includes('large') || error.message?.includes('size')) {
            errorMessage = "Arquivo muito grande.";
            suggestions = "Reduza o tamanho para menos de 20MB.";
          } else {
            errorMessage = "Qualidade insuficiente para leitura.";
            suggestions = "Dicas: tire foto com boa iluminação, evite sombras, mantenha o documento plano e use resolução mínima de 800x600px.";
          }
          
          toast.error(`${errorMessage} ${suggestions}`, { duration: 8000 });
          setIsExtracting(false);
          setUploading(false);
        }
      }
    }
  };

  const saveDocumentAutomatically = async (extractedData: any, userId: string, filePath: string, mimeType: string) => {
    try {
      toast.loading("Salvando documento...", { id: "extract" });

      const { data: categoriaData } = await supabase
        .from('categorias_saude')
        .select('id')
        .eq('slug', extractedData.category)
        .maybeSingle();

      const { data: newDoc, error: insertError } = await supabase
        .from('documentos_saude')
        .insert({
          user_id: userId,
          profile_id: activeProfile?.id,
          categoria_id: categoriaData?.id,
          title: extractedData.title,
          file_path: filePath,
          mime_type: mimeType,
          issued_at: extractedData.issued_at || null,
          expires_at: extractedData.expires_at || null,
          provider: extractedData.provider || null,
          confidence_score: extractedData.confidence_score || 0,
          status_extraction: 'confirmed',
          meta: {
            extracted_values: extractedData.extracted_values,
            prescriptions: extractedData.prescriptions,
            vaccine_name: extractedData.vaccine_name,
            dose_number: extractedData.dose_number,
            doctor_name: extractedData.doctor_name,
            specialty: extractedData.specialty,
          },
          ocr_text: JSON.stringify(extractedData),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.dismiss("extract");
      toast.success("✓ Documento salvo automaticamente!", { duration: 3000 });
      
      // Show brief summary
      const summary = [];
      if (extractedData.title) summary.push(`📄 ${extractedData.title}`);
      if (extractedData.provider) summary.push(`🏥 ${extractedData.provider}`);
      if (extractedData.issued_at) summary.push(`📅 ${new Date(extractedData.issued_at).toLocaleDateString('pt-BR')}`);
      
      if (summary.length > 0) {
        toast.info(summary.join(' • '), { duration: 5000 });
      }

      navigate(`/cofre/${newDoc.id}`);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.dismiss("extract");
      toast.error("Erro ao salvar documento");
      await supabase.storage.from('cofre-saude').remove([filePath]);
    } finally {
      setIsExtracting(false);
      setUploading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">{/* pt-24 para compensar o header fixo */}
        <Button variant="ghost" onClick={() => navigate("/cofre")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-2">Adicionar Documento</h1>
        <p className="text-muted-foreground mb-6">
          Envie PDF ou foto. O HoraMed identifica o tipo e extrai os dados automaticamente.
        </p>

        {isExtracting && (
          <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Analisando documento com IA avançada...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processando e extraindo informações automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Requisitos para melhor extração
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 ml-6">
                <li>• <strong>Imagens:</strong> mínimo 800x600px, com boa iluminação e sem sombras</li>
                <li>• <strong>PDFs:</strong> preferir documentos com texto selecionável</li>
                <li>• <strong>Foco:</strong> documento deve estar nítido e plano</li>
                <li>• <strong>Tamanho:</strong> máximo 20MB por arquivo</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">Enviar Arquivo</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG ou PNG (até 20MB)
                      </p>
                    </div>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">Tirar Foto</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fotografar documento direto
                      </p>
                    </div>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => navigate('/cofre/criar-manual')}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Edit3 className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">Adicionar Manualmente</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Preencher informações sem arquivo
                      </p>
                    </div>
                  </div>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-6 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">{files[0].name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>✨ <strong>Extração e salvamento automáticos:</strong></p>
            <p>IA identifica exames, receitas, vacinas e consultas</p>
            <p>Dados são preenchidos e salvos automaticamente</p>
          </div>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="Cofre de documentos" />
      <Navigation />
    </div>
  );
}
