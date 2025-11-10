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
import { Sparkles, Check, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
}

interface ExtractedDataPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  extractedData: ExtractedData;
  onConfirm: (data: ExtractedData) => void;
  onSkip: () => void;
}

export default function ExtractedDataPreviewModal({
  open,
  onOpenChange,
  fileName,
  extractedData,
  onConfirm,
  onSkip,
}: ExtractedDataPreviewModalProps) {
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);

  useEffect(() => {
    setEditedData(extractedData);
  }, [extractedData]);

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
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Dados Extraídos pela IA</DialogTitle>
          </div>
          <DialogDescription>
            Revise e ajuste as informações extraídas antes de salvar
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

          {/* AI Confidence Notice */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Edit3 className="h-3 w-3" />
              Todos os campos podem ser editados. Revise as informações antes de confirmar.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Pular Extração
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Check className="h-4 w-4" />
            Confirmar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
