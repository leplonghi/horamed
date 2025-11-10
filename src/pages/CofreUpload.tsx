import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadDocumento } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";
import ExtractedDataPreviewModal from "@/components/ExtractedDataPreviewModal";

export default function CofreUpload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [categoria, setCategoria] = useState<string>("");
  const [titulo, setTitulo] = useState<string>("");
  const [dataEmissao, setDataEmissao] = useState<string>("");
  const [dataValidade, setDataValidade] = useState<string>("");
  const [prestador, setPrestador] = useState<string>("");
  const [medico, setMedico] = useState<string>("");
  const [especialidade, setEspecialidade] = useState<string>("");
  const [tipoExame, setTipoExame] = useState<string>("");
  const [dose, setDose] = useState<string>("");
  const [proximaDose, setProximaDose] = useState<string>("");
  const [criarLembrete, setCriarLembrete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedDataMap, setExtractedDataMap] = useState<Map<string, any>>(new Map());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentPreviewFile, setCurrentPreviewFile] = useState<string>("");
  const [currentPreviewData, setCurrentPreviewData] = useState<any>(null);

  const { profiles, activeProfile } = useUserProfiles();
  const uploadDocumento = useUploadDocumento();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);

      // Extrai automaticamente de cada arquivo
      for (const file of newFiles) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          setIsExtracting(true);
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = reader.result as string;
              
              const { data, error } = await supabase.functions.invoke('extract-document', {
                body: { image: base64 }
              });

              if (error) throw error;

              if (data) {
                // Se for o primeiro arquivo, mostrar modal de prévia
                if (newFiles[0] === file) {
                  setCurrentPreviewFile(file.name);
                  setCurrentPreviewData(data);
                  setShowPreviewModal(true);
                  setIsExtracting(false);
                  return;
                }
                
                // Para arquivos subsequentes, salvar dados extraídos silenciosamente
                setExtractedDataMap((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(file.name, data);
                  return newMap;
                });
              }
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('Erro ao extrair informações:', error);
            // Não mostrar erro para não irritar o usuário, apenas log
          } finally {
            setIsExtracting(false);
          }
        }
      }
    }
  };

  const handlePreviewConfirm = (data: any) => {
    // Salvar dados editados
    setExtractedDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentPreviewFile, data);
      return newMap;
    });

    // Preencher campos do formulário
    setTitulo(data.title || '');
    if (data.issued_at) setDataEmissao(data.issued_at);
    if (data.expires_at) setDataValidade(data.expires_at);
    if (data.provider) setPrestador(data.provider);
    if (data.category) setCategoria(data.category);
    
    // Campos específicos por categoria
    if (data.doctor) setMedico(data.doctor);
    if (data.specialty) setEspecialidade(data.specialty);
    if (data.exam_type) setTipoExame(data.exam_type);
    if (data.dose) setDose(data.dose);
    if (data.next_dose) setProximaDose(data.next_dose);

    toast.success("✨ Informações confirmadas e aplicadas!");
  };

  const handlePreviewSkip = () => {
    toast.info("Preencha os campos manualmente");
  };

  const removeFile = (index: number) => {
    const file = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));
    
    // Remover dados extraídos deste arquivo
    setExtractedDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(file.name);
      return newMap;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo");
      return;
    }

    if (!categoria) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (!titulo) {
      toast.error("Preencha o título do documento");
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        // Pegar dados extraídos deste arquivo, se houver
        const extractedData = extractedDataMap.get(file.name);
        
        await uploadDocumento.mutateAsync({
          file,
          profileId: activeProfile?.id,
          categoriaSlug: categoria || undefined,
          criarLembrete,
          extractedData: extractedData ? {
            title: titulo || extractedData.title,
            issued_at: dataEmissao || extractedData.issued_at,
            expires_at: dataValidade || extractedData.expires_at,
            provider: prestador || extractedData.provider,
            category: categoria || extractedData.category,
          } : undefined,
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

        <h1 className="text-3xl font-bold mb-2">Enviar Documentos</h1>
        <p className="text-muted-foreground mb-6">
          Selecione a categoria primeiro para ver os campos específicos
        </p>

        {isExtracting && (
          <div className="mb-4 p-4 bg-primary/10 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Extraindo informações do documento automaticamente...</span>
          </div>
        )}

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
                  <p className="text-xs text-primary mt-2 font-medium">
                    ✨ Imagens serão processadas automaticamente
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
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione primeiro a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exame">Exames Laboratoriais</SelectItem>
                    <SelectItem value="receita">Receitas Médicas</SelectItem>
                    <SelectItem value="vacinacao">Vacinação</SelectItem>
                    <SelectItem value="consulta">Consultas Médicas</SelectItem>
                    <SelectItem value="outro">Outros Documentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {categoria && (
                <>
                  <div>
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      placeholder={
                        categoria === "exame" ? "Ex: Hemograma Completo" :
                        categoria === "receita" ? "Ex: Receita de Antibiótico" :
                        categoria === "vacinacao" ? "Ex: Vacina COVID-19" :
                        categoria === "consulta" ? "Ex: Consulta Cardiologista" :
                        "Nome do documento"
                      }
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                    />
                  </div>

                  {/* Campos para EXAMES */}
                  {categoria === "exame" && (
                    <>
                      <div>
                        <Label htmlFor="tipoExame">Tipo de Exame</Label>
                        <Input
                          id="tipoExame"
                          placeholder="Ex: Sangue, Urina, Imagem"
                          value={tipoExame}
                          onChange={(e) => setTipoExame(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataEmissao">Data do Exame *</Label>
                        <Input
                          id="dataEmissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prestador">Laboratório</Label>
                        <Input
                          id="prestador"
                          placeholder="Ex: Delboni, Fleury"
                          value={prestador}
                          onChange={(e) => setPrestador(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Campos para RECEITAS */}
                  {categoria === "receita" && (
                    <>
                      <div>
                        <Label htmlFor="dataEmissao">Data da Receita *</Label>
                        <Input
                          id="dataEmissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataValidade">Validade</Label>
                        <Input
                          id="dataValidade"
                          type="date"
                          value={dataValidade}
                          onChange={(e) => setDataValidade(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="medico">Médico Prescritor</Label>
                        <Input
                          id="medico"
                          placeholder="Nome do médico"
                          value={medico}
                          onChange={(e) => setMedico(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Campos para VACINAÇÃO */}
                  {categoria === "vacinacao" && (
                    <>
                      <div>
                        <Label htmlFor="dataEmissao">Data da Aplicação *</Label>
                        <Input
                          id="dataEmissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dose">Dose</Label>
                        <Input
                          id="dose"
                          placeholder="Ex: 1ª dose, 2ª dose, Reforço"
                          value={dose}
                          onChange={(e) => setDose(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="proximaDose">Próxima Dose</Label>
                        <Input
                          id="proximaDose"
                          type="date"
                          value={proximaDose}
                          onChange={(e) => setProximaDose(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prestador">Local de Aplicação</Label>
                        <Input
                          id="prestador"
                          placeholder="Ex: UBS, Clínica particular"
                          value={prestador}
                          onChange={(e) => setPrestador(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Campos para CONSULTAS */}
                  {categoria === "consulta" && (
                    <>
                      <div>
                        <Label htmlFor="dataEmissao">Data da Consulta *</Label>
                        <Input
                          id="dataEmissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="medico">Nome do Médico</Label>
                        <Input
                          id="medico"
                          placeholder="Ex: Dr. João Silva"
                          value={medico}
                          onChange={(e) => setMedico(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="especialidade">Especialidade</Label>
                        <Input
                          id="especialidade"
                          placeholder="Ex: Cardiologia, Dermatologia"
                          value={especialidade}
                          onChange={(e) => setEspecialidade(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prestador">Local</Label>
                        <Input
                          id="prestador"
                          placeholder="Ex: Hospital São Luiz"
                          value={prestador}
                          onChange={(e) => setPrestador(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Campos para OUTROS */}
                  {categoria === "outro" && (
                    <>
                      <div>
                        <Label htmlFor="dataEmissao">Data do Documento</Label>
                        <Input
                          id="dataEmissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prestador">Origem/Prestador</Label>
                        <Input
                          id="prestador"
                          placeholder="Nome do prestador de serviço"
                          value={prestador}
                          onChange={(e) => setPrestador(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Lembrete automático - mostrar apenas para categorias relevantes */}
                  {(categoria === "vacinacao" || categoria === "exame") && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <Label htmlFor="lembrete">Criar lembrete automático</Label>
                        <p className="text-xs text-muted-foreground">
                          {categoria === "vacinacao" 
                            ? "Para a próxima dose" 
                            : "Para próximo check-up"}
                        </p>
                      </div>
                      <Switch
                        id="lembrete"
                        checked={criarLembrete}
                        onCheckedChange={setCriarLembrete}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleUpload}
            disabled={uploading || isExtracting}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Documentos
              </>
            )}
          </Button>
        </div>
      </div>

      <ExtractedDataPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        fileName={currentPreviewFile}
        extractedData={currentPreviewData || {}}
        onConfirm={handlePreviewConfirm}
        onSkip={handlePreviewSkip}
      />

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
      <Navigation />
    </div>
  );
}
