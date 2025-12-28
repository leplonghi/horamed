import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Calendar, Plus, Clock, AlertTriangle, FolderOpen, Edit, Search } from "lucide-react";
import AddHealthDocumentModal from "@/components/cofre/AddHealthDocumentModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentos, DocumentoSaude } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { usePrescriptionControl } from "@/hooks/usePrescriptionControl";
import { PrescriptionStatusBadge } from "@/components/PrescriptionStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import TutorialHint from "@/components/TutorialHint";
import HelpTooltip from "@/components/HelpTooltip";
import { microcopy } from "@/lib/microcopy";
import { motion } from "framer-motion";
import ContextualClara from "@/components/ContextualClara";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Cofre() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroExp, setFiltroExp] = useState<"30" | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();
  
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
  const { data: prescriptionStatus } = usePrescriptionControl(activeProfile?.id);
  
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
    return { total: allDocumentos.length, expiringSoon, needsReview, byCategory };
  }, [allDocumentos]);

  const getCategoryIcon = (categorySlug?: string) => {
    switch (categorySlug) {
      case "receita":
        return { emoji: "💊", label: t('cofre.categoryPrescription'), color: "text-doc-prescription-foreground", bg: "bg-doc-prescription-background", border: "border-doc-prescription-border" };
      case "exame":
        return { emoji: "🧪", label: t('cofre.categoryExam'), color: "text-doc-exam-foreground", bg: "bg-doc-exam-background", border: "border-doc-exam-border" };
      case "vacinacao":
        return { emoji: "💉", label: t('cofre.categoryVaccine'), color: "text-doc-vaccine-foreground", bg: "bg-doc-vaccine-background", border: "border-doc-vaccine-border" };
      case "consulta":
        return { emoji: "🩺", label: t('cofre.categoryConsultation'), color: "text-doc-consultation-foreground", bg: "bg-doc-consultation-background", border: "border-doc-consultation-border" };
      default:
        return { emoji: "📋", label: t('cofre.categoryDocument'), color: "text-doc-other-foreground", bg: "bg-doc-other-background", border: "border-doc-other-border" };
    }
  };

  const renderDocumentoCard = (doc: DocumentoSaude, index: number) => {
    const isExpiringSoon = doc.expires_at && new Date(doc.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const needsReview = doc.status_extraction === "pending_review";
    const isReviewed = doc.status_extraction === "reviewed";
    const prescStatus = prescriptionStatus?.find(ps => ps.id === doc.id);
    const isPrescription = doc.categorias_saude?.slug === "receita";
    const category = getCategoryIcon(doc.categorias_saude?.slug);

    return (
      <motion.div
        key={doc.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link to={`/carteira/${doc.id}`}>
          <div 
            className={`relative rounded-2xl bg-card/80 backdrop-blur-sm p-4 group hover-lift transition-all border-l-4 ${category.border}`}
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-3 right-3 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-xl" 
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/carteira/${doc.id}/editar`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-4">
              <div className={`w-14 h-14 rounded-xl ${category.bg} flex items-center justify-center flex-shrink-0 border ${category.border}`}>
                <span className="text-2xl">{category.emoji}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate mb-2">{doc.title || t('cofre.noTitle')}</h3>
                
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`pill text-xs ${category.color}`}>
                    {category.label}
                  </span>
                  {needsReview && (
                    <span className="pill-warning text-xs">👁️ {t('cofre.reviewBadge')}</span>
                  )}
                  {isReviewed && (
                    <span className="pill-success text-xs">✓ {t('cofre.reviewedBadge')}</span>
                  )}
                  {isExpiringSoon && (
                    <span className="pill-destructive text-xs">⏰ {t('cofre.expiresSoon')}</span>
                  )}
                  {isPrescription && prescStatus && (
                    <PrescriptionStatusBadge 
                      status={prescStatus.status} 
                      daysUntilExpiry={prescStatus.daysUntilExpiry} 
                      isDuplicate={prescStatus.isDuplicate} 
                      isPurchased={prescStatus.isPurchased} 
                      className="text-xs" 
                    />
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  {doc.issued_at && (
                    <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>{t('cofre.issuedAt')}: {format(new Date(doc.issued_at), "dd/MM/yyyy", { locale: dateLocale })}</span>
                    </div>
                  )}
                  {doc.expires_at && (
                    <div className="flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>{t('cofre.validUntil')}: {format(new Date(doc.expires_at), "dd/MM/yyyy", { locale: dateLocale })}</span>
                    </div>
                  )}
                  {doc.provider && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span>🏥</span>
                      <span className="truncate">{doc.provider}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <Header />
      
      <div className="container max-w-4xl mx-auto pt-20 sm:pt-24 pb-6 space-y-6 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{t('cofre.title')}</h1>
              <HelpTooltip 
                content={t('cofre.howItWorksDesc')} 
                iconSize="lg"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('cofre.subtitle')}
            </p>
          </div>
          <Button 
            size="lg" 
            className="gap-2 rounded-xl hover-lift hidden sm:flex" 
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-5 h-5" />
            {t('cofre.addDocument')}
          </Button>
        </div>

        {/* Clara Contextual */}
        <ContextualClara context="cofre" />

        {/* Explicação didática */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{t('cofre.howItWorks')}</p>
              <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('cofre.howItWorksDesc') }} />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 hover-lift"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <FolderOpen className="w-4 h-4" />
                <span className="text-sm">{t('cofre.total')}</span>
              </div>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('cofre.documents')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-4 hover-lift"
              style={{ 
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: 'hsl(var(--destructive) / 0.1)'
              }}
            >
              <div className="flex items-center gap-2 mb-2 text-destructive">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{t('cofre.expiring')}</span>
                <HelpTooltip content={microcopy.help.cofre.expiring} />
              </div>
              <div className="text-3xl font-bold text-destructive">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('cofre.in30days')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-4 hover-lift"
              style={{ 
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: 'hsl(var(--warning) / 0.1)'
              }}
            >
              <div className="flex items-center gap-2 mb-2 text-warning">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{t('cofre.review')}</span>
                <HelpTooltip content={microcopy.help.cofre.review} />
              </div>
              <div className="text-3xl font-bold text-warning">{stats.needsReview}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('cofre.pending')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 hover-lift"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{t('cofre.categories')}</span>
              </div>
              <div className="text-3xl font-bold">{Object.keys(stats.byCategory).length}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('cofre.types')}</p>
            </motion.div>
          </div>
        )}

        <TutorialHint 
          id={t('tutorials.cofre.id')} 
          title={t('tutorials.cofre.title')} 
          message={t('tutorials.cofre.message')} 
        />

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('cofre.searchDocuments')} 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="pl-10 rounded-full border-2 focus:border-primary transition-all"
            />
          </div>
          <Button 
            variant={filtroExp === "30" ? "default" : "outline"} 
            size="icon" 
            className="rounded-full"
            onClick={() => setFiltroExp(filtroExp === "30" ? "all" : "30")}
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={categoriaAtiva} onValueChange={setCategoriaAtiva}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1.5 rounded-2xl bg-muted/50">
            <TabsTrigger value="todos" className="rounded-xl">{t('cofre.all')}</TabsTrigger>
            <TabsTrigger value="vacinacao" className="rounded-xl">{t('cofre.vaccines')}</TabsTrigger>
            <TabsTrigger value="exame" className="rounded-xl">{t('cofre.exams')}</TabsTrigger>
            <TabsTrigger value="receita" className="rounded-xl">{t('cofre.prescriptions')}</TabsTrigger>
            <TabsTrigger value="consulta" className="rounded-xl">{t('cofre.consultations')}</TabsTrigger>
          </TabsList>

          <TabsContent value={categoriaAtiva} className="space-y-3 mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            ) : documentos && documentos.length > 0 ? (
              documentos.map((doc, index) => renderDocumentoCard(doc, index))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-card/80 backdrop-blur-sm p-8 text-center"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium mb-2">{t('cofre.noDocumentFound')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('cofre.clickToAdd')}
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB Mobile */}
      <Button 
        size="lg" 
        onClick={() => setShowAddModal(true)} 
        className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-xl hover-lift"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <AddHealthDocumentModal open={showAddModal} onOpenChange={setShowAddModal} onSuccess={handleDocumentSuccess} />
      <Navigation />
    </div>
  );
}