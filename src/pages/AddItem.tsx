import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Pill } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function AddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    dose_text: "",
    category: "medicamento",
    with_food: false,
    notes: "",
  });

  const [schedules, setSchedules] = useState([
    {
      freq_type: "daily",
      times: ["08:00"],
      days_of_week: [] as number[],
    },
  ]);

  const [stockData, setStockData] = useState({
    enabled: false,
    units_total: 0,
    unit_label: "unidades",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });

    if (isEditing) {
      loadItemData(isEditing);
    } else {
      // Check for OCR params in URL
      const name = searchParams.get("name");
      const dose = searchParams.get("dose");
      const category = searchParams.get("category");
      
      if (name) {
        setFormData(prev => ({
          ...prev,
          name: name,
          dose_text: dose || "",
          category: category || "medicamento",
        }));
      }
    }
  }, [isEditing, searchParams]);

  const loadItemData = async (itemId: string) => {
    try {
      const { data: item, error } = await supabase
        .from("items")
        .select(`
          *,
          schedules (*),
          stock (*)
        `)
        .eq("id", itemId)
        .single();

      if (error) throw error;

      setFormData({
        name: item.name,
        dose_text: item.dose_text || "",
        category: item.category,
        with_food: item.with_food,
        notes: item.notes || "",
      });

      if (item.schedules && item.schedules.length > 0) {
        setSchedules(
          item.schedules.map((s: any) => ({
            freq_type: s.freq_type,
            times: Array.isArray(s.times) ? s.times : [],
            days_of_week: s.days_of_week || [],
          }))
        );
      }

      if (item.stock) {
        const stockArray = Array.isArray(item.stock) ? item.stock : [item.stock];
        if (stockArray.length > 0) {
          setStockData({
            enabled: true,
            units_total: stockArray[0].units_total,
            unit_label: stockArray[0].unit_label,
          });
        }
      }
    } catch (error) {
      console.error("Error loading item:", error);
      toast.error("Erro ao carregar item");
    }
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { freq_type: "daily", times: ["08:00"], days_of_week: [] },
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const addTime = (scheduleIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times.push("12:00");
    setSchedules(newSchedules);
  };

  const removeTime = (scheduleIndex: number, timeIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times = newSchedules[scheduleIndex].times.filter(
      (_, i) => i !== timeIndex
    );
    setSchedules(newSchedules);
  };

  const updateTime = (scheduleIndex: number, timeIndex: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times[timeIndex] = value;
    setSchedules(newSchedules);
  };

  const updateFreqType = (scheduleIndex: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].freq_type = value;
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Digite o nome do item");
      return;
    }

    if (schedules.length === 0 || schedules.some((s) => s.times.length === 0)) {
      toast.error("Adicione pelo menos um horário para cada agendamento");
      return;
    }

    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        // Update existing item
        const { error: itemError } = await supabase
          .from("items")
          .update({
            name: formData.name,
            dose_text: formData.dose_text || null,
            category: formData.category,
            with_food: formData.with_food,
            notes: formData.notes || null,
          })
          .eq("id", isEditing);

        if (itemError) throw itemError;

        // Delete old schedules and doses
        await supabase.from("schedules").delete().eq("item_id", isEditing);

        // Create new schedules and doses
        for (const schedule of schedules) {
          const { data: newSchedule, error: scheduleError } = await supabase
            .from("schedules")
            .insert({
              item_id: isEditing,
              freq_type: schedule.freq_type,
              times: schedule.times,
              days_of_week: schedule.days_of_week,
            })
            .select()
            .single();

          if (scheduleError) throw scheduleError;

          // Generate dose instances
          const doseInstances = [];
          const now = new Date();

          for (let day = 0; day < 7; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);

            for (const time of schedule.times) {
              const [hours, minutes] = time.split(":").map(Number);
              const dueAt = new Date(date);
              dueAt.setHours(hours, minutes, 0, 0);

              if (dueAt > now) {
                doseInstances.push({
                  schedule_id: newSchedule.id,
                  item_id: isEditing,
                  due_at: dueAt.toISOString(),
                  status: "scheduled",
                });
              }
            }
          }

          if (doseInstances.length > 0) {
            await supabase.from("dose_instances").insert(doseInstances);
          }
        }

        // Update stock
        if (stockData.enabled) {
          await supabase.from("stock").delete().eq("item_id", isEditing);
          await supabase.from("stock").insert({
            item_id: isEditing,
            units_total: stockData.units_total,
            units_left: stockData.units_total,
            unit_label: stockData.unit_label,
          });
        } else {
          await supabase.from("stock").delete().eq("item_id", isEditing);
        }

        toast.success("Item atualizado com sucesso! 🎉");
      } else {
        // Create new item
        const { data: item, error: itemError } = await supabase
          .from("items")
          .insert({
            user_id: userId,
            name: formData.name,
            dose_text: formData.dose_text || null,
            category: formData.category,
            with_food: formData.with_food,
            notes: formData.notes || null,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Create schedules and doses
        for (const schedule of schedules) {
          const { data: newSchedule, error: scheduleError } = await supabase
            .from("schedules")
            .insert({
              item_id: item.id,
              freq_type: schedule.freq_type,
              times: schedule.times,
              days_of_week: schedule.days_of_week,
            })
            .select()
            .single();

          if (scheduleError) throw scheduleError;

          // Generate dose instances
          const doseInstances = [];
          const now = new Date();

          for (let day = 0; day < 7; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);

            for (const time of schedule.times) {
              const [hours, minutes] = time.split(":").map(Number);
              const dueAt = new Date(date);
              dueAt.setHours(hours, minutes, 0, 0);

              if (dueAt > now) {
                doseInstances.push({
                  schedule_id: newSchedule.id,
                  item_id: item.id,
                  due_at: dueAt.toISOString(),
                  status: "scheduled",
                });
              }
            }
          }

          if (doseInstances.length > 0) {
            await supabase.from("dose_instances").insert(doseInstances);
          }
        }

        // Create stock
        if (stockData.enabled && stockData.units_total > 0) {
          await supabase.from("stock").insert({
            item_id: item.id,
            units_total: stockData.units_total,
            units_left: stockData.units_total,
            unit_label: stockData.unit_label,
          });
        }

        toast.success("Item adicionado com sucesso! 🎉");
      }

      navigate("/rotina");
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Erro ao salvar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">HoraMed</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Pill className="h-6 w-6" />
                {isEditing ? "Editar Item" : "Adicionar Item"}
              </h2>
              <p className="text-muted-foreground">
                {isEditing
                  ? "Atualize as informações do seu medicamento"
                  : "Adicione um novo medicamento ou suplemento"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do item *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Paracetamol, Vitamina D"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicamento">💊 Medicamento</SelectItem>
                      <SelectItem value="vitamina">🧪 Vitamina</SelectItem>
                      <SelectItem value="suplemento">🌿 Suplemento</SelectItem>
                      <SelectItem value="outro">📦 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dose">Dosagem</Label>
                  <Input
                    id="dose"
                    placeholder="Ex: 500mg, 2 comprimidos"
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Horários</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar agendamento
                  </Button>
                </div>

                {schedules.map((schedule, scheduleIndex) => (
                  <Card key={scheduleIndex} className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Select
                        value={schedule.freq_type}
                        onValueChange={(value) => updateFreqType(scheduleIndex, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>

                      {schedules.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSchedule(scheduleIndex)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {schedule.times.map((time, timeIndex) => (
                      <div key={timeIndex} className="flex gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) =>
                            updateTime(scheduleIndex, timeIndex, e.target.value)
                          }
                          className="flex-1"
                        />
                        {schedule.times.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTime(scheduleIndex, timeIndex)}
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
                      size="sm"
                      onClick={() => addTime(scheduleIndex)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar horário
                    </Button>
                  </Card>
                ))}
              </div>

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
                    checked={stockData.enabled}
                    onCheckedChange={(checked) =>
                      setStockData({ ...stockData, enabled: checked })
                    }
                  />
                </div>

                {stockData.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="units">Quantidade total</Label>
                      <Input
                        id="units"
                        type="number"
                        min="0"
                        value={stockData.units_total}
                        onChange={(e) =>
                          setStockData({
                            ...stockData,
                            units_total: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-label">Unidade</Label>
                      <Input
                        id="unit-label"
                        placeholder="comprimidos, cápsulas..."
                        value={stockData.unit_label}
                        onChange={(e) =>
                          setStockData({ ...stockData, unit_label: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg"
            >
              {loading ? "Salvando..." : isEditing ? "Atualizar item" : "Salvar item"}
            </Button>
          </form>
        </div>
      </div>
      <Navigation />
    </>
  );
}