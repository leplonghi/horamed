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

  const updateExamValue = (idx: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      extracted_values: prev.extracted_values?.map((val, i) =>
        i === idx ? { ...val, [field]: value } : val
      ),
    }));
  };

  const updatePrescription = (idx: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions?.map((med, i) =>
        i === idx ? { ...med, [field]: value } : med
      ),
    }));
  };

  const getFieldConfidenceClass = (hasValue: boolean) => {
    if (!hasValue && isLowConfidence) {
      return "border-red-400 bg-red-50 dark:bg-red-950/20";
    }
    if (isLowConfidence) {
      return "border-amber-400 bg-amber-50 dark:bg-amber-950/20";
    }
    return "";
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
                    {!formData.title && isLowConfidence && (
                      <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                    )}
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className={getFieldConfidenceClass(!!formData.title)}
                    placeholder="Nome do documento"
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
                    <Label htmlFor="issued_at" className="flex items-center gap-2">
                      Data de Emissão
                      {!formData.issued_at && isLowConfidence && (
                        <Badge variant="outline" className="text-[10px]">Revisar</Badge>
                      )}
                    </Label>
                    <Input
                      id="issued_at"
                      type="date"
                      value={formData.issued_at || ""}
                      onChange={(e) => updateField("issued_at", e.target.value)}
                      className={getFieldConfidenceClass(!!formData.issued_at)}
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
                  <Label htmlFor="provider" className="flex items-center gap-2">
                    Prestador (Lab/Clínica)
                    {!formData.provider && isLowConfidence && (
                      <Badge variant="outline" className="text-[10px]">Revisar</Badge>
                    )}
                  </Label>
                  <Input
                    id="provider"
                    value={formData.provider || ""}
                    onChange={(e) => updateField("provider", e.target.value)}
                    className={getFieldConfidenceClass(!!formData.provider)}
                    placeholder="Ex: Laboratório Sabin, Hospital Albert Einstein"
                  />
                </div>

                {/* Campos específicos por tipo */}
                {formData.category === "exame" && formData.extracted_values && formData.extracted_values.length > 0 && (
                  <div>
                    <Label className="flex items-center gap-2">
                      Valores Extraídos ({formData.extracted_values.length})
                      {isLowConfidence && (
                        <Badge variant="outline" className="text-[10px]">Revisar valores</Badge>
                      )}
                    </Label>
                    <ScrollArea className="mt-2 max-h-[300px] border rounded-md p-2">
                      <div className="space-y-3">
                        {formData.extracted_values.map((val, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                            <div>
                              <Label htmlFor={`param-${idx}`} className="text-xs">Parâmetro</Label>
                              <Input
                                id={`param-${idx}`}
                                value={val.parameter}
                                onChange={(e) => updateExamValue(idx, "parameter", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`value-${idx}`} className="text-xs">Valor</Label>
                              <Input
                                id={`value-${idx}`}
                                value={val.value}
                                onChange={(e) => updateExamValue(idx, "value", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`unit-${idx}`} className="text-xs">Unidade</Label>
                              <Input
                                id={`unit-${idx}`}
                                value={val.unit || ""}
                                onChange={(e) => updateExamValue(idx, "unit", e.target.value)}
                                className="h-8 text-xs"
                                placeholder="g/dL, mg/L..."
                              />
                            </div>
                            <div>
                              <Label htmlFor={`ref-${idx}`} className="text-xs">Ref.</Label>
                              <Input
                                id={`ref-${idx}`}
                                value={val.reference_range || ""}
                                onChange={(e) => updateExamValue(idx, "reference_range", e.target.value)}
                                className="h-8 text-xs"
                                placeholder="12-16"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {formData.category === "receita" && formData.prescriptions && formData.prescriptions.length > 0 && (
                  <div>
                    <Label className="flex items-center gap-2">
                      Medicamentos Prescritos ({formData.prescriptions.length})
                      {isLowConfidence && (
                        <Badge variant="outline" className="text-[10px]">Revisar medicamentos</Badge>
                      )}
                    </Label>
                    <ScrollArea className="mt-2 max-h-[300px] border rounded-md p-2">
                      <div className="space-y-3">
                        {formData.prescriptions.map((med, idx) => (
                          <div key={idx} className="space-y-2 p-3 bg-muted rounded-lg">
                            <div>
                              <Label htmlFor={`drug-${idx}`} className="text-xs">Medicamento</Label>
                              <Input
                                id={`drug-${idx}`}
                                value={med.drug_name}
                                onChange={(e) => updatePrescription(idx, "drug_name", e.target.value)}
                                className="h-8 text-xs font-medium"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label htmlFor={`dose-${idx}`} className="text-xs">Dose</Label>
                                <Input
                                  id={`dose-${idx}`}
                                  value={med.dose || ""}
                                  onChange={(e) => updatePrescription(idx, "dose", e.target.value)}
                                  className="h-8 text-xs"
                                  placeholder="500mg"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`freq-${idx}`} className="text-xs">Frequência</Label>
                                <Input
                                  id={`freq-${idx}`}
                                  value={med.frequency || ""}
                                  onChange={(e) => updatePrescription(idx, "frequency", e.target.value)}
                                  className="h-8 text-xs"
                                  placeholder="8/8h"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`days-${idx}`} className="text-xs">Dias</Label>
                                <Input
                                  id={`days-${idx}`}
                                  type="number"
                                  value={med.duration_days || ""}
                                  onChange={(e) => updatePrescription(idx, "duration_days", parseInt(e.target.value))}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {formData.category === "vacinacao" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="vaccine_name" className="flex items-center gap-2">
                        Nome da Vacina
                        {!formData.vaccine_name && isLowConfidence && (
                          <Badge variant="outline" className="text-[10px]">Revisar</Badge>
                        )}
                      </Label>
                      <Input
                        id="vaccine_name"
                        value={formData.vaccine_name || ""}
                        onChange={(e) => updateField("vaccine_name", e.target.value)}
                        className={getFieldConfidenceClass(!!formData.vaccine_name)}
                        placeholder="COVID-19, Influenza..."
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
                      <Label htmlFor="doctor_name" className="flex items-center gap-2">
                        Médico
                        {!formData.doctor_name && isLowConfidence && (
                          <Badge variant="outline" className="text-[10px]">Revisar</Badge>
                        )}
                      </Label>
                      <Input
                        id="doctor_name"
                        value={formData.doctor_name || ""}
                        onChange={(e) => updateField("doctor_name", e.target.value)}
                        className={getFieldConfidenceClass(!!formData.doctor_name)}
                        placeholder="Dr. João Silva"
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
