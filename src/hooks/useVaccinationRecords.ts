import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VaccinationRecord {
  id: string;
  user_id: string;
  profile_id?: string;
  document_id?: string;
  vaccine_name: string;
  vaccine_type?: 'adulto' | 'infantil';
  disease_prevention?: string;
  dose_number?: number;
  dose_description?: string;
  application_date: string;
  next_dose_date?: string;
  vaccination_location?: string;
  vaccinator_name?: string;
  vaccinator_registration?: string;
  batch_number?: string;
  manufacturer?: string;
  expiry_date?: string;
  notes?: string;
  adverse_reactions?: string;
  sus_card_number?: string;
  official_source?: string;
  created_at: string;
  updated_at: string;
}

export function useVaccinationRecords(profileId?: string) {
  return useQuery({
    queryKey: ["vaccination-records", profileId],
    queryFn: async () => {
      let query = supabase
        .from("vaccination_records")
        .select("*")
        .order("application_date", { ascending: false });

      if (profileId) {
        query = query.eq("profile_id", profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VaccinationRecord[];
    },
  });
}

export function useVaccinationRecordsByType(vaccineType: 'adulto' | 'infantil', profileId?: string) {
  return useQuery({
    queryKey: ["vaccination-records", vaccineType, profileId],
    queryFn: async () => {
      let query = supabase
        .from("vaccination_records")
        .select("*")
        .eq("vaccine_type", vaccineType)
        .order("application_date", { ascending: false });

      if (profileId) {
        query = query.eq("profile_id", profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VaccinationRecord[];
    },
  });
}

export function useCreateVaccinationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Partial<VaccinationRecord>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("vaccination_records")
        .insert({ ...record, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccination-records"] });
      toast.success("Vacina registrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao registrar vacina:", error);
      toast.error("Erro ao registrar vacina");
    },
  });
}

export function useUpdateVaccinationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...record }: Partial<VaccinationRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("vaccination_records")
        .update(record)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccination-records"] });
      toast.success("Vacina atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar vacina:", error);
      toast.error("Erro ao atualizar vacina");
    },
  });
}

export function useDeleteVaccinationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vaccination_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccination-records"] });
      toast.success("Registro excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir registro");
    },
  });
}
