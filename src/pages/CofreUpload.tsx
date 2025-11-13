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
import { Progress } from "@/components/ui/progress";
import DocumentReviewModal from "@/components/DocumentReviewModal";

export default function CofreUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string>("");

  const { activeProfile } = useUserProfiles();

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
        setIsExtracting(true);
        toast.loading("Analisando documento...", { id: "extract" });
        
        try {
          if (isPDF(firstFile)) {
            console.log('Processando PDF multipágina...');
            
            const pages = await convertPDFToImages(firstFile, 5);
            setTotalPages(pages.length);
            
            toast.dismiss("extract");
            toast.loading(`Analisando página 1 de ${pages.length}...`, { id: "extract" });
            
            const allData: any[] = [];
            
            for (let i = 0; i < pages.length; i++) {
              setCurrentPage(i + 1);
              setExtractionProgress(((i + 1) / pages.length) * 100);
              
              toast.dismiss("extract");
              toast.loading(`Analisando página ${i + 1} de ${pages.length}...`, { id: "extract" });
              
              const pageData = await extractFromImage(pages[i].imageData);
              if (pageData) {
                allData.push(pageData);
              }
            }
            
            const firstValidData = allData.find(d => d.title);
            if (firstValidData) {
              toast.dismiss("extract");
              setExtractedData(firstValidData);
              setCurrentImagePreview(pages[0].imageData);
              setShowReviewModal(true);
            } else {
              toast.dismiss("extract");
              toast.warning("Não foi possível extrair informações do PDF.", { duration: 5000 });
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
          
          let errorMessage = "Não conseguimos ler este documento. ";
          
          if (error.message?.includes('Invalid') || error.message?.includes('formato')) {
            errorMessage = "Formato de arquivo inválido. Use PDF, PNG ou JPEG.";
          } else if (error.message?.includes('large') || error.message?.includes('size')) {
            errorMessage = "Arquivo muito grande. Envie um arquivo menor que 20MB.";
          } else if (error.message?.includes('nítida') || error.message?.includes('processar')) {
            errorMessage = "Qualidade baixa. Use imagens mais nítidas ou PDFs com texto selecionável.";
          } else {
            errorMessage += "Tente novamente ou envie outro arquivo.";
          }
          
          toast.error(errorMessage, { duration: 6000 });
        } finally {
          setIsExtracting(false);
          setExtractionProgress(0);
          setCurrentPage(0);
          setTotalPages(0);
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
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">
                    {totalPages > 0 
                      ? `Analisando página ${currentPage} de ${totalPages}...` 
                      : "Extraindo informações automaticamente..."}
                  </p>
                  {totalPages > 0 && (
                    <>
                      <Progress value={extractionProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        PDFs com múltiplas páginas podem levar alguns segundos
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
