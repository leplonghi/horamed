import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fileToDataURL } from "@/lib/fileToDataURL";

interface OCRResult {
  name: string;
  dose?: string;
  category?: string;
  duration_days?: number;
  total_doses?: number;
  start_date?: string;
}

interface MedicationOCRProps {
  onResult: (result: OCRResult) => void;
}

export default function MedicationOCR({ onResult }: MedicationOCRProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataURL = await fileToDataURL(file);
        setPreview(dataURL);
      } catch (error: any) {
        toast.error(error.message ?? "Erro ao carregar imagem");
      }
    }
  };

  const processImage = async () => {
    if (!preview) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-medication", {
        body: { image: preview },
      });

      if (error) throw error;

      if (data?.name) {
        toast.success("Medicamento identificado! ✨");
        onResult({
          name: data.name,
          dose: data.dose,
          category: data.category || "medicamento",
          duration_days: data.duration_days,
          total_doses: data.total_doses,
          start_date: data.start_date,
        });
        clearImage();
      } else {
        toast.error("Não foi possível identificar o medicamento");
      }
    } catch (error: any) {
      console.error("Error processing image:", error);
      toast.error(error.message ?? "Erro ao processar imagem");
    } finally {
      setProcessing(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-accent/5 to-primary/5">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Capturar medicamento ou receita
        </Label>
        <p className="text-sm text-muted-foreground">
          Tire foto da caixa do medicamento ou da receita para preencher automaticamente
        </p>
      </div>

      {!preview ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="h-24 flex-col gap-2"
          >
            <Camera className="h-6 w-6" />
            <span className="text-sm">Câmera</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-24 flex-col gap-2"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Galeria</span>
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
          <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="button"
            onClick={processImage}
            disabled={processing}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {processing ? "Processando..." : "Extrair informações"}
          </Button>
        </div>
      )}
    </Card>
  );
}
