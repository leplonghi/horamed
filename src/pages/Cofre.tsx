import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Calendar, Plus, Clock, AlertTriangle, FolderOpen, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentos, DocumentoSaude } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import TutorialHint from "@/components/TutorialHint";

export default function Cofre() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroExp, setFiltroExp] = useState<"30" | "all">("all");
  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();
  
  const { data: allDocumentos } = useDocumentos({
    profileId: activeProfile?.id,
  });

  const { data: documentos, isLoading } = useDocumentos({
    profileId: activeProfile?.id,
    categoria: categoriaAtiva === "todos" ? undefined : categoriaAtiva,
    q: busca,
    exp: filtroExp,
  });

  const stats = useMemo(() => {
    if (!allDocumentos) return null;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = allDocumentos.filter(doc => 
      doc.expires_at && new Date(doc.expires_at) <= thirtyDaysFromNow && new Date(doc.expires_at) > now
    ).length;
    
    const needsReview = allDocumentos.filter(doc => 
      doc.status_extraction === "pending_review"
    ).length;
    
    const byCategory = allDocumentos.reduce((acc, doc) => {
      const slug = doc.categorias_saude?.slug || "outros";
      acc[slug] = (acc[slug] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: allDocumentos.length,
      expiringSoon,
      needsReview,
      byCategory,
    };
  }, [allDocumentos]);

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("cofre-saude")
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const renderDocumentoCard = (doc: DocumentoSaude) => {
    const isExpiringSoon = doc.expires_at && new Date(doc.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const needsReview = doc.status_extraction === "pending_review";
    
    const getCategoryIcon = (categorySlug?: string) => {
      switch (categorySlug) {
        case "receita":
          return "💊";
        case "exame":
          return "🧪";
        case "vacinacao":
          return "💉";
        case "consulta":
          return "🩺";
        default:
          return "📋";
      }
    };

    return (
      <Link key={doc.id} to={`/cofre/${doc.id}`}>
        <Card className="hover:shadow-lg transition-all cursor-pointer relative group">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/cofre/${doc.id}/editar`);
            }}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <CardContent className="p-3">
            <div className="flex gap-2.5">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{getCategoryIcon(doc.categorias_saude?.slug)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{doc.title || "Sem título"}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {doc.categorias_saude && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      {doc.categorias_saude.label}
                    </Badge>
                  )}
                  {needsReview && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
                      Revisar
                    </Badge>
                  )}
                  {isExpiringSoon && (
                    <Badge variant="destructive" className="text-[10px] h-5">
                      Vence em breve
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 space-y-0.5">
                  {doc.issued_at && (
                    <div>Emissão: {format(new Date(doc.issued_at), "dd/MM/yyyy", { locale: ptBR })}</div>
                  )}
                  {doc.expires_at && (
                    <div>Validade: {format(new Date(doc.expires_at), "dd/MM/yyyy", { locale: ptBR })}</div>
                  )}
                  {doc.provider && <div className="truncate">📍 {doc.provider}</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Cofre de Saúde 🔒</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Seus documentos médicos organizados e seguros
            </p>
          </div>
          <Link to="/cofre/upload">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </Link>
        </div>

        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
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
          </div>
        )}

        <TutorialHint
          id="cofre_page"
          title="Seu cofre digital seguro 🔒"
          message="Guarde exames, receitas, vacinas e consultas aqui. Compartilhe facilmente com médicos quando precisar! Tudo com segurança e privacidade."
        />

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Buscar documentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1"
          />
          <Button
            variant={filtroExp === "30" ? "default" : "outline"}
            size="icon"
            onClick={() => setFiltroExp(filtroExp === "30" ? "all" : "30")}
          >
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
            {isLoading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : documentos && documentos.length > 0 ? (
              documentos.map(renderDocumentoCard)
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Nenhum documento encontrado</p>
                  <p className="text-xs text-muted-foreground">
                    Clique em "Adicionar Documento" acima para começar
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Botão flutuante mobile */}
      <Link to="/cofre/upload" className="md:hidden">
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>

      <Navigation />
    </div>
  );
}
