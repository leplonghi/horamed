import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AlertSeverity = "critical" | "urgent" | "warning";

export interface CriticalAlert {
  id: string;
  type: "duplicate_dose" | "zero_stock" | "missed_essential" | "drug_interaction";
  severity: AlertSeverity;
  title: string;
  message: string;
  itemId?: string;
  itemName?: string;
  action?: () => void;
}

export function useCriticalAlerts() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCriticalAlerts();
    const interval = setInterval(checkCriticalAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkCriticalAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newAlerts: CriticalAlert[] = [];

      // Get user health profile for age/BMI-based alerts
      const { data: profile } = await supabase
        .from("profiles")
        .select("birth_date, weight_kg, height_cm")
        .eq("user_id", user.id)
        .single();

      let age = null;
      let bmi = null;
      if (profile?.birth_date) {
        const birthDate = new Date(profile.birth_date);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear() - 
          (today.getMonth() < birthDate.getMonth() || 
           (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
      }
      if (profile?.weight_kg && profile?.height_cm) {
        const heightM = profile.height_cm / 100;
        bmi = profile.weight_kg / (heightM * heightM);
      }

      // Check for zero stock on active medications
      const { data: items } = await supabase
        .from("items")
        .select(`
          id,
          name,
          is_active,
          stock (units_left)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      items?.forEach((item: any) => {
        if (item.stock?.[0] && item.stock[0].units_left === 0) {
          newAlerts.push({
            id: `stock_${item.id}`,
            type: "zero_stock",
            severity: "critical",
            title: "Estoque zerado",
            message: `${item.name} está sem estoque. Você não pode registrar doses até reabastecer.`,
            itemId: item.id,
            itemName: item.name,
          });
        }
      });

      // Check for missed critical doses (last 4 hours)
      const fourHoursAgo = new Date();
      fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

      const { data: missedDoses } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          item_id,
          items!inner(name, user_id, category)
        `)
        .eq("items.user_id", user.id)
        .eq("status", "scheduled")
        .lt("due_at", new Date().toISOString())
        .gte("due_at", fourHoursAgo.toISOString());

      missedDoses?.forEach((dose: any) => {
        // Consider medications as more critical than other items
        const isCritical = dose.items.category === "medicamento";
        
        if (isCritical) {
          const hoursMissed = Math.floor(
            (new Date().getTime() - new Date(dose.due_at).getTime()) / (1000 * 60 * 60)
          );

          // Enhanced severity for elderly patients
          let severity: AlertSeverity = hoursMissed >= 2 ? "critical" : "urgent";
          let message = `${dose.items.name} está ${hoursMissed}h atrasado. Tome assim que possível.`;
          
          if (age && age >= 65 && hoursMissed >= 2) {
            severity = "critical";
            message = `⚠️ ATENÇÃO IDOSO: ${dose.items.name} está ${hoursMissed}h atrasado. Doses perdidas são mais perigosas em idosos. Tome imediatamente.`;
          }

          newAlerts.push({
            id: `missed_${dose.id}`,
            type: "missed_essential",
            severity,
            title: age && age >= 65 ? "Dose crítica atrasada (Idoso)" : "Dose atrasada",
            message,
            itemId: dose.item_id,
            itemName: dose.items.name,
          });
        }
      });

      // Check for recent duplicate doses (within 4 hours)
      const { data: recentDoses } = await supabase
        .from("dose_instances")
        .select(`
          id,
          item_id,
          taken_at,
          items!inner(name, user_id)
        `)
        .eq("items.user_id", user.id)
        .eq("status", "taken")
        .gte("taken_at", fourHoursAgo.toISOString());

      // Group by item_id to check for duplicates
      const dosesByItem = new Map<string, any[]>();
      recentDoses?.forEach((dose: any) => {
        if (!dosesByItem.has(dose.item_id)) {
          dosesByItem.set(dose.item_id, []);
        }
        dosesByItem.get(dose.item_id)?.push(dose);
      });

      dosesByItem.forEach((doses, itemId) => {
        if (doses.length >= 2) {
          const lastDose = doses[doses.length - 1];
          const secondLastDose = doses[doses.length - 2];
          
          const timeDiff = Math.abs(
            new Date(lastDose.taken_at).getTime() - 
            new Date(secondLastDose.taken_at).getTime()
          ) / (1000 * 60 * 60);

          if (timeDiff < 4) {
            newAlerts.push({
              id: `duplicate_${itemId}`,
              type: "duplicate_dose",
              severity: "warning",
              title: "Possível dose duplicada",
              message: `Você registrou ${lastDose.items.name} há menos de 4 horas. Verifique se está correto.`,
              itemId,
              itemName: lastDose.items.name,
            });
          }
        }
      });

      // Age-based general alerts
      if (age && age >= 65 && items && items.length >= 3) {
        newAlerts.push({
          id: "elderly_polypharmacy",
          type: "drug_interaction",
          severity: "warning",
          title: "Alerta: Múltiplos medicamentos (Idoso)",
          message: `Você tem ${items.length} medicamentos ativos. Idosos têm maior risco de interações. Revise com seu médico regularmente.`,
        });
      }

      // BMI-based alerts
      if (bmi && items && items.length > 0) {
        if (bmi < 18.5) {
          newAlerts.push({
            id: "underweight_dosage",
            type: "drug_interaction",
            severity: "warning",
            title: "Alerta: Baixo peso",
            message: "Seu IMC indica baixo peso. Algumas dosagens podem precisar de ajuste. Consulte seu médico.",
          });
        } else if (bmi > 30) {
          newAlerts.push({
            id: "obesity_dosage",
            type: "drug_interaction",
            severity: "warning",
            title: "Alerta: Dosagem e Peso",
            message: "Alguns medicamentos têm dosagem ajustada pelo peso. Verifique com seu médico se suas doses estão adequadas.",
          });
        }
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error checking critical alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  return {
    alerts,
    loading,
    refresh: checkCriticalAlerts,
    dismissAlert,
  };
}
