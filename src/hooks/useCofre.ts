import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Categoria {
  id: string;
  slug: string;
  label: string;
}

export interface DocumentoSaude {
  id: string;
  user_id: string;
  profile_id?: string;
  categoria_id?: string;
  title?: string;
  file_path: string;
  mime_type: string;
  issued_at?: string;
  expires_at?: string;
  provider?: string;
  notes?: string;
  ocr_text?: string;
  meta?: any;
  created_at: string;
  updated_at: string;
  categorias_saude?: Categoria;
  user_profiles?: { name: string };
}

export interface Compartilhamento {
  id: string;
  document_id: string;
  token: string;
  expires_at?: string;
  allow_download: boolean;
  created_at: string;
  revoked_at?: string;
}

export interface EventoSaude {
  id: string;
  user_id: string;
  profile_id?: string;
  type: "checkup" | "reforco_vacina" | "renovacao_exame" | "consulta";
  title: string;
  due_date: string;
  related_document_id?: string;
  notes?: string;
  created_at: string;
  completed_at?: string;
  user_profiles?: { name: string };
}

interface ListaDocumentosFilters {
  profileId?: string;
  categoria?: string;
  q?: string;
  exp?: "30" | "all";
}

// Listar documentos
export function useDocumentos(filters: ListaDocumentosFilters = {}) {
  return useQuery({
    queryKey: ["cofre", "lista", filters],
    queryFn: async () => {
      let query = supabase
        .from("documentos_saude")
        .select(`
          *,
          categorias_saude(id, slug, label),
          user_profiles(name)
        `)
        .order("created_at", { ascending: false });

      if (filters.profileId) {
        query = query.eq("profile_id", filters.profileId);
      }

      if (filters.categoria) {
        const { data: cat } = await supabase
          .from("categorias_saude")
          .select("id")
          .eq("slug", filters.categoria)
          .maybeSingle();
        if (cat) query = query.eq("categoria_id", cat.id);
      }

      if (filters.exp === "30") {
        const hoje = new Date();
        const em30Dias = new Date(hoje);
        em30Dias.setDate(hoje.getDate() + 30);
        query = query.gte("expires_at", hoje.toISOString().split("T")[0])
                    .lte("expires_at", em30Dias.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtro de busca full-text (client-side por simplicidade)
      let result = data || [];
      if (filters.q) {
        const q = filters.q.toLowerCase();
        result = result.filter(
          (d) =>
            d.title?.toLowerCase().includes(q) ||
            d.ocr_text?.toLowerCase().includes(q) ||
            d.provider?.toLowerCase().includes(q)
        );
      }

      return result as DocumentoSaude[];
    },
  });
}

// Obter documento por ID
export function useDocumento(id?: string) {
  return useQuery({
    queryKey: ["cofre", "doc", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("documentos_saude")
        .select(`
          *,
          categorias_saude(id, slug, label),
          user_profiles(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as DocumentoSaude;
    },
    enabled: !!id,
  });
}

// Upload de documento
export function useUploadDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      file: File;
      profileId?: string;
      categoriaSlug?: string;
      criarLembrete?: boolean;
      extractedData?: {
        title?: string;
        issued_at?: string;
        expires_at?: string;
        provider?: string;
        category?: string;
      };
    }) => {
      const { file, profileId, categoriaSlug, criarLembrete, extractedData } = params;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Verificar limite Free (5 documentos)
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type, status")
        .eq("user_id", user.id)
        .maybeSingle();

      const isPremium = subscription?.plan_type === "premium" && subscription?.status === "active";

      if (!isPremium) {
        const { count } = await supabase
          .from("documentos_saude")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (count && count >= 5) {
          throw new Error("LIMIT_REACHED");
        }
      }

      // Upload para storage
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cofre-saude")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Buscar categoria_id se fornecida
      let categoria_id = undefined;
      if (categoriaSlug || extractedData?.category) {
        const slug = categoriaSlug || extractedData?.category;
        const { data: cat } = await supabase
          .from("categorias_saude")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (cat) categoria_id = cat.id;
      }

      // Criar registro do documento com dados extraídos
      const { data: documento, error: docError } = await supabase
        .from("documentos_saude")
        .insert({
          user_id: user.id,
          profile_id: profileId,
          categoria_id,
          file_path: filePath,
          mime_type: file.type,
          title: extractedData?.title || file.name,
          issued_at: extractedData?.issued_at,
          expires_at: extractedData?.expires_at,
          provider: extractedData?.provider,
          meta: extractedData ? { extracted: extractedData } : undefined,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Chamar Edge Function para extrair metadados
      try {
        await supabase.functions.invoke("extrair-metadados-documento", {
          body: {
            documentId: documento.id,
            filePath,
            mimeType: file.type,
            categoriaSlug,
          },
        });
      } catch (e) {
        console.warn("Erro ao extrair metadados:", e);
      }

      return documento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cofre", "lista"] });
      toast.success("Documento enviado com sucesso");
    },
    onError: (error: any) => {
      if (error.message === "LIMIT_REACHED") {
        toast.error("Limite de 5 documentos atingido no plano Free. Faça upgrade!");
      } else {
        toast.error("Erro ao enviar documento");
      }
    },
  });
}

// Deletar documento
export function useDeletarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: doc } = await supabase
        .from("documentos_saude")
        .select("file_path")
        .eq("id", id)
        .maybeSingle();

      if (doc?.file_path) {
        await supabase.storage.from("cofre-saude").remove([doc.file_path]);
      }

      const { error } = await supabase.from("documentos_saude").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cofre"] });
      toast.success("Documento removido");
    },
  });
}

// Compartilhamentos
export function useCompartilhamentos(documentId?: string) {
  return useQuery({
    queryKey: ["cofre", "shares", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const { data, error } = await supabase
        .from("compartilhamentos_doc")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Compartilhamento[];
    },
    enabled: !!documentId,
  });
}

// Eventos próximos
export function useEventosProximos() {
  return useQuery({
    queryKey: ["eventos", "upcoming"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("eventos_saude")
        .select(`
          *,
          user_profiles(name)
        `)
        .is("completed_at", null)
        .gte("due_date", hoje)
        .order("due_date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as EventoSaude[];
    },
  });
}

// Completar evento
export function useCompletarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("eventos_saude")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      toast.success("Evento marcado como concluído");
    },
  });
}
