import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCofre } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";

export default function CofreUpload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [categoria, setCategoria] = useState<string>("");
  const [criarLembrete, setCriarLembrete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { profiles, activeProfile } = useUserProfiles();
  const { uploadDocumento } = useCofre();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo");
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        await uploadDocumento.mutateAsync({
          file,
          profileId: activeProfile?.id,
          categoriaSlug: categoria || undefined,
          criarLembrete,
        });
      }

      toast.success("Documentos enviados com sucesso!");
      navigate("/cofre");
    } catch (error: any) {
      if (error.message === "LIMIT_REACHED") {
        setShowUpgrade(true);
      } else {
        console.error("Erro no upload:", error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/cofre")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-6">Enviar Documentos</h1>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Clique ou arraste arquivos aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG ou PNG até 10MB
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </Label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exame">Exames</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="vacinacao">Vacinação</SelectItem>
                    <SelectItem value="consulta">Consultas</SelectItem>
                    <SelectItem value="outro">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lembrete">Criar lembrete automático</Label>
                  <p className="text-xs text-muted-foreground">
                    Para check-ups e renovações
                  </p>
                </div>
                <Switch
                  id="lembrete"
                  checked={criarLembrete}
                  onCheckedChange={setCriarLembrete}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? "Enviando..." : "Enviar Documentos"}
          </Button>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
      <Navigation />
    </div>
  );
}
