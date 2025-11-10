import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Check, Edit3, Pill, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ExtractedData {
  title?: string;
  category?: string;
  issued_at?: string;
  expires_at?: string;
  provider?: string;
  doctor?: string;
  specialty?: string;
  exam_type?: string;
  dose?: string;
  next_dose?: string;
  // Prescription-specific fields
  prescriber_name?: string;
  prescriber_registration?: string;
  patient_name?: string;
  instructions?: string;
  prescriptions?: Array<{
    name_commercial: string;
    generic_name?: string;
    dose_text: string;
    form?: string;
    frequency?: string;
    duration_days?: number;
    instructions?: string;
  }>;
  // Legacy format (for backward compatibility)
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration_days?: string;
    total_doses?: string;
    start_date?: string;
  }>;
}

interface ExtractedDataPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  extractedData: ExtractedData;
  onConfirm: (data: ExtractedData) => void;
  onSkip: () => void;
  isCached?: boolean;
  confidence?: number;
  status?: string;
}

export default function ExtractedDataPreviewModal({
  open,
  onOpenChange,
  fileName,
  extractedData,
  onConfirm,
  onSkip,
  isCached = false,
  confidence = 0,
  status = 'pending_review',
}: ExtractedDataPreviewModalProps) {
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);

  useEffect(() => {
    setEditedData(extractedData);
  }, [extractedData]);

  // Helper to check if field has low confidence or is missing
  const isFieldLowConfidence = (fieldValue: any) => {
    return !fieldValue || (confidence < 0.7);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    if (editedData.category === 'receita') {
      return editedData.prescriber_name && 
             editedData.patient_name && 
             editedData.issued_at &&
             (editedData.prescriptions?.length ?? 0) > 0;
    }
    return editedData.title && editedData.category;
  };

  const handleConfirm = () => {
    onConfirm(editedData);
    onOpenChange(false);
  };

  const getCategoryLabel = (slug?: string) => {
    const labels: Record<string, string> = {
      exame: "Exame Laboratorial",
      receita: "Receita Médica",
      vacinacao: "Vacinação",
      consulta: "Consulta Médica",
      outro: "Outro Documento",
    };
    return slug ? labels[slug] || slug : "Não identificado";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Dados Extraídos pela IA</DialogTitle>
            {isCached && (
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                Cache
              </Badge>
            )}
            {confidence > 0 && (
              <Badge 
                variant={confidence >= 0.7 ? "default" : "destructive"}
                className="gap-1"
              >
                Confiança: {(confidence * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
          <DialogDescription>
            {confidence < 0.7 && (
              <span className="text-yellow-600 dark:text-yellow-500 font-medium">
                ⚠️ Baixa confiança na extração. Por favor, revise cuidadosamente todos os campos destacados.
              </span>
            )}
            {confidence >= 0.7 && (
              <>Revise e ajuste as informações extraídas antes de salvar{isCached && " • Resultado recuperado instantaneamente do cache"}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Arquivo</p>
            <p className="text-sm truncate">{fileName}</p>
          </div>

          {/* Extracted Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="preview-title" className="flex items-center gap-2">
                Título do Documento
                <Badge variant="secondary" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Extraído
                </Badge>
              </Label>
              <Input
                id="preview-title"
                value={editedData.title || ""}
                onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                placeholder="Título não identificado"
              />
            </div>

            <div>
              <Label htmlFor="preview-category" className="flex items-center gap-2">
                Categoria
                {extractedData.category && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Extraído
                  </Badge>
                )}
              </Label>
              <Select
                value={editedData.category || ""}
                onValueChange={(value) => setEditedData({ ...editedData, category: value })}
              >
                <SelectTrigger id="preview-category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exame">Exame Laboratorial</SelectItem>
                  <SelectItem value="receita">Receita Médica</SelectItem>
                  <SelectItem value="vacinacao">Vacinação</SelectItem>
                  <SelectItem value="consulta">Consulta Médica</SelectItem>
                  <SelectItem value="outro">Outro Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preview-issued" className="flex items-center gap-2">
                  Data de Emissão
                  {extractedData.issued_at && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Extraído
                    </Badge>
                  )}
                </Label>
                <Input
                  id="preview-issued"
                  type="date"
                  value={editedData.issued_at || ""}
                  onChange={(e) => setEditedData({ ...editedData, issued_at: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="preview-expires" className="flex items-center gap-2">
                  Data de Validade
                  {extractedData.expires_at && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Extraído
                    </Badge>
                  )}
                </Label>
                <Input
                  id="preview-expires"
                  type="date"
                  value={editedData.expires_at || ""}
                  onChange={(e) => setEditedData({ ...editedData, expires_at: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preview-provider" className="flex items-center gap-2">
                Prestador/Laboratório
                {extractedData.provider && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Extraído
                  </Badge>
                )}
              </Label>
              <Input
                id="preview-provider"
                value={editedData.provider || ""}
                onChange={(e) => setEditedData({ ...editedData, provider: e.target.value })}
                placeholder="Nome do prestador"
              />
            </div>

            {/* Category-specific fields */}
            {/* Prescription-specific fields */}
            {editedData.category === "receita" && (
              <>
                <div>
                  <Label htmlFor="preview-prescriber" className="flex items-center gap-2">
                    Médico Prescritor
                    {extractedData.prescriber_name && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="preview-prescriber"
                    value={editedData.prescriber_name || ""}
                    onChange={(e) => setEditedData({ ...editedData, prescriber_name: e.target.value })}
                    placeholder="Nome do médico"
                    required
                    className={!extractedData.prescriber_name || confidence < 0.7 ? "border-yellow-500 border-2" : ""}
                  />
                  {(!extractedData.prescriber_name || confidence < 0.7) && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      ⚠️ Campo obrigatório - confirme o nome do médico
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="preview-crm" className="flex items-center gap-2">
                    CRM/Registro
                    {extractedData.prescriber_registration && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="preview-crm"
                    value={editedData.prescriber_registration || ""}
                    onChange={(e) => setEditedData({ ...editedData, prescriber_registration: e.target.value })}
                    placeholder="Ex: CRM 12345/SP"
                    className={!extractedData.prescriber_registration || confidence < 0.7 ? "border-yellow-500 border-2" : ""}
                  />
                  {!extractedData.prescriber_registration && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      ⚠️ CRM não encontrado - adicione manualmente
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="preview-patient" className="flex items-center gap-2">
                    Paciente
                    {extractedData.patient_name && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="preview-patient"
                    value={editedData.patient_name || ""}
                    onChange={(e) => setEditedData({ ...editedData, patient_name: e.target.value })}
                    placeholder="Nome do paciente"
                    required
                    className={!extractedData.patient_name || confidence < 0.7 ? "border-yellow-500 border-2" : ""}
                  />
                  {(!extractedData.patient_name || confidence < 0.7) && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      ⚠️ Campo obrigatório - confirme o nome do paciente
                    </p>
                  )}
                </div>
                {extractedData.instructions && (
                  <div>
                    <Label htmlFor="preview-instructions" className="flex items-center gap-2">
                      Instruções Gerais
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    </Label>
                    <Input
                      id="preview-instructions"
                      value={editedData.instructions || ""}
                      onChange={(e) => setEditedData({ ...editedData, instructions: e.target.value })}
                      placeholder="Instruções do médico"
                    />
                  </div>
                )}
              </>
            )}

            {editedData.category === "consulta" && (
              <>
                <div>
                  <Label htmlFor="preview-doctor" className="flex items-center gap-2">
                    Médico
                    {extractedData.doctor && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="preview-doctor"
                    value={editedData.doctor || ""}
                    onChange={(e) => setEditedData({ ...editedData, doctor: e.target.value })}
                    placeholder="Nome do médico"
                  />
                </div>
                <div>
                  <Label htmlFor="preview-specialty" className="flex items-center gap-2">
                    Especialidade
                    {extractedData.specialty && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="preview-specialty"
                    value={editedData.specialty || ""}
                    onChange={(e) => setEditedData({ ...editedData, specialty: e.target.value })}
                    placeholder="Ex: Cardiologia"
                  />
                </div>
              </>
            )}

            {editedData.category === "exame" && extractedData.exam_type && (
              <div>
                <Label htmlFor="preview-exam-type" className="flex items-center gap-2">
                  Tipo de Exame
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Extraído
                  </Badge>
                </Label>
                <Input
                  id="preview-exam-type"
                  value={editedData.exam_type || ""}
                  onChange={(e) => setEditedData({ ...editedData, exam_type: e.target.value })}
                  placeholder="Tipo do exame"
                />
              </div>
            )}

            {editedData.category === "vacinacao" && (
              <>
                {extractedData.dose && (
                  <div>
                    <Label htmlFor="preview-dose" className="flex items-center gap-2">
                      Dose
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    </Label>
                    <Input
                      id="preview-dose"
                      value={editedData.dose || ""}
                      onChange={(e) => setEditedData({ ...editedData, dose: e.target.value })}
                      placeholder="Ex: 1ª dose"
                    />
                  </div>
                )}
                {extractedData.next_dose && (
                  <div>
                    <Label htmlFor="preview-next-dose" className="flex items-center gap-2">
                      Próxima Dose
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    </Label>
                    <Input
                      id="preview-next-dose"
                      type="date"
                      value={editedData.next_dose || ""}
                      onChange={(e) => setEditedData({ ...editedData, next_dose: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Medications/Prescriptions List */}
          {editedData.category === "receita" && (
            <>
              {/* New format (prescriptions) */}
              {editedData.prescriptions && editedData.prescriptions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">Medicamentos Prescritos</Label>
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      {editedData.prescriptions.length} {editedData.prescriptions.length === 1 ? 'medicamento' : 'medicamentos'}
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {editedData.prescriptions.map((med, idx) => (
                      <Card key={idx} className="p-3 bg-muted/50 border-l-2 border-l-primary">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm">{med.name_commercial}</p>
                            {med.form && (
                              <Badge variant="outline" className="text-[10px] shrink-0">{med.form}</Badge>
                            )}
                          </div>
                          {med.generic_name && (
                            <p className="text-xs text-muted-foreground italic">({med.generic_name})</p>
                          )}
                          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mt-2">
                            <div>
                              <span className="font-medium">Dose:</span> {med.dose_text}
                            </div>
                            {med.frequency && (
                              <div>
                                <span className="font-medium">Freq:</span> {med.frequency}
                              </div>
                            )}
                            {med.duration_days && (
                              <div>
                                <span className="font-medium">Duração:</span> {med.duration_days} dias
                              </div>
                            )}
                            {med.instructions && (
                              <div className="col-span-2 mt-1 pt-1 border-t border-border/50">
                                <span className="font-medium">Obs:</span> {med.instructions}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/90">
                      Estes medicamentos serão automaticamente adicionados ao seu sistema após confirmar
                    </p>
                  </div>
                </div>
              )}
              {/* Legacy format (medications) - backward compatibility */}
              {!editedData.prescriptions && editedData.medications && editedData.medications.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">Medicamentos Detectados</Label>
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      {editedData.medications.length} {editedData.medications.length === 1 ? 'medicamento' : 'medicamentos'}
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {editedData.medications.map((med, idx) => (
                      <Card key={idx} className="p-3 bg-muted/50">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{med.name}</p>
                          {med.dosage && (
                            <p className="text-xs text-muted-foreground">Dose: {med.dosage}</p>
                          )}
                          {med.frequency && (
                            <p className="text-xs text-muted-foreground">Frequência: {med.frequency}</p>
                          )}
                          {med.duration_days && (
                            <p className="text-xs text-muted-foreground">Duração: {med.duration_days} dias</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                  <p className="text-xs text-primary/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Estes medicamentos serão criados automaticamente após o upload
                  </p>
                </div>
              )}
            </>
          )}

          {/* Confidence and validation warnings */}
          <div className="space-y-2">
            {confidence && confidence < 0.7 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                  ⚠️ Confiança baixa na extração. Por favor, revise todos os campos cuidadosamente.
                </p>
              </div>
            )}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Edit3 className="h-3 w-3" />
                Todos os campos podem ser editados. Campos destacados em amarelo requerem atenção especial.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Pular Extração
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="gap-2"
            disabled={!isFormValid()}
          >
            <Check className="h-4 w-4" />
            Confirmar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
