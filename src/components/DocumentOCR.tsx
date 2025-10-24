import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OCRResult {
  title: string;
  issued_at?: string;
  expires_at?: string;
  provider?: string;
  category?: string;
  extracted_values?: Array<{
    parameter: string;
    value: number;
    unit: string;
    reference_range?: string;
  }>;
}

interface DocumentOCRProps {
  onResult: (result: OCRResult) => void;
}

export default function DocumentOCR({ onResult }: DocumentOCRProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!preview) return;

    setProcessing(true);
    setError(null);
    toast.loading("Analisando documento com IA...", { id: "doc-ocr" });

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("extract-document", {
        body: { image: preview },
      });

      if (invokeError) throw invokeError;

      if (data?.title) {
        toast.dismiss("doc-ocr");
        toast.success("✓ Documento identificado com sucesso!", { duration: 3000 });
        
        onResult({
          title: data.title,
          issued_at: data.issued_at,
          expires_at: data.expires_at,
          provider: data.provider,
          category: data.category || "outro",
          extracted_values: data.extracted_values || [],
        });
        
        clearImage();
      } else {
        toast.dismiss("doc-ocr");
        setError("Não foi possível identificar informações no documento");
        toast.error("Não foi possível identificar o documento");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.dismiss("doc-ocr");
      setError("Erro ao processar documento. Tente novamente.");
      toast.error("Erro ao processar imagem");
    } finally {
      setProcessing(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-primary/20">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          📄 Capturar documento com IA
        </Label>
        <p className="text-sm text-muted-foreground">
          Tire uma foto ou envie uma imagem do documento para preencher automaticamente os dados
        </p>
      </div>

      {!preview ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="h-28 flex-col gap-2 hover:bg-primary/10 hover:border-primary transition-all"
          >
            <Camera className="h-7 w-7 text-primary" />
            <span className="text-sm font-medium">Câmera</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-28 flex-col gap-2 hover:bg-primary/10 hover:border-primary transition-all"
          >
            <Upload className="h-7 w-7 text-primary" />
            <span className="text-sm font-medium">Galeria</span>
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
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg">
            <img
              src={preview}
              alt="Preview do documento"
              className="w-full h-auto max-h-64 object-contain bg-muted"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearImage}
              disabled={processing}
              className="absolute top-2 right-2 bg-background/90 hover:bg-background shadow-md"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {processing && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Analisando documento...</p>
                  <p className="text-sm text-muted-foreground">
                    Extraindo informações com Inteligência Artificial
                  </p>
                </div>
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </Card>
          )}

          {!processing && !error && (
            <Button
              type="button"
              onClick={processImage}
              className="w-full h-12 text-base font-semibold"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Extrair informações do documento
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
