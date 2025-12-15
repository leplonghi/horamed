import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, Plus, Pill, Leaf, Clock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import FloatingActionButton from "@/components/FloatingActionButton";
import HelpTooltip from "@/components/HelpTooltip";
import { cn } from "@/lib/utils";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { motion } from "framer-motion";
import SupplementCategoryTag, { detectSupplementCategory } from "@/components/SupplementCategoryTag";

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

  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      fetchItems();
    }
  }, [activeProfile?.id]);

  const fetchItems = async () => {
    try {
      let query = supabase.from("items").select(`
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
        `).eq("is_active", true);

      if (activeProfile) {
        query = query.eq("profile_id", activeProfile.id);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      const formattedData = (data || []).map(item => ({
        ...item,
        stock: item.stock ? Array.isArray(item.stock) ? item.stock : [item.stock] : []
      }));
      setItems(formattedData);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar medicamentos");
    } finally {
      setLoading(false);
    }
  };

  // Separar por categoria
  const medicamentos = items.filter(item => 
    item.category === 'medicamento' && 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const suplementos = items.filter(item => 
    (item.category === 'suplemento' || item.category === 'vitamina') && 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item excluído");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Erro ao excluir");
    }
  };

  const getScheduleSummary = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return null;
    const totalTimes = schedules.reduce((acc, schedule) => {
      const times = Array.isArray(schedule.times) ? schedule.times.length : 0;
      return acc + times;
    }, 0);
    return `${totalTimes}x ao dia`;
  };

  const handleAddClick = () => {
    if (!canAddMedication) {
      setShowUpgradeModal(true);
      return;
    }
    navigate("/adicionar");
  };

  // Card simplificado
  const ItemCard = ({ item }: { item: Item }) => {
    const scheduleSummary = getScheduleSummary(item.schedules);
    const isSupplement = item.category === 'suplemento' || item.category === 'vitamina';
    const supplementCategory = isSupplement ? detectSupplementCategory(item.name) : null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-l-4",
            isSupplement 
              ? "border-l-lime-500 bg-gradient-to-r from-lime-50/50 to-transparent dark:from-lime-950/20" 
              : "border-l-primary bg-gradient-to-r from-primary/5 to-transparent"
          )}
          onClick={() => navigate(`/adicionar?edit=${item.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isSupplement ? "bg-lime-100 dark:bg-lime-900" : "bg-primary/10"
                )}>
                  {isSupplement ? (
                    <Leaf className="w-5 h-5 text-lime-600 dark:text-lime-400" />
                  ) : (
                    <Pill className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    {supplementCategory && (
                      <SupplementCategoryTag category={supplementCategory} size="sm" />
                    )}
                  </div>
                  {scheduleSummary && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{scheduleSummary}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
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
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
      </motion.div>
    );
  };

  // Seção de categoria
  const CategorySection = ({ 
    title, 
    icon: Icon, 
    items, 
    emptyMessage,
    accentColor 
  }: { 
    title: string; 
    icon: any; 
    items: Item[]; 
    emptyMessage: string;
    accentColor: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg", accentColor)}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-semibold">{title}</h2>
        <Badge variant="secondary" className="ml-auto">
          {items.length}
        </Badge>
      </div>
      
      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-muted-foreground">
            <p className="text-sm">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 p-4 pb-24">
          <div className="max-w-2xl mx-auto space-y-4">
            <ListSkeleton count={4} />
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 px-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Minha Saúde</h1>
                <HelpTooltip 
                  content="Gerencie seus medicamentos e suplementos. Toque em um item para editar." 
                  iconSize="lg"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length === 0 
                  ? "Adicione seu primeiro item" 
                  : `${items.length} ${items.length === 1 ? 'item' : 'itens'} cadastrados`
                }
              </p>
            </div>
            <Button onClick={handleAddClick} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {/* Busca */}
          {items.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 h-10" 
              />
            </div>
          )}

          {/* Empty State */}
          {items.length === 0 && (
            <Card className="border-dashed border-2 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Pill className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Comece agora</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Adicione seus medicamentos ou suplementos e o app te lembra nos horários certos
                </p>
                <Button onClick={handleAddClick} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Primeiro Item
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Seções separadas */}
          {items.length > 0 && (
            <div className="space-y-8">
              <CategorySection 
                title="Medicamentos" 
                icon={Pill} 
                items={medicamentos}
                emptyMessage="Nenhum medicamento cadastrado"
                accentColor="bg-primary/10 text-primary"
              />
              
              <CategorySection 
                title="Suplementos & Vitaminas" 
                icon={Leaf} 
                items={suplementos}
                emptyMessage="Nenhum suplemento cadastrado"
                accentColor="bg-lime-100 text-lime-600 dark:bg-lime-900 dark:text-lime-400"
              />
            </div>
          )}
        </div>
      </div>
      
      <FloatingActionButton />
      <Navigation />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} feature="medication" />
    </>
  );
}
