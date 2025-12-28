import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FlaskConical, Syringe, FolderOpen, Camera, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isPDF, convertPDFToImages } from "@/lib/pdfProcessor";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useDocumentLimits } from "@/hooks/useDocumentLimits";
import PaywallDialog from "@/components/PaywallDialog";
import PrescriptionBulkAddWizard from "./PrescriptionBulkAddWizard";
import { useLanguage } from "@/contexts/LanguageContext";

type DocumentType = "receita" | "exame" | "vacina" | "outro";

interface AddHealthDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (documentId: string, type: DocumentType, extractedData: any) => void;
}

export default function AddHealthDocumentModal({ open, onOpenChange, onSuccess }: AddHealthDocumentModalProps) {
  const [step, setStep] = useState<"select-type" | "upload" | "processing">("select-type");
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [showPaywall, setShowPaywall] = useState(false);
  const [extractedMedications, setExtractedMedications] = useState<any[]>([]);
  const [showMedicationsWizard, setShowMedicationsWizard] = useState(false);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string>();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile } = useUserProfiles();
  const { canAddDocument, remaining, isPremium, isLoading: limitsLoading } = useDocumentLimits();
  const { t } = useLanguage();

  const documentTypes = [
    {
      id: "receita" as DocumentType,
      icon: FileText,
      emoji: "💊",
      label: t('document.prescription'),
      description: t('document.prescriptionDesc'),
      color: "from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border-blue-500/30"
    },
    {
      id: "exame" as DocumentType,
      icon: FlaskConical,
      emoji: "🧪",
      label: t('document.exam'),
      description: t('document.examDesc'),
      color: "from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border-green-500/30"
    },
    {
      id: "vacina" as DocumentType,
      icon: Syringe,
      emoji: "💉",
      label: t('document.vaccineDoc'),
      description: t('document.vaccineDocDesc'),
      color: "from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border-purple-500/30"
    },
    {
      id: "outro" as DocumentType,
      icon: FolderOpen,
      emoji: "📋",
      label: t('document.other'),
      description: t('document.otherDesc'),
      color: "from-gray-500/10 to-gray-600/10 hover:from-gray-500/20 hover:to-gray-600/20 border-gray-500/30"
    }
  ];

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    setStep("upload");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast.error(t('document.fileTooLarge'));
      return;
    }

    setCurrentFile(file);
    
    if (isPDF(file)) {
      setPreview("PDF_FILE");
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractFromImage = async (base64: string) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { data, error } = await supabase.functions.invoke("extract-document", {
          body: { image: base64 },
        });

        if (error) {
          if (attempts === 2) throw error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }

        if (data?.title) return data;
        break;
      } catch (err: any) {
        if (attempts === 2) throw err;
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    return null;
  };

  const handleProcess = async () => {
    if (!currentFile || !selectedType) return;

    // Check document limits for Free users
    if (!isPremium && !canAddDocument) {
      setShowPaywall(true);
      return;
    }

    setStep("processing");
    setProcessing(true);
    setProgress({ current: 0, total: 1, message: t('document.reading') });

    try {
      // Upload file first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.notAuthenticated'));

      setProgress({ current: 0, total: 3, message: t('document.uploading') });

      const fileExt = currentFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cofre-saude')
        .upload(filePath, currentFile);

      if (uploadError) throw uploadError;

      setProgress({ current: 1, total: 3, message: t('document.analyzing') });

      let extractedData;

      if (isPDF(currentFile)) {
        const pages = await convertPDFToImages(currentFile, 5);
        const allData: any[] = [];

        for (let i = 0; i < pages.length; i++) {
          setProgress({ 
            current: 1 + (i / pages.length), 
            total: 3, 
            message: t('document.readingPage', { current: String(i + 1), total: String(pages.length) })
          });
          
          const pageData = await extractFromImage(pages[i].imageData);
          if (pageData) allData.push(pageData);
        }

        extractedData = allData.find(d => d.title) || allData[0];
      } else {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(currentFile);
        });
        
        const base64 = await base64Promise;
        extractedData = await extractFromImage(base64);
      }

      if (!extractedData) {
        throw new Error(t('document.readError'));
      }

      setProgress({ current: 2, total: 3, message: t('document.saving') });

      // Get category ID
      const { data: categoriaData } = await supabase
        .from('categorias_saude')
        .select('id')
        .eq('slug', selectedType)
        .maybeSingle();

      // Save document
      const { data: newDoc, error: insertError } = await supabase
        .from('documentos_saude')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id,
          categoria_id: categoriaData?.id,
          title: extractedData.title,
          file_path: filePath,
          mime_type: currentFile.type,
          issued_at: extractedData.issued_at || null,
          expires_at: extractedData.expires_at || null,
          provider: extractedData.provider || null,
          confidence_score: extractedData.confidence_score || 0,
          status_extraction: 'pending_review',
          meta: extractedData,
          ocr_text: JSON.stringify(extractedData),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProgress({ current: 3, total: 3, message: t('document.done') });
      
      // If it's a prescription with medications, show wizard
      if (selectedType === "receita" && extractedData.prescriptions && extractedData.prescriptions.length > 0) {
        setExtractedMedications(extractedData.prescriptions);
        setCurrentPrescriptionId(newDoc.id);
        setShowMedicationsWizard(true);
        
        toast.success(
          t('document.savedWithMeds', { count: String(extractedData.prescriptions.length) }),
          { duration: 5000 }
        );
      } else {
        toast.success(t('document.savedReview'));
      }
      
      // Reset and close
      setTimeout(() => {
        onSuccess(newDoc.id, selectedType, extractedData);
        handleClose();
      }, 500);

    } catch (error: any) {
      console.error('Error processing:', error);
      
      // Show friendly error with fallback option
      toast.error(
        error.message?.includes('ler') || error.message?.includes('read')
          ? t('document.readError')
          : t('document.processError')
      );
      
      setStep("upload");
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("select-type");
    setSelectedType(null);
    setPreview(null);
    setCurrentFile(null);
    setProcessing(false);
    setProgress({ current: 0, total: 0, message: "" });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {step === "select-type" && t('document.whatToAdd')}
              {step === "upload" && `${t('document.add')} ${documentTypes.find(dt => dt.id === selectedType)?.label}`}
              {step === "processing" && t('document.processing')}
            </DialogTitle>
          </DialogHeader>

          {/* Document limit warning for Free users */}
          {!isPremium && step === "select-type" && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-muted-foreground">
                    {t('document.freeUsed', { used: String(5 - remaining) })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Step 1: Select Document Type */}
        {step === "select-type" && (
          <div className="grid grid-cols-2 gap-4 py-6">
            {documentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`p-6 cursor-pointer transition-all border-2 bg-gradient-to-br ${type.color}`}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <div className="text-center space-y-3">
                    <div className="text-5xl">{type.emoji}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Step 2: Upload File */}
        {step === "upload" && (
          <div className="space-y-6 py-6">
            {!preview ? (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-32 flex-col gap-2 text-base"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-8 w-8" />
                  <span>{t('document.takePhoto')}</span>
                  <span className="text-xs text-muted-foreground">{t('document.scanDoc')}</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-32 flex-col gap-2 text-base"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8" />
                  <span>{t('document.file')}</span>
                  <span className="text-xs text-muted-foreground">{t('document.fileDesc')}</span>
                </Button>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2">
                  {preview === "PDF_FILE" ? (
                    <div className="w-full h-64 bg-muted flex flex-col items-center justify-center gap-3">
                      <FileText className="w-16 h-16 text-primary" />
                      <div className="text-center">
                        <p className="font-medium">{t('document.pdfSelected')}</p>
                        <p className="text-sm text-muted-foreground">{currentFile?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain bg-muted"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPreview(null);
                      setCurrentFile(null);
                    }}
                    className="absolute top-2 right-2 bg-background/90"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleProcess}
                  className="w-full h-12 text-base"
                  disabled={processing}
                >
                  {t('document.continue')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <div className="py-12">
            <div className="flex flex-col items-center gap-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">{progress.message}</p>
                <p className="text-sm text-muted-foreground">
                  {t('document.waitMoment')}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Paywall Dialog */}
    <PaywallDialog
      open={showPaywall}
      onOpenChange={setShowPaywall}
      feature="documents"
    />

    {/* Prescription Medications Wizard */}
    <PrescriptionBulkAddWizard
      open={showMedicationsWizard}
      onOpenChange={setShowMedicationsWizard}
      medications={extractedMedications}
      prescriptionId={currentPrescriptionId}
      onComplete={() => {
        setExtractedMedications([]);
        setCurrentPrescriptionId(undefined);
      }}
    />
    </>
  );
}
