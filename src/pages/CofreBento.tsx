import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FolderHeart,
  FileText,
  Syringe,
  Stethoscope,
  FlaskConical,
  X,
  Calendar,
  LayoutGrid,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DockNavigation from "@/components/ui/dock-navigation";
import ModernHeader from "@/components/ui/modern-header";
import {
  BentoGrid,
  BentoCard,
  BentoHeader,
} from "@/components/ui/bento-grid";
import AddHealthDocumentModal from "@/components/cofre/AddHealthDocumentModal";
import EnhancedDocumentCard from "@/components/cofre/EnhancedDocumentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDocumentos, useDeletarDocumento } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type ViewMode = "grid" | "list";

export default function CofreBento() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroExp, setFiltroExp] = useState<"30" | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { activeProfile } = useUserProfiles();
  const deleteDocument = useDeletarDocumento();

  const { data: allDocumentos } = useDocumentos({ profileId: activeProfile?.id });
  const { data: documentos, isLoading } = useDocumentos({
    profileId: activeProfile?.id,
    categoria: categoriaAtiva === "todos" ? undefined : categoriaAtiva,
    q: busca,
    exp: filtroExp,
  });

  const handleDocumentSuccess = (
    documentId: string,
    type: string,
    extractedData: any
  ) => {
    navigate(`/carteira/${documentId}/review`, {
      state: { type, extractedData },
    });
  };

  const handleEdit = (id: string) => navigate(`/carteira/${id}/editar`);
  const handleShare = (id: string) => navigate(`/carteira/${id}/compartilhar`);
  const handleDelete = async (id: string) => {
    if (
      confirm(
        language === "pt"
          ? "Excluir este documento?"
          : "Delete this document?"
      )
    ) {
      await deleteDocument.mutateAsync(id);
    }
  };

  // Stats
  const stats = useMemo(() => {
    if (!allDocumentos) return { total: 0, receitas: 0, exames: 0, vacinas: 0 };
    return {
      total: allDocumentos.length,
      receitas: allDocumentos.filter((d) =>
        d.categorias_saude?.slug?.includes("receita")
      ).length,
      exames: allDocumentos.filter((d) =>
        d.categorias_saude?.slug?.includes("exame")
      ).length,
      vacinas: allDocumentos.filter((d) =>
        d.categorias_saude?.slug?.includes("vacina")
      ).length,
    };
  }, [allDocumentos]);

  const hasDocuments = allDocumentos && allDocumentos.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />

      <main className="pt-20 pb-24 px-4 max-w-4xl mx-auto space-y-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border border-primary/20 p-6"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm">
                <FolderHeart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {language === "pt" ? "Carteira de Saúde" : "Health Wallet"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === "pt"
                    ? "Documentos organizados e seguros"
                    : "Organized and secure documents"}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="gap-2 rounded-2xl shadow-lg hidden sm:flex"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-5 h-5" />
              {language === "pt" ? "Adicionar" : "Add"}
            </Button>
          </div>
        </motion.div>

        {/* Stats Bento */}
        <BentoGrid className="grid-cols-4">
          <BentoCard variant="gradient" size={1} delay={0}>
            <div className="text-center">
              <span className="text-3xl font-bold">{stats.total}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "pt" ? "Total" : "Total"}
              </p>
            </div>
          </BentoCard>

          <BentoCard
            variant="default"
            size={1}
            delay={1}
            onClick={() => setCategoriaAtiva("receita")}
          >
            <div className="text-center">
              <span className="text-3xl font-bold">{stats.receitas}</span>
              <p className="text-xs text-muted-foreground mt-1">💊</p>
            </div>
          </BentoCard>

          <BentoCard
            variant="default"
            size={1}
            delay={2}
            onClick={() => setCategoriaAtiva("exame")}
          >
            <div className="text-center">
              <span className="text-3xl font-bold">{stats.exames}</span>
              <p className="text-xs text-muted-foreground mt-1">🧪</p>
            </div>
          </BentoCard>

          <BentoCard
            variant="default"
            size={1}
            delay={3}
            onClick={() => setCategoriaAtiva("vacinacao")}
          >
            <div className="text-center">
              <span className="text-3xl font-bold">{stats.vacinas}</span>
              <p className="text-xs text-muted-foreground mt-1">💉</p>
            </div>
          </BentoCard>
        </BentoGrid>

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                language === "pt"
                  ? "Buscar documentos..."
                  : "Search documents..."
              }
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-11 pr-10 h-12 rounded-2xl border-2 focus:border-primary bg-card/80 backdrop-blur-sm"
            />
            {busca && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={() => setBusca("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button
            variant={filtroExp === "30" ? "default" : "outline"}
            size="icon"
            className="h-12 w-12 rounded-2xl shrink-0"
            onClick={() => setFiltroExp(filtroExp === "30" ? "all" : "30")}
          >
            <Calendar className="w-5 h-5" />
          </Button>

          <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-muted/50">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={categoriaAtiva} onValueChange={setCategoriaAtiva}>
          <TabsList className="w-full flex-nowrap overflow-x-auto h-auto gap-1 p-1.5 rounded-2xl bg-muted/50 justify-start">
            <TabsTrigger value="todos" className="rounded-xl shrink-0">
              {language === "pt" ? "Todos" : "All"}
            </TabsTrigger>
            <TabsTrigger value="receita" className="rounded-xl shrink-0">
              💊 {language === "pt" ? "Receitas" : "Prescriptions"}
            </TabsTrigger>
            <TabsTrigger value="exame" className="rounded-xl shrink-0">
              🧪 {language === "pt" ? "Exames" : "Exams"}
            </TabsTrigger>
            <TabsTrigger value="vacinacao" className="rounded-xl shrink-0">
              💉 {language === "pt" ? "Vacinas" : "Vaccines"}
            </TabsTrigger>
            <TabsTrigger value="consulta" className="rounded-xl shrink-0">
              🩺 {language === "pt" ? "Consultas" : "Consultations"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={categoriaAtiva} className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-3xl bg-muted/50 animate-pulse"
                  />
                ))}
              </div>
            ) : documentos && documentos.length > 0 ? (
              <AnimatePresence mode="popLayout">
                <motion.div
                  className={
                    viewMode === "grid"
                      ? "grid gap-3 sm:grid-cols-2"
                      : "space-y-3"
                  }
                >
                  {documentos.map((doc, index) => (
                    <EnhancedDocumentCard
                      key={doc.id}
                      document={doc}
                      index={index}
                      onEdit={handleEdit}
                      onShare={handleShare}
                      onDelete={handleDelete}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur-sm p-8 text-center border border-border/30"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-4"
                >
                  <FolderHeart className="w-12 h-12 text-primary" />
                </motion.div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {busca
                    ? language === "pt"
                      ? "Nenhum documento encontrado"
                      : "No documents found"
                    : language === "pt"
                    ? "Sua carteira está vazia"
                    : "Your wallet is empty"}
                </h3>

                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {busca
                    ? language === "pt"
                      ? "Tente buscar com outros termos"
                      : "Try different search terms"
                    : language === "pt"
                    ? "Adicione receitas, exames e vacinas"
                    : "Add prescriptions, exams and vaccines"}
                </p>

                {!busca && (
                  <Button
                    size="lg"
                    className="gap-2 rounded-2xl"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-5 h-5" />
                    {language === "pt"
                      ? "Adicionar primeiro documento"
                      : "Add first document"}
                  </Button>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* FAB Mobile */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="md:hidden fixed bottom-24 right-4 z-50"
      >
        <Button
          size="lg"
          onClick={() => setShowAddModal(true)}
          className="h-14 w-14 rounded-full shadow-2xl"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      <AddHealthDocumentModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleDocumentSuccess}
      />
      <DockNavigation />
    </div>
  );
}
