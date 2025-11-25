import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Scale } from "lucide-react";

interface WeightRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  onSuccess?: () => void;
}

export default function WeightRegistrationModal({
  open,
  onOpenChange,
  profileId,
  onSuccess,
}: WeightRegistrationModalProps) {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      toast.error("Por favor, informe um peso válido");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const weightValue = parseFloat(weight);

      // Get previous weight for comparison
      let prevQuery = supabase
        .from("weight_logs")
        .select("weight_kg")
        .eq("user_id", user.id);
      
      if (profileId) {
        prevQuery = prevQuery.eq("profile_id", profileId);
      } else {
        prevQuery = prevQuery.is("profile_id", null);
      }
      
      const { data: previousLog } = await prevQuery
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Insert new weight log
      const { error } = await supabase
        .from("weight_logs")
        .insert({
          user_id: user.id,
          profile_id: profileId || null,
          weight_kg: weightValue,
          notes: notes.trim() || null,
          recorded_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Calculate difference
      let message = "Peso registrado com sucesso!";
      if (previousLog?.weight_kg) {
        const diff = weightValue - previousLog.weight_kg;
        if (diff > 0) {
          message = `Peso atualizado! +${diff.toFixed(1)} kg desde a última medição.`;
        } else if (diff < 0) {
          message = `Peso atualizado! ${diff.toFixed(1)} kg desde a última medição.`;
        }
      }

      toast.success(message);
      setWeight("");
      setNotes("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving weight:", error);
      toast.error("Erro ao salvar peso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Registrar novo peso
          </DialogTitle>
          <DialogDescription>
            Use este espaço para registrar o peso sempre que se pesar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-base font-medium">
              Peso (kg) *
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              max="500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 70.5"
              className="text-2xl h-14 text-center"
              inputMode="decimal"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Após café da manhã, com roupa leve..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !weight}
            className="gap-2"
          >
            <Scale className="h-4 w-4" />
            {loading ? "Salvando..." : "Salvar peso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
