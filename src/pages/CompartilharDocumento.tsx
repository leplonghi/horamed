import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FileText, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CompartilharDocumento() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [documento, setDocumento] = useState<any>(null);
  const [compartilhamento, setCompartilhamento] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState<string>("");

  useEffect(() => {
    const loadDocumento = async () => {
      try {
        if (!token) {
          setError("Token inválido");
          return;
        }

        // Buscar compartilhamento (sem autenticação)
        const { data: share, error: shareError } = await supabase
          .from("compartilhamentos_doc")
          .select("*, documentos_saude(*)")
          .eq("token", token)
          .single();

        if (shareError || !share) {
          setError("Link de compartilhamento não encontrado");
          return;
        }

        // Verificar validade
        if (share.revoked_at) {
          setError("Este link foi revogado");
          return;
        }

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
          setError("Este link expirou");
          return;
        }

        setCompartilhamento(share);
        setDocumento(share.documentos_saude);

        // Obter URL assinada do documento
        const { data: urlData } = await supabase.storage
          .from("cofre-saude")
          .createSignedUrl(share.documentos_saude.file_path, 3600);

        if (urlData) setSignedUrl(urlData.signedUrl);
      } catch (err: any) {
        setError("Erro ao carregar documento");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDocumento();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Documento Compartilhado</h1>
          <p className="text-muted-foreground">
            Visualize o documento compartilhado com você
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{documento?.title || "Documento sem título"}</CardTitle>
            <div className="flex gap-2 mt-2">
              {compartilhamento.expires_at && (
                <Badge variant="outline">
                  Válido até{" "}
                  {format(new Date(compartilhamento.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documento?.issued_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">
                    {format(new Date(documento.issued_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}

              {documento?.provider && (
                <div>
                  <p className="text-sm text-muted-foreground">Prestador</p>
                  <p className="font-medium">{documento.provider}</p>
                </div>
              )}

              {compartilhamento.allow_download && signedUrl && (
                <Button asChild className="w-full">
                  <a href={signedUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Documento
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {signedUrl && (
          <Card>
            <CardContent className="p-4">
              {documento?.mime_type === "application/pdf" ? (
                <iframe src={signedUrl} className="w-full h-[600px] rounded" />
              ) : (
                <img
                  src={signedUrl}
                  alt={documento?.title || ""}
                  className="w-full rounded"
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
