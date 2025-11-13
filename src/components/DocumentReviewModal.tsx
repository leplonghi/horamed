import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtractedData {
  title?: string;
  category?: string;
  issued_at?: string;
  expires_at?: string;
  provider?: string;
  confidence_score?: number;
  extracted_values?: Array<{
    parameter: string;
    value: number | string;
    unit?: string;
    reference_range?: string;
  }>;
  // Específicos por tipo
  prescriptions?: Array<{
    drug_name: string;
    dose?: string;
    frequency?: string;
    duration_days?: number;
  }>;
  vaccine_name?: string;
  dose_number?: string;
  next_dose_date?: string;
  doctor_name?: string;
  specialty?: string;
  notes?: string;
}

interface DocumentReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedData;
  imagePreview?: string;
  onConfirm: (reviewedData: ExtractedData) => void;
  onSkip: () => void;
}

export default function DocumentReviewModal({
  open,
  onOpenChange,
  extractedData,
  imagePreview,
  onConfirm,
  onSkip,
}: DocumentReviewModalProps) {
  const [formData, setFormData] = useState<ExtractedData>(extractedData);

  const confidenceScore = extractedData.confidence_score || 0;
  const isLowConfidence = confidenceScore < 0.7;

  const updateField = (field: keyof ExtractedData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    onConfirm(formData);
    onOpenChange(false);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "receita":
        return "💊";
      case "exame":
        return "🧪";
      case "vacinacao":
        return "💉";
      case "consulta":
        return "🩺";
      default:
        return "📋";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(extractedData.category)}</span>
            Revisar Dados Extraídos
          </DialogTitle>
          <DialogDescription>
            {isLowConfidence ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Confiança baixa ({Math.round(confidenceScore * 100)}%). Revise os campos destacados.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mt-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Extração com boa confiança ({Math.round(confidenceScore * 100)}%). Revise e confirme.
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 px-6 pb-6">
          {/* Preview à esquerda */}
          {imagePreview && (
            <div className="md:w-1/2">
              <Label className="mb-2 block">Preview do Documento</Label>
              <ScrollArea className="h-[500px] border rounded-lg">
                <img
                  src={imagePreview}
                  alt="Document preview"
                  className="w-full h-auto"
                />
              </ScrollArea>
            </div>
          )}

          {/* Campos extraídos à direita */}
          <div className="md:w-1/2">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="flex items-center gap-2">
                    Título *
                    {isLowConfidence && <Badge variant="outline" className="text-[10px]">Revisar</Badge>}
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className={isLowConfidence ? "border-amber-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(v) => updateField("category", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exame">🧪 Exames</SelectItem>
                      <SelectItem value="receita">💊 Receitas</SelectItem>
                      <SelectItem value="vacinacao">💉 Vacinas</SelectItem>
                      <SelectItem value="consulta">🩺 Consultas</SelectItem>
                      <SelectItem value="outro">📋 Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issued_at">Data de Emissão</Label>
                    <Input
                      id="issued_at"
                      type="date"
                      value={formData.issued_at || ""}
                      onChange={(e) => updateField("issued_at", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Validade</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at || ""}
                      onChange={(e) => updateField("expires_at", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider">Prestador (Lab/Clínica)</Label>
                  <Input
                    id="provider"
                    value={formData.provider || ""}
                    onChange={(e) => updateField("provider", e.target.value)}
                    placeholder="Ex: Laboratório Sabin, Hospital Albert Einstein"
                  />
                </div>

                {/* Campos específicos por tipo */}
                {formData.category === "exame" && formData.extracted_values && formData.extracted_values.length > 0 && (
                  <div>
                    <Label>Valores Extraídos ({formData.extracted_values.length})</Label>
                    <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                      {formData.extracted_values.map((val, idx) => (
                        <div key={idx} className="text-xs bg-muted p-2 rounded">
                          <strong>{val.parameter}:</strong> {val.value} {val.unit}
                          {val.reference_range && (
                            <span className="text-muted-foreground ml-2">
                              (Ref: {val.reference_range})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.category === "receita" && formData.prescriptions && formData.prescriptions.length > 0 && (
                  <div>
                    <Label>Medicamentos Prescritos ({formData.prescriptions.length})</Label>
                    <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                      {formData.prescriptions.map((med, idx) => (
                        <div key={idx} className="text-xs bg-muted p-2 rounded">
                          <strong>{med.drug_name}</strong>
                          {med.dose && <div>Dose: {med.dose}</div>}
                          {med.frequency && <div>Frequência: {med.frequency}</div>}
                          {med.duration_days && <div>Duração: {med.duration_days} dias</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.category === "vacinacao" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="vaccine_name">Nome da Vacina</Label>
                      <Input
                        id="vaccine_name"
                        value={formData.vaccine_name || ""}
                        onChange={(e) => updateField("vaccine_name", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dose_number">Dose</Label>
                        <Input
                          id="dose_number"
                          value={formData.dose_number || ""}
                          onChange={(e) => updateField("dose_number", e.target.value)}
                          placeholder="1ª, 2ª, Reforço"
                        />
                      </div>
                      <div>
                        <Label htmlFor="next_dose_date">Próxima Dose</Label>
                        <Input
                          id="next_dose_date"
                          type="date"
                          value={formData.next_dose_date || ""}
                          onChange={(e) => updateField("next_dose_date", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === "consulta" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="doctor_name">Médico</Label>
                      <Input
                        id="doctor_name"
                        value={formData.doctor_name || ""}
                        onChange={(e) => updateField("doctor_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialty">Especialidade</Label>
                      <Input
                        id="specialty"
                        value={formData.specialty || ""}
                        onChange={(e) => updateField("specialty", e.target.value)}
                        placeholder="Ex: Cardiologia, Dermatologia"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={3}
                    placeholder="Adicione notas ou observações sobre este documento"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 flex gap-2">
          <Button variant="outline" onClick={onSkip}>
            Pular Revisão
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
