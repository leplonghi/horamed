import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, isAfter, isBefore } from "date-fns";

export interface PrescriptionStatus {
  id: string;
  title: string;
  issued_at: string | null;
  expires_at: string | null;
  status: 'valid' | 'expiring_soon' | 'expired';
  daysUntilExpiry: number;
  medications: any[];
  isDuplicate: boolean;
  duplicateOf?: string;
  isPurchased: boolean;
}

export function usePrescriptionControl(profileId?: string) {
  return useQuery({
    queryKey: ["prescription-control", profileId],
    queryFn: async () => {
      const now = new Date();
      
      let query = supabase
        .from("documentos_saude")
        .select("id, title, issued_at, expires_at, meta, created_at")
        .eq("categoria_id", "receita")
        .order("created_at", { ascending: false });

      if (profileId) {
        query = query.eq("profile_id", profileId);
      }

      const { data: prescriptions, error } = await query;
      if (error) throw error;

      const statusList: PrescriptionStatus[] = [];
      const medicationMap = new Map<string, string[]>(); // medication name -> prescription IDs

      for (const prescription of prescriptions || []) {
        const medications = (prescription.meta as any)?.medications || [];
        const isPurchased = (prescription.meta as any)?.is_purchased === true;
        
        let status: 'valid' | 'expiring_soon' | 'expired' = 'valid';
        let daysUntilExpiry = Infinity;

        if (prescription.expires_at) {
          const expiryDate = parseISO(prescription.expires_at);
          daysUntilExpiry = differenceInDays(expiryDate, now);

          if (isBefore(expiryDate, now)) {
            status = 'expired';
          } else if (daysUntilExpiry <= 7) {
            status = 'expiring_soon';
          }
        }

        // Verificar duplicatas baseado nos medicamentos
        let isDuplicate = false;
        let duplicateOf: string | undefined;

        for (const med of medications) {
          const medName = (med.name || '').toLowerCase().trim();
          if (medName) {
            const existingPrescriptions = medicationMap.get(medName) || [];
            if (existingPrescriptions.length > 0) {
              isDuplicate = true;
              duplicateOf = existingPrescriptions[0];
            }
            existingPrescriptions.push(prescription.id);
            medicationMap.set(medName, existingPrescriptions);
          }
        }

        statusList.push({
          id: prescription.id,
          title: prescription.title || "Receita sem título",
          issued_at: prescription.issued_at,
          expires_at: prescription.expires_at,
          status,
          daysUntilExpiry,
          medications,
          isDuplicate,
          duplicateOf,
          isPurchased
        });
      }

      return statusList;
    },
  });
}

export function useExpiredPrescriptions(profileId?: string) {
  return useQuery({
    queryKey: ["expired-prescriptions", profileId],
    queryFn: async () => {
      const now = new Date();
      
      let query = supabase
        .from("documentos_saude")
        .select("id, title, issued_at, expires_at, meta")
        .eq("categoria_id", "receita")
        .not("expires_at", "is", null)
        .order("expires_at", { ascending: true });

      if (profileId) {
        query = query.eq("profile_id", profileId);
      }

      const { data: prescriptions, error } = await query;
      if (error) throw error;

      // Filtrar receitas vencidas que não foram compradas
      const expired = (prescriptions || []).filter(p => {
        if (!p.expires_at) return false;
        const isPurchased = (p.meta as any)?.is_purchased === true;
        const isExpired = isBefore(parseISO(p.expires_at), now);
        return isExpired && !isPurchased;
      });

      return expired.map(p => ({
        id: p.id,
        title: p.title || "Receita sem título",
        expires_at: p.expires_at,
        medications: (p.meta as any)?.medications || [],
        daysExpired: Math.abs(differenceInDays(parseISO(p.expires_at!), now))
      }));
    },
  });
}
