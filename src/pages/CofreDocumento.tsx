import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download, Trash2, Calendar, Edit, Pill, Stethoscope, TestTube2, Syringe, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useDocumento, useCompartilhamentos, useDeletarDocumento } from "@/hooks/useCofre";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CofreDocumento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    prescriptions: true,
    exam: true,
    consultation: true,
    vaccine: true,
  });

  const { data: documento, isLoading } = useDocumento(id);
  const { data: compartilhamentos } = useCompartilhamentos(id);
  const { mutate: deletar } = useDeletarDocumento();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getCategoryConfig = (categorySlug?: string) => {
    switch (categorySlug) {
      case "receita":
        return { icon: Pill, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950", label: "Receita Médica" };
      case "exame":
        return { icon: TestTube2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950", label: "Exame Laboratorial" };
      case "vacinacao":
        return { icon: Syringe, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950", label: "Cartão de Vacina" };
      case "consulta":
        return { icon: Stethoscope, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950", label: "Consulta Médica" };
      default:
        return { icon: Calendar, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-950", label: "Documento" };
    }
  };

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
      deletar(id!);
      navigate("/cofre");
    } catch (error) {
      toast.error("Erro ao deletar documento");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-6 pt-24">{/* pt-24 para compensar o header fixo */}
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

  const categoryConfig = getCategoryConfig(documento?.categorias_saude?.slug);
  const CategoryIcon = categoryConfig.icon;
  const meta = documento?.meta as any;

  // Função para extrair número da quantidade da embalagem
  const extractQuantity = (packageQuantity: string): number | null => {
    if (!packageQuantity) return null;
    const match = packageQuantity.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  // Calcular total de unidades
  const calculateTotalUnits = (packagesCount: number | undefined, packageQuantity: string | undefined): number | null => {
    if (!packagesCount || !packageQuantity) return null;
    const quantity = extractQuantity(packageQuantity);
    return quantity ? packagesCount * quantity : null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-6 pt-24">
        <Button variant="ghost" onClick={() => navigate("/cofre")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Header Card with Category */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-lg ${categoryConfig.bg} flex items-center justify-center flex-shrink-0`}>
                <CategoryIcon className={`w-8 h-8 ${categoryConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="mb-2">{categoryConfig.label}</Badge>
                <CardTitle className="text-2xl">{documento.title || "Sem título"}</CardTitle>
                {documento.user_profiles && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Perfil: {documento.user_profiles.name}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              {/* Dados do Paciente */}
              {(meta?.patient_name || meta?.patient_age || meta?.patient_cpf) && (
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>👤</span> Dados do Paciente
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {meta.patient_name && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Nome</p>
                        <p className="font-medium">{meta.patient_name}</p>
                      </div>
                    )}
                    {meta.patient_age && (
                      <div>
                        <p className="text-muted-foreground">Idade</p>
                        <p className="font-medium">{meta.patient_age}</p>
                      </div>
                    )}
                    {meta.patient_cpf && (
                      <div>
                        <p className="text-muted-foreground">CPF</p>
                        <p className="font-medium">{meta.patient_cpf}</p>
                      </div>
                    )}
                    {meta.patient_address && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Endereço</p>
                        <p className="font-medium">{meta.patient_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Identificação do Emitente */}
              {(meta?.emitter_name || meta?.emitter_address || documento.provider) && (
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>🏥</span> Identificação do Emitente
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {(meta?.emitter_name || documento.provider) && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Nome</p>
                        <p className="font-medium">{meta?.emitter_name || documento.provider}</p>
                      </div>
                    )}
                    {meta?.emitter_cnpj && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">CNPJ</p>
                        <p className="font-medium">{meta.emitter_cnpj}</p>
                      </div>
                    )}
                    {meta?.emitter_address && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Endereço</p>
                        <p className="font-medium">{meta.emitter_address}</p>
                      </div>
                    )}
                    {(meta?.emitter_city || meta?.emitter_state) && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Cidade/Estado</p>
                        <p className="font-medium">
                          {[meta?.emitter_city, meta?.emitter_state].filter(Boolean).join(' - ')}
                        </p>
                      </div>
                    )}
                    {meta?.emitter_zip && (
                      <div>
                        <p className="text-muted-foreground">CEP</p>
                        <p className="font-medium">{meta.emitter_zip}</p>
                      </div>
                    )}
                    {meta?.emitter_phone && (
                      <div>
                        <p className="text-muted-foreground">Telefone</p>
                        <p className="font-medium">{meta.emitter_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dados do Médico */}
              {meta?.doctor_name && (
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>👨‍⚕️</span> Dados do Médico
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Nome</p>
                      <p className="font-medium">{meta.doctor_name}</p>
                    </div>
                    {meta?.doctor_registration && (
                      <div>
                        <p className="text-muted-foreground">CRM</p>
                        <p className="font-medium">
                          {meta.doctor_registration}
                          {meta.doctor_state && ` - ${meta.doctor_state}`}
                        </p>
                      </div>
                    )}
                    {meta?.specialty && (
                      <div>
                        <p className="text-muted-foreground">Especialidade</p>
                        <p className="font-medium">{meta.specialty}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {documento.issued_at && (
                  <div>
                    <p className="text-muted-foreground">📅 Data de Emissão</p>
                    <p className="font-medium">
                      {format(new Date(documento.issued_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {documento.expires_at && (
                  <div>
                    <p className="text-muted-foreground">⏰ Validade</p>
                    <p className="font-medium">
                      {format(new Date(documento.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {meta?.prescription_type && (
                  <div>
                    <p className="text-muted-foreground">📋 Tipo de Receita</p>
                    <p className="font-medium capitalize">{meta.prescription_type}</p>
                  </div>
                )}
                {meta?.diagnosis && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">🔍 Diagnóstico</p>
                    <p className="font-medium">{meta.diagnosis}</p>
                  </div>
                )}
                {meta?.followup_date && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">📅 Data de Retorno</p>
                    <p className="font-medium">
                      {format(new Date(meta.followup_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {documento.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">📝 Observações</p>
                  <p className="text-sm">{documento.notes}</p>
                </div>
              </>
            )}

            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate(`/cofre/${id}/editar`)} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button onClick={handleCompartilhar} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              {signedUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={signedUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </a>
                </Button>
              )}
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                size="sm"
                className="ml-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Data Sections */}
        {meta?.prescriptions && meta.prescriptions.length > 0 && (
          <Card className="mb-4">
            <Collapsible open={expandedSections.prescriptions} onOpenChange={() => toggleSection('prescriptions')}>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('prescriptions')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">Medicamentos Prescritos</CardTitle>
                    <Badge variant="secondary">{meta.prescriptions.length}</Badge>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedSections.prescriptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {meta.prescriptions.map((med: any, idx: number) => (
                    <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
                      {/* Cabeçalho do Medicamento */}
                      <div className="mb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                              {med.commercial_name || med.drug_name}
                            </p>
                            {med.commercial_name && med.drug_name && (
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {med.drug_name}
                              </p>
                            )}
                          </div>
                          {med.is_generic !== undefined && (
                            <Badge variant={med.is_generic ? "default" : "secondary"} className="shrink-0">
                              {med.is_generic ? "💊 Genérico" : "Referência"}
                            </Badge>
                          )}
                        </div>
                        {med.active_ingredient && (
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            <span className="font-medium">Princípio Ativo:</span> {med.active_ingredient}
                          </p>
                        )}
                      </div>

                      <Separator className="my-3" />

                      {/* Informações de Embalagem */}
                      {(med.package_type || med.package_quantity || med.packages_count) && (
                        <div className="mb-3 p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            📦 Informações da Embalagem
                          </p>
                          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            {med.package_type && (
                              <p>• Tipo: {med.package_type}</p>
                            )}
                            {med.package_quantity && (
                              <p>• Quantidade: {med.package_quantity}</p>
                            )}
                            {med.packages_count && (
                              <p>• Número de embalagens: {med.packages_count} {med.packages_count === 1 ? 'embalagem' : 'embalagens'}</p>
                            )}
                            {(() => {
                              const totalUnits = calculateTotalUnits(med.packages_count, med.package_quantity);
                              return totalUnits && (
                                <p className="font-semibold pt-1 border-t border-blue-200 dark:border-blue-800 mt-2">
                                  ✨ Total disponível: {totalUnits} {extractQuantity(med.package_quantity || '') === 1 ? 'unidade' : 'unidades'}
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Instruções de Uso */}
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                        {med.dose && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">💊 Dose:</span>
                            <span>{med.dose}</span>
                          </div>
                        )}
                        {med.frequency && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">⏰ Frequência:</span>
                            <span>{med.frequency}</span>
                          </div>
                        )}
                        {med.duration_days && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">📅 Duração:</span>
                            <span>{med.duration_days} dias {med.duration && `(${med.duration})`}</span>
                          </div>
                        )}
                        {med.instructions && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">📝 Instruções:</span>
                            <span>{med.instructions}</span>
                          </div>
                        )}
                        {med.with_food !== undefined && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">🍽️ Alimentação:</span>
                            <span>{med.with_food ? 'Tomar com alimento' : 'Pode tomar sem alimento'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {meta?.notes && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-900 mt-3">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">📋 Observações do Médico</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">{meta.notes}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => navigate('/rotina')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver na Rotina de Medicamentos
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {meta?.extracted_values && meta.extracted_values.length > 0 && (
          <Card className="mb-4">
            <Collapsible open={expandedSections.exam} onOpenChange={() => toggleSection('exam')}>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('exam')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TestTube2 className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-lg">Resultados do Exame</CardTitle>
                    <Badge variant="secondary">{meta.extracted_values.length}</Badge>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedSections.exam ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-2">
                  {meta.extracted_values.map((val: any, idx: number) => (
                    <div key={idx} className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 dark:text-green-100">{val.parameter}</p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {val.value} {val.unit}
                          </p>
                          {val.reference_range && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Referência: {val.reference_range}
                            </p>
                          )}
                        </div>
                        {val.status && (
                          <Badge
                            variant={val.status === 'normal' ? 'outline' : 'destructive'}
                            className="ml-2"
                          >
                            {val.status === 'normal' ? '✓ Normal' : '⚠️ Alterado'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {meta?.vaccine_name && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Informações da Vacina</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="font-semibold text-purple-900 dark:text-purple-100">{meta.vaccine_name}</p>
                {meta.dose_number && <p className="text-sm text-purple-700 dark:text-purple-300">Dose: {meta.dose_number}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {(meta?.diagnosis || meta?.specialty) && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg">Detalhes da Consulta</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {meta.specialty && (
                <div>
                  <p className="text-sm text-muted-foreground">Especialidade</p>
                  <p className="font-medium">{meta.specialty}</p>
                </div>
              )}
              {meta.diagnosis && (
                <div>
                  <p className="text-sm text-muted-foreground">Diagnóstico/Avaliação</p>
                  <p className="text-sm">{meta.diagnosis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
