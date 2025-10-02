import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AddItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dose_text: "",
    with_food: false,
    notes: "",
    times: ["08:00"],
    freq_type: "daily",
    stock_enabled: false,
    units_total: 0,
    unit_label: "unidades",
  });

  const addTimeField = () => {
    setFormData({
      ...formData,
      times: [...formData.times, "12:00"],
    });
  };

  const removeTimeField = (index: number) => {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index),
    });
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({ ...formData, times: newTimes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Digite o nome do item");
      return;
    }

    if (formData.times.length === 0) {
      toast.error("Adicione pelo menos um horário");
      return;
    }

    setLoading(true);

    try {
      // Create item
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: "temp-user-id", // Will be replaced with auth.uid() later
          name: formData.name,
          dose_text: formData.dose_text || null,
          with_food: formData.with_food,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Create schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedules")
        .insert({
          item_id: item.id,
          freq_type: formData.freq_type,
          times: formData.times,
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Generate dose instances for the next 7 days
      const doseInstances = [];
      const now = new Date();

      for (let day = 0; day < 7; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);

        for (const time of formData.times) {
          const [hours, minutes] = time.split(":").map(Number);
          const dueAt = new Date(date);
          dueAt.setHours(hours, minutes, 0, 0);

          // Only add future doses
          if (dueAt > now) {
            doseInstances.push({
              schedule_id: schedule.id,
              item_id: item.id,
              due_at: dueAt.toISOString(),
              status: "scheduled",
            });
          }
        }
      }

      if (doseInstances.length > 0) {
        const { error: dosesError } = await supabase
          .from("dose_instances")
          .insert(doseInstances);

        if (dosesError) throw dosesError;
      }

      // Create stock if enabled
      if (formData.stock_enabled && formData.units_total > 0) {
        const { error: stockError } = await supabase.from("stock").insert({
          item_id: item.id,
          units_total: formData.units_total,
          units_left: formData.units_total,
          unit_label: formData.unit_label,
        });

        if (stockError) throw stockError;
      }

      toast.success("Item adicionado com sucesso! 🎉");
      navigate("/rotina");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Erro ao adicionar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Adicionar Item</h1>
            <p className="text-muted-foreground">
              Medicamento, suplemento ou vitamina
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do item *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Creatina, Ômega 3, Vitamina D"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dose">Dosagem</Label>
                <Input
                  id="dose"
                  placeholder="Ex: 5g, 1000mg, 2 cápsulas"
                  value={formData.dose_text}
                  onChange={(e) =>
                    setFormData({ ...formData, dose_text: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="with-food">Tomar com alimento</Label>
                  <p className="text-sm text-muted-foreground">
                    Requer ingestão com refeição
                  </p>
                </div>
                <Switch
                  id="with-food"
                  checked={formData.with_food}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, with_food: checked })
                  }
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <Label>Horários</Label>
              </div>

              {formData.times.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => updateTime(index, e.target.value)}
                    className="flex-1"
                  />
                  {formData.times.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeField(index)}
                      className="text-destructive"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addTimeField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar horário
              </Button>
            </div>

            {/* Stock */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="stock-enabled">Controlar estoque</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas quando estiver acabando
                  </p>
                </div>
                <Switch
                  id="stock-enabled"
                  checked={formData.stock_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, stock_enabled: checked })
                  }
                />
              </div>

              {formData.stock_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units">Quantidade total</Label>
                    <Input
                      id="units"
                      type="number"
                      min="0"
                      value={formData.units_total}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          units_total: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-label">Unidade</Label>
                    <Input
                      id="unit-label"
                      placeholder="cápsulas, comprimidos..."
                      value={formData.unit_label}
                      onChange={(e) =>
                        setFormData({ ...formData, unit_label: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre o item"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
          >
            {loading ? "Salvando..." : "Salvar item"}
          </Button>
        </form>
      </div>
    </div>
  );
}
