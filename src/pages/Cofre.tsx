import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Calendar,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  FolderHeart,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import AddHealthDocumentModal from "@/components/cofre/AddHealthDocumentModal";
import SmartDocumentInsights from "@/components/cofre/SmartDocumentInsights";
import DocumentQuickActions from "@/components/cofre/DocumentQuickActions";
import DocumentTimeline from "@/components/cofre/DocumentTimeline";
import DocumentStatsGrid from "@/components/cofre/DocumentStatsGrid";
import EnhancedDocumentCard from "@/components/cofre/EnhancedDocumentCard";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDocumentos } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useDeletarDocumento } from "@/hooks/useCofre";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import OceanBackground from "@/components/ui/OceanBackground";

type ViewMode = "grid" | "list" | "timeline";

export default function Cofre() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroExp, setFiltroExp] = useState<"30" | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  const { activeProfile } = useUserProfiles();
  const deleteDocument = useDeletarDocumento();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleDocumentSuccess = (documentId: string, type: string, extractedData: any) => {
    navigate(`/carteira/${documentId}/review`, {
      state: { type, extractedData }
    });
  };
  
  const { data: allDocumentos } = useDocumentos({ profileId: activeProfile?.id });
  const { data: documentos, isLoading } = useDocumentos({
    profileId: activeProfile?.id,
    categoria: categoriaAtiva === "todos" ? undefined : categoriaAtiva,
    q: busca,
    exp: filtroExp
  });

  const handleInsightAction = (action: string, documentId?: string) => {
    switch (action) {
      case "view":
      case "review":
        if (documentId) navigate(`/carteira/${documentId}`);
        break;
      case "schedule-checkup":
        toast.info(language === 'pt' ? 'Em breve: Agendar check-up' : 'Coming soon: Schedule check-up');
        break;
    }
  };

  const handleStatClick = (filter: string) => {
    if (["receita", "exame", "vacinacao", "consulta"].includes(filter)) {
      setCategoriaAtiva(filter);
    } else if (filter === "expiring") {
      setFiltroExp("30");
    } else if (filter === "review") {
      // Could implement a review filter
      toast.info(language === 'pt' ? 'Mostrando documentos para revisão' : 'Showing documents for review');
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/carteira/${id}/editar`);
  };

  const handleShare = (id: string) => {
    navigate(`/carteira/${id}/compartilhar`);
  };

  const handleDelete = async (id: string) => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja excluir este documento?' : 'Are you sure you want to delete this document?')) {
      await deleteDocument.mutateAsync(id);
    }
  };

  const hasDocuments = allDocumentos && allDocumentos.length > 0;

  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      <Header />
      
      <div className="page-container container max-w-4xl mx-auto space-y-6 px-4 sm:px-6 pb-24 relative z-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm">
                  <FolderHeart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {language === 'pt' ? 'Carteira de Saúde' : 'Health Wallet'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' 
                      ? 'Seus documentos de saúde organizados e seguros' 
                      : 'Your health documents organized and secure'}
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="gap-2 rounded-2xl hover-lift hidden sm:flex shadow-lg" 
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-5 h-5" />
              {language === 'pt' ? 'Adicionar' : 'Add'}
            </Button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        {hasDocuments && (
          <DocumentQuickActions
            onScanDocument={() => setShowAddModal(true)}
            onUploadFile={() => setShowAddModal(true)}
            onAddPrescription={() => setShowAddModal(true)}
            onAddVaccine={() => setShowAddModal(true)}
            onAddExam={() => setShowAddModal(true)}
          />
        )}

        {/* Smart Insights */}
        {allDocumentos && allDocumentos.length > 0 && (
          <SmartDocumentInsights 
            documents={allDocumentos} 
            onActionClick={handleInsightAction}
          />
        )}

        {/* Stats Grid */}
        {hasDocuments && (
          <DocumentStatsGrid 
            documents={allDocumentos || []} 
            onStatClick={handleStatClick}
          />
        )}

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              ref={searchInputRef}
              placeholder={language === 'pt' ? 'Buscar documentos...' : 'Search documents...'}
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="pl-11 pr-10 h-12 rounded-2xl border-2 focus:border-primary bg-card/80 backdrop-blur-sm transition-all"
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

          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-2xl shrink-0 sm:hidden"
              >
                <Filter className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>
                  {language === 'pt' ? 'Filtros' : 'Filters'}
                </SheetTitle>
              </SheetHeader>
              {/* Filter content for mobile */}
            </SheetContent>
          </Sheet>

          {/* View mode toggle */}
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
              {language === 'pt' ? 'Todos' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="receita" className="rounded-xl shrink-0">
              💊 {language === 'pt' ? 'Receitas' : 'Prescriptions'}
            </TabsTrigger>
            <TabsTrigger value="exame" className="rounded-xl shrink-0">
              🧪 {language === 'pt' ? 'Exames' : 'Exams'}
            </TabsTrigger>
            <TabsTrigger value="vacinacao" className="rounded-xl shrink-0">
              💉 {language === 'pt' ? 'Vacinas' : 'Vaccines'}
            </TabsTrigger>
            <TabsTrigger value="consulta" className="rounded-xl shrink-0">
              🩺 {language === 'pt' ? 'Consultas' : 'Consultations'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={categoriaAtiva} className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            ) : documentos && documentos.length > 0 ? (
              <AnimatePresence mode="wait">
                {viewMode === "timeline" ? (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <DocumentTimeline documents={documentos} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={viewMode === "grid" 
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
                )}
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
                    ? (language === 'pt' ? 'Nenhum documento encontrado' : 'No documents found')
                    : (language === 'pt' ? 'Sua carteira está vazia' : 'Your wallet is empty')
                  }
                </h3>
                
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {busca 
                    ? (language === 'pt' ? 'Tente buscar com outros termos' : 'Try searching with different terms')
                    : (language === 'pt' 
                        ? 'Adicione receitas, exames, vacinas e outros documentos para mantê-los sempre à mão' 
                        : 'Add prescriptions, exams, vaccines and other documents to keep them handy'
                      )
                  }
                </p>

                {!busca && (
                  <Button 
                    size="lg" 
                    className="gap-2 rounded-2xl"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-5 h-5" />
                    {language === 'pt' ? 'Adicionar primeiro documento' : 'Add first document'}
                  </Button>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* Timeline View (alternative) */}
        {hasDocuments && viewMode !== "timeline" && documentos && documentos.length > 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              className="w-full rounded-2xl h-12 gap-2"
              onClick={() => setViewMode("timeline")}
            >
              <Sparkles className="h-4 w-4" />
              {language === 'pt' ? 'Ver linha do tempo' : 'View timeline'}
            </Button>
          </motion.div>
        )}
      </div>

      {/* FAB Mobile */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="md:hidden fixed bottom-20 right-4 z-50"
      >
        <Button 
          size="lg" 
          onClick={() => setShowAddModal(true)} 
          className="h-14 w-14 rounded-full shadow-2xl hover-lift"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      <AddHealthDocumentModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
        onSuccess={handleDocumentSuccess} 
      />
      <Navigation />
    </div>
  );
}
