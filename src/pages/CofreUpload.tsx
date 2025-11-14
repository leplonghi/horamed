import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowLeft, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";
import { convertPDFToImages, isPDF } from "@/lib/pdfProcessor";
import DocumentReviewModal from "@/components/DocumentReviewModal";

export default function CofreUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string>("");

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

  const extractFromImage = async (imageOrImages: string | string[]) => {
    let attempts = 0;
    let success = false;
    
    while (attempts < 3 && !success) {
      try {
        const { data, error } = await supabase.functions.invoke('extract-document', {
          body: { image: imageOrImages }
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
        toast.loading("Analisando documento...", { id: "extract" });
        
        try {
          if (isPDF(firstFile)) {
            console.log('Processando PDF completo...');
            
            toast.dismiss("extract");
            toast.loading("Convertendo PDF em imagens de alta qualidade...", { id: "extract" });
            
            // Convert PDF to images (max 5 pages for performance)
            const pages = await convertPDFToImages(firstFile, 5);
            
            if (pages.length === 0) {
              throw new Error("Não foi possível processar o PDF");
            }
            
            toast.dismiss("extract");
            toast.loading(`Analisando ${pages.length} página(s) com IA avançada...`, { id: "extract" });
            
            // Send all pages at once to AI
            const pageImages = pages.map(p => p.imageData);
            const data = await extractFromImage(pageImages);
            
            if (data) {
              toast.dismiss("extract");
              setExtractedData(data);
              setCurrentImagePreview(pages[0].imageData);
              setShowReviewModal(true);
            } else {
              throw new Error("Não foi possível extrair dados do PDF");
            }
          } else {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = reader.result as string;
              
              try {
                const data = await extractFromImage(base64);
                
                if (data) {
                  toast.dismiss("extract");
                  setExtractedData(data);
                  setCurrentImagePreview(base64);
                  setShowReviewModal(true);
                }
              } catch (err: any) {
                throw err;
              }
            };
            reader.readAsDataURL(firstFile);
          }
        } catch (error: any) {
          console.error('Erro ao extrair informações:', error);
          toast.dismiss("extract");
          
          let errorMessage = "Não conseguimos extrair as informações. ";
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
        } finally {
          setIsExtracting(false);
        }
      }
    }
  };

  const handleReviewConfirm = async (reviewedData: any) => {
    if (files.length === 0) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    setUploading(true);

    try {
      const file = files[0];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cofre-saude')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: categoriaData } = await supabase
        .from('categorias_saude')
        .select('id')
        .eq('slug', reviewedData.category)
        .single();

      const { error: insertError } = await supabase
        .from('documentos_saude')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id,
          categoria_id: categoriaData?.id,
          title: reviewedData.title,
          file_path: filePath,
          mime_type: file.type,
          issued_at: reviewedData.issued_at || null,
          expires_at: reviewedData.expires_at || null,
          provider: reviewedData.provider || null,
          confidence_score: reviewedData.confidence_score || 0,
          status_extraction: reviewedData.confidence_score >= 0.7 ? 'confirmed' : 'pending_review',
          meta: {
            extracted_values: reviewedData.extracted_values,
            prescriptions: reviewedData.prescriptions,
            vaccine_name: reviewedData.vaccine_name,
            dose_number: reviewedData.dose_number,
            doctor_name: reviewedData.doctor_name,
            specialty: reviewedData.specialty,
          },
          notes: reviewedData.notes,
        });

      if (insertError) throw insertError;

      toast.success("✓ Documento salvo com sucesso!");
      navigate("/cofre");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar documento");
    } finally {
      setUploading(false);
    }
  };

  const handleReviewSkip = () => {
    toast.info("Documento salvo sem revisão");
    setShowReviewModal(false);
    // Could offer manual form here
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-6">
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
            <p>✨ <strong>Extração automática inteligente:</strong></p>
            <p>Exames, receitas, vacinas e consultas são identificados automaticamente</p>
            <p>Você poderá revisar os dados antes de salvar</p>
          </div>
        </div>
      </div>

      <DocumentReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        extractedData={extractedData || {}}
        imagePreview={currentImagePreview}
        onConfirm={handleReviewConfirm}
        onSkip={handleReviewSkip}
      />

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="Cofre de documentos" />
      <Navigation />
    </div>
  );
}
