import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { VaccineReminder } from "./useVaccineReminders";

interface CaregiverVaccineReminder extends VaccineReminder {
  owner_name: string;
  profile_name: string;
}

export function useCaregiverVaccineReminders() {
  return useQuery({
    queryKey: ["caregiver-vaccine-reminders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Buscar perfis dos usuários que o usuário atual é cuidador
      const { data: caregiverRelations, error: caregiverError } = await supabase
        .from("caregivers")
        .select("user_id_owner")
        .eq("caregiver_user_id", user.id)
        .not("accepted_at", "is", null);

      if (caregiverError) throw caregiverError;
      if (!caregiverRelations || caregiverRelations.length === 0) return [];

      const ownerUserIds = caregiverRelations.map(rel => rel.user_id_owner);

      // Buscar perfis desses usuários
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, user_id, name")
        .in("user_id", ownerUserIds);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      const profileIds = profiles.map(p => p.id);

      // Buscar vacinas desses perfis com próximas doses
      const { data: vaccines, error: vaccinesError } = await supabase
        .from("vaccination_records")
        .select("id, user_id, profile_id, vaccine_name, dose_description, next_dose_date")
        .in("profile_id", profileIds)
        .not("next_dose_date", "is", null)
        .gte("next_dose_date", now.toISOString().split('T')[0])
        .lte("next_dose_date", thirtyDaysFromNow.toISOString().split('T')[0])
        .order("next_dose_date", { ascending: true });

      if (vaccinesError) throw vaccinesError;

      // Enriquecer com informações do perfil
      const reminders: CaregiverVaccineReminder[] = (vaccines || []).map(vaccine => {
        const profile = profiles.find(p => p.id === vaccine.profile_id);
        const daysUntil = differenceInDays(parseISO(vaccine.next_dose_date), now);
        let urgency: 'high' | 'medium' | 'low' = 'low';

        if (daysUntil <= 7) {
          urgency = 'high';
        } else if (daysUntil <= 15) {
          urgency = 'medium';
        }

        return {
          ...vaccine,
          daysUntil,
          urgency,
          owner_name: "Dependente",
          profile_name: profile?.name || "Perfil"
        };
      });

      return reminders;
    },
  });
}
