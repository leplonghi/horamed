import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";

interface Category {
  id: string;
  slug: string;
  label: string;
}

export default function CofreManualCreate() {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    categoria_id: "",
    provider: "",
    issued_at: "",
    expires_at: "",
    notes: ""
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categorias_saude")
      .select("*")
      .order("label");
    
    if (data) {
      setCategories(data);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Por favor, adicione um título");
      return;
    }

    if (!activeProfile?.id) {
      toast.error("Selecione um perfil primeiro");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const documentData = {
        user_id: user.id,
        profile_id: activeProfile.id,
        title: formData.title.trim(),
        categoria_id: formData.categoria_id || null,
        provider: formData.provider.trim() || null,
        issued_at: formData.issued_at || null,
        expires_at: formData.expires_at || null,
        notes: formData.notes.trim() || null,
        file_path: "", // Documento sem arquivo
        mime_type: "text/plain",
        status_extraction: "manual"
      };

      const { data, error } = await supabase
        .from("documentos_saude")
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Documento criado com sucesso!");
      navigate(`/carteira/${data.id}`);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      toast.error("Erro ao criar documento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />
      
      <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Adicionar Documento Manualmente</h1>
          <p className="text-muted-foreground text-sm">
            Preencha as informações do documento sem fazer upload de arquivo
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Receita médica, Exame de sangue..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
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
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Local/Médico</Label>
              <Input
                id="provider"
                placeholder="Ex: Hospital São Lucas, Dr. João Silva..."
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                maxLength={200}
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
                placeholder="Adicione qualquer informação relevante..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.notes.length}/1000
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Documento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
