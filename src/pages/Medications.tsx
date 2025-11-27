import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, Plus, Pill, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import FloatingActionButton from "@/components/FloatingActionButton";
import TutorialHint from "@/components/TutorialHint";
import InfoDialog from "@/components/InfoDialog";
import { cn } from "@/lib/utils";
import { useUserProfiles } from "@/hooks/useUserProfiles";

interface Item {
  id: string;
  name: string;
  dose_text: string | null;
  category: string;
  is_active: boolean;
  schedules: Array<{
    id: string;
    times: any;
    freq_type: string;
  }>;
  stock?: Array<{
    units_left: number;
    unit_label: string;
  }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  medicamento: "💊",
  vitamina: "🧪",
  suplemento: "🌿",
  outro: "📦",
};

const MEDICATION_COLORS = [
  "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
  "bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-700",
  "bg-pink-100 dark:bg-pink-950 border-pink-300 dark:border-pink-700",
  "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700",
  "bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700",
  "bg-teal-100 dark:bg-teal-950 border-teal-300 dark:border-teal-700",
  "bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700",
  "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-700",
  "bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-700",
  "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700",
];

const getColorForMedication = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MEDICATION_COLORS[hash % MEDICATION_COLORS.length];
};

export default function Medications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAddMedication } = useSubscription();
  const { activeProfile } = useUserProfiles();

  useEffect(() => {
    fetchItems();
  }, []);

  // Reload items when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      fetchItems();
    }
  }, [activeProfile?.id]);

  const fetchItems = async () => {
    try {
      let query = supabase
        .from("items")
        .select(`
          id,
          name,
          dose_text,
          category,
          is_active,
          profile_id,
          schedules (
            id,
            times,
            freq_type
          ),
          stock (
            units_left,
            unit_label
          )
        `)
        .eq("is_active", true);

      // Filter by profile_id if activeProfile is selected
      if (activeProfile) {
        query = query.eq("profile_id", activeProfile.id);
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        stock: item.stock ? (Array.isArray(item.stock) ? item.stock : [item.stock]) : []
      }));
      
      setItems(formattedData);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar medicamentos");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este medicamento?")) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Medicamento excluído");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Erro ao excluir medicamento");
    }
  };

  const getScheduleSummary = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return "Sem horários";
    
    const totalTimes = schedules.reduce((acc, schedule) => {
      const times = Array.isArray(schedule.times) ? schedule.times.length : 0;
      return acc + times;
    }, 0);
    
    return `${totalTimes}x ao dia`;
  };

  const getStockStatus = (stock: any[]) => {
    if (!stock || stock.length === 0) return null;
    
    const unitsLeft = stock[0].units_left;
    const unitLabel = stock[0].unit_label || "un";
    
    if (unitsLeft === 0) return { label: "Sem estoque", color: "destructive" };
    if (unitsLeft <= 5) return { label: `${unitsLeft} ${unitLabel} - Crítico`, color: "destructive" };
    if (unitsLeft <= 15) return { label: `${unitsLeft} ${unitLabel} - Baixo`, color: "warning" };
    return { label: `${unitsLeft} ${unitLabel}`, color: "default" };
  };

  const handleAddClick = () => {
    if (!canAddMedication) {
      setShowUpgradeModal(true);
      return;
    }
    navigate("/adicionar");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 p-6 pb-24 overflow-x-hidden">
          <div className="max-w-4xl mx-auto space-y-6 overflow-x-hidden">
            <ListSkeleton count={5} />
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 px-3 py-4 pb-24 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-4 overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-3xl font-bold">💊 Minha Saúde</h1>
              <p className="text-muted-foreground">
                {items.length > 0 ? `${items.length} ${items.length === 1 ? 'item ativo' : 'itens ativos'}` : 'Nenhum item cadastrado'}
              </p>
            </div>
            <Button onClick={handleAddClick} size="lg" className="h-12 gap-2 shadow-lg">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/estoque')}
              className="h-auto py-4 flex flex-col gap-2 hover:bg-accent/50 transition-all"
            >
              <Package className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="font-semibold">Estoque</div>
                <div className="text-xs text-muted-foreground">Gerenciar quantidades</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/evolucao')}
              className="h-auto py-4 flex flex-col gap-2 hover:bg-accent/50 transition-all"
            >
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="font-semibold">Progresso</div>
                <div className="text-xs text-muted-foreground">Ver estatísticas</div>
              </div>
            </Button>
          </div>

          <TutorialHint
            id="medications_page"
            title="Gerencie seus medicamentos e suplementos 💊"
            message="Aqui você organiza todos os seus remédios, vitaminas e suplementos. Adicione novos itens, configure horários e acompanhe seu estoque. É simples e rápido!"
          />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar medicamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Medications List */}
          {filteredItems.length === 0 && searchTerm === "" ? (
            <Card className="border-dashed border-2 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="py-20 text-center">
                <div className="mb-6 bg-primary/10 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Pill className="h-12 w-12 text-primary" />
                </div>
                <p className="text-2xl font-bold mb-3">Nenhum medicamento cadastrado</p>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base">
                  Comece adicionando seus medicamentos, vitaminas ou suplementos para organizar sua rotina de saúde
                </p>
                <Button onClick={handleAddClick} size="lg" className="h-12 px-8">
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Primeiro Item
                </Button>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Nenhum resultado encontrado</p>
                <p className="text-muted-foreground">
                  Tente buscar com outro termo
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item.stock);
                const colorClass = getColorForMedication(item.id);
                
                return (
                  <Card key={item.id} className={cn("hover:shadow-lg transition-all overflow-hidden border-l-4 cursor-pointer", colorClass)}
                    onClick={() => navigate(`/adicionar?edit=${item.id}`)}
                  >
                    <CardContent className="p-4 overflow-x-hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 flex-shrink-0">
                              <span className="text-2xl">{CATEGORY_ICONS[item.category] || "📦"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg truncate">{item.name}</h3>
                              {item.dose_text && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {item.dose_text}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="text-xs font-medium">
                              {getScheduleSummary(item.schedules)}
                            </Badge>
                            
                            {stockStatus && (
                              <Badge 
                                variant={stockStatus.color === "destructive" ? "destructive" : "secondary"}
                                className={`text-xs font-medium ${stockStatus.color === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" : ""}`}
                              >
                                <Package className="h-3 w-3 mr-1" />
                                {stockStatus.label}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/adicionar?edit=${item.id}`);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <FloatingActionButton />
      <Navigation />
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature="medication"
      />
    </>
  );
}
