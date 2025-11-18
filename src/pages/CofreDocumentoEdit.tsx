import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumento } from "@/hooks/useCofre";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function CofreDocumentoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: documento, isLoading } = useDocumento(id);

  const [formData, setFormData] = useState({
    title: "",
    categoria_id: "",
    provider: "",
    issued_at: "",
    expires_at: "",
    notes: "",
  });

  // Fetch categories
  const { data: categorias } = useQuery({
    queryKey: ["categorias_saude"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_saude")
        .select("*")
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (documento) {
      setFormData({
        title: documento.title || "",
        categoria_id: documento.categoria_id || "",
        provider: documento.provider || "",
        issued_at: documento.issued_at ? documento.issued_at.split("T")[0] : "",
        expires_at: documento.expires_at ? documento.expires_at.split("T")[0] : "",
        notes: documento.notes || "",
      });
    }
  }, [documento]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("documentos_saude")
        .update({
          title: data.title,
          categoria_id: data.categoria_id || null,
          provider: data.provider || null,
          issued_at: data.issued_at || null,
          expires_at: data.expires_at || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documento", id] });
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Documento atualizado com sucesso!");
      navigate(`/cofre/${id}`);
    },
    onError: () => {
      toast.error("Erro ao atualizar documento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
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
        <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
          <p>Documento não encontrado</p>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
        <Button variant="ghost" onClick={() => navigate(`/cofre/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Editar Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Digite o título do documento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Prestador</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="Ex: Hospital, Clínica, Laboratório"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issued_at">Data de Emissão</Label>
                  <Input
                    id="issued_at"
                    type="date"
                    value={formData.issued_at}
                    onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Data de Validade</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Adicione observações sobre este documento"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/cofre/${id}`)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
}
