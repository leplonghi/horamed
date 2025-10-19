import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Upload, Filter, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCofre, DocumentoSaude } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";

export default function Cofre() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroExp, setFiltroExp] = useState<"30" | "all">("all");
  const { activeProfile } = useUserProfiles();
  
  const { useDocumentos } = useCofre();
  const { data: documentos, isLoading } = useDocumentos({
    profileId: activeProfile?.id,
    categoria: categoriaAtiva === "todos" ? undefined : categoriaAtiva,
    q: busca,
    exp: filtroExp,
  });

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("cofre-saude")
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const renderDocumentoCard = (doc: DocumentoSaude) => {
    const isExpiringSoon = doc.expires_at && new Date(doc.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return (
      <Link key={doc.id} to={`/cofre/${doc.id}`}>
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{doc.title || "Sem título"}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {doc.categorias_saude && (
                    <Badge variant="outline" className="text-xs">
                      {doc.categorias_saude.label}
                    </Badge>
                  )}
                  {isExpiringSoon && (
                    <Badge variant="destructive" className="text-xs">
                      Vence em breve
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  {doc.issued_at && (
                    <div>Emissão: {format(new Date(doc.issued_at), "dd/MM/yyyy", { locale: ptBR })}</div>
                  )}
                  {doc.expires_at && (
                    <div>Validade: {format(new Date(doc.expires_at), "dd/MM/yyyy", { locale: ptBR })}</div>
                  )}
                  {doc.provider && <div>Prestador: {doc.provider}</div>}
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
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Cofre de Saúde</h1>
            <p className="text-muted-foreground">Seus documentos médicos em um só lugar</p>
          </div>
          <Link to="/cofre/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </Link>
        </div>

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

          <TabsContent value={categoriaAtiva} className="space-y-4 mt-6">
            {isLoading ? (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            ) : documentos && documentos.length > 0 ? (
              documentos.map(renderDocumentoCard)
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum documento encontrado</p>
                  <Link to="/cofre/upload">
                    <Button className="mt-4">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar primeiro documento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Navigation />
    </div>
  );
}
