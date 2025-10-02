import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Clock, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Item {
  id: string;
  name: string;
  dose_text: string | null;
  with_food: boolean;
  is_active: boolean;
  schedules: Array<{
    id: string;
    times: any;
    freq_type: string;
  }>;
}

export default function Rotina() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select(`
          id,
          name,
          dose_text,
          with_food,
          is_active,
          schedules (
            id,
            times,
            freq_type
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar itens");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", id);

      if (error) throw error;
      toast.success("Item excluído com sucesso");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Erro ao excluir item");
    }
  };

  const getScheduleSummary = (schedule: any) => {
    if (!schedule.times || schedule.times.length === 0) return "Sem horários";

    const times = Array.isArray(schedule.times) ? schedule.times : [schedule.times];
    return times.join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Minha Rotina</h1>
          <p className="text-muted-foreground text-lg">
            Gerencie seus medicamentos e suplementos
          </p>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <Pill className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Nenhum item cadastrado</h3>
              <p className="text-muted-foreground">
                Comece adicionando seu primeiro medicamento ou suplemento
              </p>
            </div>
            <Link to="/adicionar">
              <Button className="bg-primary hover:bg-primary/90">
                Adicionar primeiro item
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-5 hover:shadow-md transition-all bg-gradient-to-r from-card to-card/50"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Pill className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {item.name}
                        </h3>
                      </div>

                      {item.dose_text && (
                        <p className="text-muted-foreground ml-10">
                          {item.dose_text}
                        </p>
                      )}

                      {item.with_food && (
                        <p className="text-sm text-accent font-medium ml-10">
                          🍽️ Tomar com alimento
                        </p>
                      )}

                      {item.schedules && item.schedules.length > 0 && (
                        <div className="ml-10 space-y-1">
                          {item.schedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">
                                {getScheduleSummary(schedule)}
                              </span>
                              <span className="text-muted-foreground">
                                ({schedule.freq_type === "daily" ? "Diariamente" : schedule.freq_type})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
