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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentReviewScreenProps {
  documentId: string;
  extractedData: any;
  onComplete: () => void;
}

export default function DocumentReviewScreen({ documentId, extractedData, onComplete }: DocumentReviewScreenProps) {
  const [title, setTitle] = useState(extractedData.title || "Documento de Saúde");
  const [date, setDate] = useState(extractedData.issued_at || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(extractedData.notes || "");
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!title) {
      toast.error("Título é obrigatório");
      return;
    }

    setProcessing(true);
    toast.loading("Salvando documento...", { id: "save-doc" });

    try {
      // Update document
      await supabase
        .from('documentos_saude')
        .update({
          title,
          issued_at: date,
          notes,
          status_extraction: 'reviewed',
        })
        .eq('id', documentId);

      toast.dismiss("save-doc");
      toast.success("✓ Documento salvo na Carteira de Saúde!");

      navigate(`/carteira/${documentId}`);

    } catch (error: any) {
      console.error('Erro ao salvar documento:', error);
      toast.dismiss("save-doc");
      toast.error("Erro ao salvar documento. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-page">Revise seu documento</h1>
          <p className="text-description">
            Confirme os dados antes de salvar
          </p>
        </div>

        {/* Document Info */}
        {(extractedData.provider || extractedData.issued_at) && (
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
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite um título para o documento"
              />
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione qualquer observação importante"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          className="w-full h-12"
          disabled={processing || !title}
        >
          <Check className="mr-2 h-5 w-5" />
          Salvar na Carteira de Saúde
        </Button>
      </div>
    </div>
  );
}
