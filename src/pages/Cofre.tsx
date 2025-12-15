import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Calendar, Plus, Clock, AlertTriangle, FolderOpen, Edit } from "lucide-react";
import AddHealthDocumentModal from "@/components/cofre/AddHealthDocumentModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentos, DocumentoSaude } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { usePrescriptionControl } from "@/hooks/usePrescriptionControl";
import { PrescriptionStatusBadge } from "@/components/PrescriptionStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { format, isBefore, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import TutorialHint from "@/components/TutorialHint";
import HelpTooltip from "@/components/HelpTooltip";
import { microcopy } from "@/lib/microcopy";

export default function Cofre() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroExp, setFiltroExp] = useState<"30" | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    activeProfile
  } = useUserProfiles();
  const navigate = useNavigate();
  const handleDocumentSuccess = (documentId: string, type: string, extractedData: any) => {
    // Navigate to appropriate review screen based on type
    navigate(`/carteira/${documentId}/review`, {
      state: {
        type,
        extractedData
      }
    });
  };
  const {
    data: allDocumentos
  } = useDocumentos({
    profileId: activeProfile?.id
  });
  const {
    data: documentos,
    isLoading
  } = useDocumentos({
    profileId: activeProfile?.id,
    categoria: categoriaAtiva === "todos" ? undefined : categoriaAtiva,
    q: busca,
    exp: filtroExp
  });
  const {
    data: prescriptionStatus
  } = usePrescriptionControl(activeProfile?.id);
  const stats = useMemo(() => {
    if (!allDocumentos) return null;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = allDocumentos.filter(doc => doc.expires_at && new Date(doc.expires_at) <= thirtyDaysFromNow && new Date(doc.expires_at) > now).length;
    const needsReview = allDocumentos.filter(doc => doc.status_extraction === "pending_review").length;
    const byCategory = allDocumentos.reduce((acc, doc) => {
      const slug = doc.categorias_saude?.slug || "outros";
      acc[slug] = (acc[slug] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return {
      total: allDocumentos.length,
      expiringSoon,
      needsReview,
      byCategory
    };
  }, [allDocumentos]);
  const getSignedUrl = async (path: string) => {
    const {
      data
    } = await supabase.storage.from("carteira-saude").createSignedUrl(path, 3600);
    return data?.signedUrl;
  };
  const renderDocumentoCard = (doc: DocumentoSaude) => {
    const isExpiringSoon = doc.expires_at && new Date(doc.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const needsReview = doc.status_extraction === "pending_review";
    const isReviewed = doc.status_extraction === "reviewed";

    // Buscar status da receita
    const prescStatus = prescriptionStatus?.find(ps => ps.id === doc.id);
    const isPrescription = doc.categorias_saude?.slug === "receita";

    // Friendly status label
    const getStatusLabel = () => {
      if (needsReview) return "Aguardando sua revisão";
      if (isReviewed) return "Revisado";
      return "Lendo documento...";
    };
    const getCategoryIcon = (categorySlug?: string) => {
      switch (categorySlug) {
        case "receita":
          return {
            emoji: "💊",
            label: "Receita",
            type: "prescription",
            color: "text-doc-prescription-foreground",
            bg: "bg-doc-prescription-background",
            border: "border-doc-prescription-border"
          };
        case "exame":
          return {
            emoji: "🧪",
            label: "Exame",
            type: "exam",
            color: "text-doc-exam-foreground",
            bg: "bg-doc-exam-background",
            border: "border-doc-exam-border"
          };
        case "vacinacao":
          return {
            emoji: "💉",
            label: "Vacina",
            type: "vaccine",
            color: "text-doc-vaccine-foreground",
            bg: "bg-doc-vaccine-background",
            border: "border-doc-vaccine-border"
          };
        case "consulta":
          return {
            emoji: "🩺",
            label: "Consulta",
            type: "consultation",
            color: "text-doc-consultation-foreground",
            bg: "bg-doc-consultation-background",
            border: "border-doc-consultation-border"
          };
        default:
          return {
            emoji: "📋",
            label: "Documento",
            type: "other",
            color: "text-doc-other-foreground",
            bg: "bg-doc-other-background",
            border: "border-doc-other-border"
          };
      }
    };
    const category = getCategoryIcon(doc.categorias_saude?.slug);
    return <Link key={doc.id} to={`/carteira/${doc.id}`}>
        <Card className={`hover:shadow-lg transition-all cursor-pointer relative group border-l-4 ${category.border}`}>
          <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/carteira/${doc.id}/editar`);
        }}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <CardContent className="p-4 bg-accent">
            <div className="flex gap-3">
              <div className={`w-14 h-14 rounded-lg ${category.bg} flex items-center justify-center flex-shrink-0 border ${category.border}`}>
                <span className="text-2xl">{category.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="heading-card truncate mb-2">{doc.title || "Sem título"}</h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="outline" className={`text-tiny h-5 ${category.color} ${category.border}`}>
                    {category.label}
                  </Badge>
                  {needsReview && <Badge variant="secondary" className="text-tiny h-5 bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
                      👁️ Pronto para revisar
                    </Badge>}
                  {isReviewed && <Badge variant="secondary" className="text-tiny h-5 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                      ✓ Revisado
                    </Badge>}
                  {isExpiringSoon && <Badge variant="destructive" className="text-tiny h-5">
                      ⏰ Vence em breve
                    </Badge>}
                  {/* Badges de status de receita */}
                  {isPrescription && prescStatus && <PrescriptionStatusBadge status={prescStatus.status} daysUntilExpiry={prescStatus.daysUntilExpiry} isDuplicate={prescStatus.isDuplicate} isPurchased={prescStatus.isPurchased} className="text-tiny h-5" />}
                </div>
                <div className="text-label space-y-1">
                  {doc.issued_at && <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Emissão: {format(new Date(doc.issued_at), "dd/MM/yyyy", {
                      locale: ptBR
                    })}</span>
                    </div>}
                  {doc.expires_at && <div className="flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>Validade: {format(new Date(doc.expires_at), "dd/MM/yyyy", {
                      locale: ptBR
                    })}</span>
                    </div>}
                  {doc.provider && <div className="flex items-center gap-1.5 truncate">
                      <span>🏥</span>
                      <span className="truncate">{doc.provider}</span>
                    </div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>;
  };
  return <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-6xl mx-auto pt-24 pb-6 space-y-6 px-[24px] py-[95px]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="heading-page">Carteira de Saúde</h1>
              <HelpTooltip 
                content="Guarde aqui todos os seus documentos de saúde: receitas, exames, vacinas e laudos. Tudo organizado e seguro." 
                iconSize="lg"
              />
            </div>
            <p className="text-description">
              Seus documentos médicos organizados e seguros
            </p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Adicionar documento</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

        {/* Explicação didática da seção */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Como funciona?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tire uma foto ou faça upload de receitas e exames. O app <strong>lê automaticamente</strong> os dados 
                  e você pode revisar antes de salvar. Seus documentos ficam sempre disponíveis!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        {stats && <div className="grid grid-cols-4 md:grid-cols-1 gap-2 px-0 py-0">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 text-center">
                  <FolderOpen className="w-4 h-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">documentos</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Expirando
                  <HelpTooltip content={microcopy.help.cofre.expiring} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {stats.expiringSoon}
                </div>
                <p className="text-xs text-muted-foreground mt-1">em 30 dias</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Revisar
                  <HelpTooltip content={microcopy.help.cofre.review} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {stats.needsReview}
                </div>
                <p className="text-xs text-muted-foreground mt-1">pendentes</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Object.keys(stats.byCategory).length}</div>
                <p className="text-xs text-muted-foreground mt-1">tipos</p>
              </CardContent>
            </Card>
          </div>}

        <TutorialHint 
          id={microcopy.tutorials.cofre.id} 
          title={microcopy.tutorials.cofre.title} 
          message={microcopy.tutorials.cofre.message} 
        />

        <div className="flex gap-2 mb-4">
          <Input placeholder="Buscar documentos..." value={busca} onChange={e => setBusca(e.target.value)} className="flex-1" />
          <Button variant={filtroExp === "30" ? "default" : "outline"} size="icon" onClick={() => setFiltroExp(filtroExp === "30" ? "all" : "30")}>
            <Calendar className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={categoriaAtiva} onValueChange={setCategoriaAtiva}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="vacinacao">Vacinas</TabsTrigger>
            <TabsTrigger value="exame">Exames</TabsTrigger>
            <TabsTrigger value="receita">Receitas</TabsTrigger>
            <TabsTrigger value="consulta">Consultas</TabsTrigger>
          </TabsList>

          <TabsContent value={categoriaAtiva} className="space-y-3 mt-6">
            {isLoading ? <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </> : documentos && documentos.length > 0 ? documentos.map(renderDocumentoCard) : <Card>
                <CardContent className="text-center py-[30px]">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Nenhum documento encontrado</p>
                  <p className="text-xs text-muted-foreground">
                    Clique em "Adicionar Documento" acima para começar
                  </p>
                </CardContent>
              </Card>}
          </TabsContent>
        </Tabs>
      </div>

      {/* Botão flutuante mobile */}
      <Button size="lg" onClick={() => setShowAddModal(true)} className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg">
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add Document Modal */}
      <AddHealthDocumentModal open={showAddModal} onOpenChange={setShowAddModal} onSuccess={handleDocumentSuccess} />

      <Navigation />
    </div>;
}