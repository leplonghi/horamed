import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Activity, FileText, Clock, AlertCircle } from 'lucide-react';
import { useConsultationCard } from '@/hooks/useConsultationCard';

interface CardData {
  medications: Array<{
    name: string;
    dose_text: string;
    category: string;
    notes: string;
  }>;
  adherence: number;
  documents: Array<{
    title: string;
    issued_at: string;
    expires_at: string | null;
  }>;
  expiresAt: string;
}

export default function ConsultationCardView() {
  const { token } = useParams<{ token: string }>();
  const { viewCard } = useConsultationCard();
  const [data, setData] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadCard();
    }
  }, [token]);

  const loadCard = async () => {
    try {
      const result = await viewCard(token!);
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Cartão não encontrado</h1>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Cartão de Consulta</h1>
          <p className="text-muted-foreground">
            Informações atualizadas em tempo real
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <Clock className="inline h-3 w-3 mr-1" />
            Válido até {new Date(data.expiresAt).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Adesão */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Adesão ao Tratamento</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {data.adherence}%
            </div>
            <p className="text-sm text-muted-foreground">
              nos últimos 7 dias
            </p>
          </div>
        </Card>

        {/* Medicamentos */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Pill className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Medicamentos Ativos</h2>
          </div>
          
          {data.medications.length === 0 ? (
            <p className="text-muted-foreground">Nenhum medicamento ativo</p>
          ) : (
            <div className="space-y-3">
              {data.medications.map((med, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{med.name}</h3>
                      {med.dose_text && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {med.dose_text}
                        </p>
                      )}
                      {med.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {med.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{med.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Documentos */}
        {data.documents.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Documentos Válidos</h2>
            </div>
            
            <div className="space-y-2">
              {data.documents.map((doc, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <h3 className="font-medium">{doc.title}</h3>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>
                      Emitido: {new Date(doc.issued_at).toLocaleDateString('pt-BR')}
                    </span>
                    {doc.expires_at && (
                      <span>
                        Validade: {new Date(doc.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Este cartão é temporário e foi gerado exclusivamente para consulta médica.
            <br />
            As informações são confidenciais e protegidas por lei.
          </p>
        </Card>
      </div>
    </div>
  );
}
