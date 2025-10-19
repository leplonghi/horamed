import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCofre } from "@/hooks/useCofre";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CofreDocumento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { useDocumento, deletarDocumento, useCompartilhamentos } = useCofre();
  const { data: documento, isLoading } = useDocumento(id);
  const { data: compartilhamentos } = useCompartilhamentos(id);

  useEffect(() => {
    const loadUrl = async () => {
      if (documento?.file_path) {
        const { data } = await supabase.storage
          .from("cofre-saude")
          .createSignedUrl(documento.file_path, 3600);
        if (data) setSignedUrl(data.signedUrl);
      }
    };
    loadUrl();
  }, [documento]);

  const handleCompartilhar = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("gerar-link-compartilhamento", {
        body: { documentId: id, allowDownload: true, ttlHours: 72 },
      });

      if (error) throw error;

      if (data?.requiresUpgrade) {
        setShowUpgrade(true);
        return;
      }

      if (data?.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copiado para área de transferência!");
      }
    } catch (error: any) {
      toast.error("Erro ao gerar link de compartilhamento");
    }
  };

  const handleDeletar = async () => {
    try {
      await deletarDocumento.mutateAsync(id!);
      navigate("/cofre");
    } catch (error) {
      toast.error("Erro ao deletar documento");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-96" />
        </div>
        <Navigation />
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <p>Documento não encontrado</p>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/cofre")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{documento.title || "Sem título"}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {documento.categorias_saude && (
                    <Badge variant="outline">{documento.categorias_saude.label}</Badge>
                  )}
                  {documento.user_profiles && (
                    <Badge variant="secondary">{documento.user_profiles.name}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {documento.issued_at && (
                <div>
                  <p className="text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">
                    {format(new Date(documento.issued_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              {documento.expires_at && (
                <div>
                  <p className="text-muted-foreground">Validade</p>
                  <p className="font-medium">
                    {format(new Date(documento.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              {documento.provider && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Prestador</p>
                  <p className="font-medium">{documento.provider}</p>
                </div>
              )}
            </div>

            {documento.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{documento.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={handleCompartilhar} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              {signedUrl && (
                <Button asChild variant="outline">
                  <a href={signedUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </a>
                </Button>
              )}
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="ml-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>

        {signedUrl && (
          <Card>
            <CardContent className="p-4">
              {documento.mime_type === "application/pdf" ? (
                <iframe src={signedUrl} className="w-full h-[600px] rounded" />
              ) : (
                <img src={signedUrl} alt={documento.title || ""} className="w-full rounded" />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
      <Navigation />
    </div>
  );
}
