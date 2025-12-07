import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExamReviewScreenProps {
  documentId: string;
  extractedData: any;
  onComplete: () => void;
}

export default function ExamReviewScreen({ documentId, extractedData, onComplete }: ExamReviewScreenProps) {
  const [examType, setExamType] = useState(extractedData.exam_type || "Exame de sangue");
  const [examDate, setExamDate] = useState(extractedData.issued_at || new Date().toISOString().split('T')[0]);
  const [lab, setLab] = useState(extractedData.provider || "");
  const [notes, setNotes] = useState(extractedData.notes || "");
  const [processing, setProcessing] = useState(false);

  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();

  const handleSave = async () => {
    setProcessing(true);
    toast.loading("Salvando exame...", { id: "save-exam" });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Update document
      await supabase
        .from('documentos_saude')
        .update({
          status_extraction: 'reviewed',
          meta: {
            ...extractedData,
            exam_type: examType,
            provider: lab,
            notes: notes,
          }
        })
        .eq('id', documentId);

      // Create exam record
      const { data: exame } = await supabase
        .from('exames_laboratoriais')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id,
          documento_id: documentId,
          data_exame: examDate,
          laboratorio: lab || null,
        })
        .select()
        .single();

      if (exame && extractedData.extracted_values?.length > 0) {
        // Insert exam values
        const valores = extractedData.extracted_values.map((val: any) => ({
          exame_id: exame.id,
          parametro: val.parameter,
          valor: val.value ? parseFloat(val.value) : null,
          valor_texto: val.value?.toString() || null,
          unidade: val.unit || null,
          referencia_texto: val.reference_range || null,
        }));

        await supabase.from('valores_exames').insert(valores);
      }

      toast.dismiss("save-exam");
      toast.success("✓ Exame salvo na Carteira de Saúde!");

      navigate(`/carteira/${documentId}`);

    } catch (error: any) {
      console.error('Erro ao salvar exame:', error);
      toast.dismiss("save-exam");
      toast.error("Erro ao salvar exame. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-page">Revise seu exame</h1>
          <p className="text-description">
            Confirme os dados do exame antes de salvar
          </p>
        </div>

        {/* Document Info */}
        <Card>
          <CardContent className="p-4 space-y-2">
            {extractedData.provider && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">🏥</span>
                <span className="text-sm">{extractedData.provider}</span>
              </div>
            )}
            {extractedData.issued_at && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">📅</span>
                <span className="text-sm">
                  {format(new Date(extractedData.issued_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do exame</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de exame</Label>
              <Input
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                placeholder="Ex: Hemograma completo"
              />
            </div>

            <div className="space-y-2">
              <Label>Data do exame</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Laboratório</Label>
              <Input
                value={lab}
                onChange={(e) => setLab(e.target.value)}
                placeholder="Nome do laboratório"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione qualquer observação importante"
                rows={3}
              />
            </div>

            {extractedData.extracted_values?.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium">Valores detectados: {extractedData.extracted_values.length} parâmetro(s)</Label>
                <p className="text-xs text-muted-foreground">
                  Os valores do exame foram salvos e podem ser consultados na página de detalhes
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          className="w-full h-12"
          disabled={processing || !examType}
        >
          <Check className="mr-2 h-5 w-5" />
          Salvar na Carteira de Saúde
        </Button>
      </div>
    </div>
  );
}
