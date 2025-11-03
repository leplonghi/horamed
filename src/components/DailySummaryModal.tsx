import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

interface PendingDose {
  id: string;
  name: string;
}

export default function DailySummaryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDoses, setPendingDoses] = useState<PendingDose[]>([]);

  useEffect(() => {
    // Check at 10 PM (22:00)
    const now = new Date();
    const currentHour = now.getHours();
    
    // Only check between 22:00 and 23:59
    if (currentHour === 22) {
      checkPendingDoses();
    }
  }, []);

  const checkPendingDoses = async () => {
    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: doses, error: dosesError } = await supabase
        .from("dose_instances")
        .select("id, item_id")
        .eq("user_id", user.id)
        .gte("due_at", today.toISOString())
        .lt("due_at", tomorrow.toISOString())
        .eq("status", "pending");

      if (dosesError) throw dosesError;

      if (doses && doses.length > 0) {
        // Fetch item names
        const itemIds = doses.map(d => d.item_id);
        const { data: items, error: itemsError } = await supabase
          .from("items")
          .select("id, name")
          .in("id", itemIds);

        if (itemsError) throw itemsError;

        const itemMap = new Map(items?.map(i => [i.id, i.name]));

        setPendingDoses(
          doses.map(d => ({
            id: d.id,
            name: itemMap.get(d.item_id) || "Medicamento"
          }))
        );
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error checking pending doses:", error);
    }
  };

  const handleMarkAllTaken = async () => {
    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );
      
      const { error } = await supabase
        .from("dose_instances")
        .update({ 
          status: "taken",
          taken_at: new Date().toISOString()
        })
        .in("id", pendingDoses.map(d => d.id));

      if (error) throw error;

      toast.success("✅ Todas as doses marcadas como tomadas!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error marking doses as taken:", error);
      toast.error("Erro ao marcar doses");
    }
  };

  const handleMarkAllMissed = async () => {
    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );
      
      const { error } = await supabase
        .from("dose_instances")
        .update({ status: "missed" })
        .in("id", pendingDoses.map(d => d.id));

      if (error) throw error;

      toast("⚠️ Doses marcadas como não tomadas");
      setIsOpen(false);
    } catch (error) {
      console.error("Error marking doses as missed:", error);
      toast.error("Erro ao marcar doses");
    }
  };

  if (pendingDoses.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🌙 Antes de dormir...</DialogTitle>
          <DialogDescription className="pt-2">
            Você ainda tem {pendingDoses.length} dose{pendingDoses.length > 1 ? 's' : ''} sem marcar hoje:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {pendingDoses.slice(0, 3).map(dose => (
            <div 
              key={dose.id} 
              className="p-2 bg-muted rounded-lg text-sm"
            >
              • {dose.name}
            </div>
          ))}
          {pendingDoses.length > 3 && (
            <div className="text-sm text-muted-foreground text-center">
              E mais {pendingDoses.length - 3}...
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleMarkAllTaken} className="w-full">
            ✓ Tomei todas
          </Button>
          <Button 
            onClick={handleMarkAllMissed} 
            variant="outline"
            className="w-full"
          >
            Não tomei
          </Button>
          <Button 
            onClick={() => setIsOpen(false)} 
            variant="ghost"
            className="w-full"
          >
            Deixar assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
