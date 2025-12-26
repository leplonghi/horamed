import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
      toast.error(t('medications.loadError'));
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
    if (!confirm(t('medications.confirmDelete'))) return;
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      toast.success(t('medications.deleteSuccess'));
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(t('common.error'));
    }
  };

  const getScheduleSummary = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return null;
    const totalTimes = schedules.reduce((acc, schedule) => {
      const times = Array.isArray(schedule.times) ? schedule.times.length : 0;
      return acc + times;
    }, 0);
    return `${totalTimes}${t('medications.timesPerDay')}`;
  };

  const handleAddClick = () => {
    if (!canAddMedication) {
      setShowUpgradeModal(true);
      return;
    }
    navigate("/adicionar");
  };

  // Card simplificado - Clean Design
  const ItemCard = ({ item }: { item: Item }) => {
    const scheduleSummary = getScheduleSummary(item.schedules);
    const isSupplement = item.category === 'suplemento' || item.category === 'vitamina';
    const supplementCategory = isSupplement ? detectSupplementCategory(item.name) : null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        className="group"
      >
        <div 
          className={cn(
            "p-4 rounded-2xl cursor-pointer transition-all duration-300",
            "bg-card/80 backdrop-blur-sm",
            "shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)]",
            "group-hover:-translate-y-0.5",
            isSupplement && "ring-1 ring-performance/20"
          )}
          onClick={() => navigate(`/adicionar?edit=${item.id}`)}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
              isSupplement ? "bg-performance/10" : "bg-primary/10"
            )}>
              {isSupplement ? (
                <Leaf className="w-5 h-5 text-performance" />
              ) : (
                <Pill className="w-5 h-5 text-primary" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{item.name}</h3>
                {supplementCategory && (
                  <SupplementCategoryTag category={supplementCategory} size="sm" />
                )}
              </div>
              {scheduleSummary && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{scheduleSummary}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
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
                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(item.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Seção de categoria - Clean
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-2 rounded-xl", accentColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="font-medium">{title}</h2>
        </div>
        <span className="text-sm text-muted-foreground">{items.length}</span>
      </div>
      
      {items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground rounded-2xl bg-muted/30">
          <p className="text-sm">{emptyMessage}</p>
        </div>
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
      <div className="min-h-screen bg-gradient-subtle pt-20 pb-28">
        <div className="container-fluid space-y-8">
          {/* Header - Clean */}
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="heading-page">{t('medications.title')}</h1>
                  <HelpTooltip 
                    content={t('medications.tooltipHelp')} 
                    iconSize="lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {items.length === 0 
                    ? t('medications.addItem') 
                    : `${items.length} ${items.length === 1 ? t('medications.itemCount') : t('medications.itemsCount')}`
                  }
                </p>
              </div>
              <Button onClick={handleAddClick} size="sm">
                <Plus className="h-4 w-4" />
                {t('medications.addButton')}
              </Button>
            </div>
          </div>

          {/* Busca - Clean */}
          {items.length > 0 && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('medications.searchPlaceholder')} 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-11 h-11 rounded-xl bg-muted/50 border-0" 
              />
            </div>
          )}

          {/* Empty State - Clean */}
          {items.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Pill className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t('medications.getStarted')}</h3>
              <p className="text-muted-foreground text-sm mb-8 max-w-[280px] mx-auto">
                {t('medications.emptyDesc')}
              </p>
              <Button onClick={handleAddClick} size="lg">
                <Plus className="h-5 w-5" />
                {t('medications.addFirstItem')}
              </Button>
            </div>
          )}

          {/* Seções - Clean */}
          {items.length > 0 && (
            <div className="space-y-10">
              <CategorySection 
                title={t('medications.medicationsSection')} 
                icon={Pill} 
                items={medicamentos}
                emptyMessage={t('medications.noMedications')}
                accentColor="bg-primary/10 text-primary"
              />
              
              <CategorySection 
                title={t('medications.supplementsSection')} 
                icon={Leaf} 
                items={suplementos}
                emptyMessage={t('medications.noSupplements')}
                accentColor="bg-performance/10 text-performance"
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
