import { supabase } from "@/integrations/supabase/client";

/**
 * Decrement stock and recalculate projected_end_at
 * Centralizes stock management logic to avoid duplication
 */
export async function decrementStockWithProjection(itemId: string): Promise<{
  success: boolean;
  newUnitsLeft?: number;
  projectedEndAt?: string;
}> {
  try {
    // Get current stock
    const { data: stockData, error: fetchError } = await supabase
      .from("stock")
      .select("id, units_left, item_id")
      .eq("item_id", itemId)
      .single();

    if (fetchError || !stockData) {
      console.log("[Stock] No stock found for item:", itemId);
      return { success: true }; // Not an error, just no stock tracking
    }

    if (stockData.units_left <= 0) {
      console.log("[Stock] Stock already at 0 for item:", itemId);
      return { success: true, newUnitsLeft: 0 };
    }

    const newUnitsLeft = stockData.units_left - 1;

    // Calculate new projected end date
    const projectedEndAt = await calculateProjectedEndAt(itemId, newUnitsLeft);

    // Update stock with both values
    const { error: updateError } = await supabase
      .from("stock")
      .update({
        units_left: newUnitsLeft,
        projected_end_at: projectedEndAt,
        updated_at: new Date().toISOString()
      })
      .eq("id", stockData.id);

    if (updateError) {
      console.error("[Stock] Error updating stock:", updateError);
      return { success: false };
    }

    return {
      success: true,
      newUnitsLeft,
      projectedEndAt: projectedEndAt || undefined
    };
  } catch (error) {
    console.error("[Stock] Error in decrementStockWithProjection:", error);
    return { success: false };
  }
}

/**
 * Calculate projected end date based on consumption rate
 */
async function calculateProjectedEndAt(itemId: string, unitsLeft: number): Promise<string | null> {
  if (unitsLeft <= 0) {
    return new Date().toISOString();
  }

  try {
    // Get daily consumption from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: takenDoses } = await supabase
      .from("dose_instances")
      .select("*", { count: "exact", head: true })
      .eq("item_id", itemId)
      .eq("status", "taken")
      .gte("taken_at", sevenDaysAgo.toISOString());

    let dailyConsumption = (takenDoses || 0) / 7;

    // If no consumption history, estimate from schedules
    if (dailyConsumption === 0) {
      const { data: schedules } = await supabase
        .from("schedules")
        .select("times")
        .eq("item_id", itemId)
        .eq("is_active", true);

      if (schedules) {
        dailyConsumption = schedules.reduce((acc, s) => {
          const times = s.times as string[] || [];
          return acc + times.length;
        }, 0);
      }

      if (dailyConsumption === 0) {
        dailyConsumption = 1; // Default to 1 dose per day
      }
    }

    const daysRemaining = unitsLeft / dailyConsumption;
    const projectedEnd = new Date();
    projectedEnd.setDate(projectedEnd.getDate() + daysRemaining);

    return projectedEnd.toISOString();
  } catch (error) {
    console.error("[Stock] Error calculating projected end:", error);
    return null;
  }
}

/**
 * Recalculate projected_end_at for a stock item (call after manual stock updates)
 */
export async function recalculateStockProjection(itemId: string): Promise<void> {
  const { data: stockData } = await supabase
    .from("stock")
    .select("id, units_left")
    .eq("item_id", itemId)
    .single();

  if (!stockData) return;

  const projectedEndAt = await calculateProjectedEndAt(itemId, stockData.units_left);

  await supabase
    .from("stock")
    .update({ projected_end_at: projectedEndAt })
    .eq("id", stockData.id);
}
