import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Camera, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MedicationOCR from "@/components/MedicationOCR";

interface Item {
  id: string;
  name: string;
  dose_text: string | null;
  category: string;
  with_food: boolean;
  is_active: boolean;
  schedules: Array<{
    id: string;
    times: any;
    freq_type: string;
  }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  medicamento: "💊",
  vitamina: "🧪",
  suplemento: "🌿",
  outro: "📦",
};

const CATEGORY_LABELS: Record<string, string> = {
  medicamento: "Medicamento",
  vitamina: "Vitamina",
  suplemento: "Suplemento",
  outro: "Outro",
};

const CATEGORY_COLORS: Record<string, string> = {
  medicamento: "bg-primary/10 text-primary border-primary/20",
  vitamina: "bg-warning/10 text-warning border-warning/20",
  suplemento: "bg-success/10 text-success border-success/20",
  outro: "bg-muted text-muted-foreground border-border",
};

export default function Rotina() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOCR, setShowOCR] = useState(false);

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
          category,
          with_food,
          is_active,
          schedules (
            id,
            times,
            freq_type
          )
        `)
        .eq("is_active", true)
        .order("category")
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

  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === "todos" || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

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

  const markDoseAsTaken = async (itemId: string) => {
    try {
      const now = new Date();
      const { data: doses } = await supabase
        .from("dose_instances")
        .select("id")
        .eq("item_id", itemId)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .order("due_at", { ascending: true })
        .limit(1);

      if (doses && doses.length > 0) {
        await supabase
          .from("dose_instances")
          .update({ status: "taken", taken_at: now.toISOString() })
          .eq("id", doses[0].id);

        const { data: stockData } = await supabase
          .from("stock")
          .select("units_left")
          .eq("item_id", itemId)
          .single();

        if (stockData && stockData.units_left > 0) {
          await supabase
            .from("stock")
            .update({ units_left: stockData.units_left - 1 })
            .eq("item_id", itemId);
        }

        toast.success("Dose marcada como tomada! 💚");
        fetchItems();
      } else {
        toast.error("Nenhuma dose programada encontrada");
      }
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error("Erro ao marcar dose");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary">MedTracker</h1>
            <h2 className="text-3xl font-bold text-foreground">Rotina 📋</h2>
            <p className="text-muted-foreground">
              Gerencie seus medicamentos e suplementos
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="medicamento" className="flex items-center gap-1">
                <span>{CATEGORY_ICONS.medicamento}</span>
                <span className="hidden sm:inline text-xs">{CATEGORY_LABELS.medicamento}</span>
              </TabsTrigger>
              <TabsTrigger value="vitamina" className="flex items-center gap-1">
                <span>{CATEGORY_ICONS.vitamina}</span>
                <span className="hidden sm:inline text-xs">{CATEGORY_LABELS.vitamina}</span>
              </TabsTrigger>
              <TabsTrigger value="suplemento" className="flex items-center gap-1">
                <span>{CATEGORY_ICONS.suplemento}</span>
                <span className="hidden sm:inline text-xs">{CATEGORY_LABELS.suplemento}</span>
              </TabsTrigger>
              <TabsTrigger value="outro" className="flex items-center gap-1">
                <span>{CATEGORY_ICONS.outro}</span>
                <span className="hidden sm:inline text-xs">{CATEGORY_LABELS.outro}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3">
              {filteredItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum item encontrado" : "Nenhum item cadastrado nesta categoria ainda"}
                  </p>
                </Card>
              ) : (
                filteredItems.map((item) => (
                  <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[item.category]}</span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {item.name}
                          </h3>
                          {item.dose_text && (
                            <p className="text-xs text-muted-foreground">
                              {item.dose_text}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${CATEGORY_COLORS[item.category]} text-xs`}>
                              {CATEGORY_LABELS[item.category]}
                            </Badge>
                            {item.schedules && item.schedules.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {getScheduleSummary(item.schedules[0])}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markDoseAsTaken(item.id)}
                          className="bg-success/10 hover:bg-success/20 text-success border-success/20"
                        >
                          ✓
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/adicionar?edit=${item.id}`)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Floating Action Button */}
          <Button
            onClick={() => setShowOCR(true)}
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-40"
            size="icon"
          >
            <Camera className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {showOCR && (
        <div className="fixed inset-0 bg-background/95 z-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Adicionar por foto</h2>
              <Button variant="outline" onClick={() => setShowOCR(false)}>
                Fechar
              </Button>
            </div>
            <MedicationOCR />
          </div>
        </div>
      )}

      <Navigation />
    </>
  );
}