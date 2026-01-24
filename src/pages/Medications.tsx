import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, Plus, Pill, Leaf, Clock, BookOpen, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import FloatingActionButton from "@/components/FloatingActionButton";
import { cn } from "@/lib/utils";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { motion, AnimatePresence } from "framer-motion";
import SupplementCategoryTag, { detectSupplementCategory } from "@/components/SupplementCategoryTag";
import { useLanguage } from "@/contexts/LanguageContext";
import MedicationInfoSheet from "@/components/MedicationInfoSheet";
import { useMedicationInfo } from "@/hooks/useMedicationInfo";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import MedicationQuickActions from "@/components/medications/MedicationQuickActions";
import SmartMedicationInsights from "@/components/medications/SmartMedicationInsights";
import MedicationStatsGrid from "@/components/medications/MedicationStatsGrid";
import OceanBackground from "@/components/ui/OceanBackground";

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
  const { t, language } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { canAddMedication } = useSubscription();
  const { activeProfile } = useUserProfiles();
  
  // Medication info (bula) state
  const [selectedMedForInfo, setSelectedMedForInfo] = useState<string | null>(null);
  const { info, isLoading: infoLoading, error: infoError, fetchInfo, clearInfo } = useMedicationInfo();
  
  const handleOpenBula = (medName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMedForInfo(medName);
    fetchInfo(medName);
  };
  
  const handleCloseBula = (open: boolean) => {
    if (!open) {
      setSelectedMedForInfo(null);
      clearInfo();
    }
  };

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

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || 
      (categoryFilter === 'medicamento' && item.category === 'medicamento') ||
      (categoryFilter === 'suplemento' && (item.category === 'suplemento' || item.category === 'vitamina')) ||
      (categoryFilter === 'low-stock' && item.stock?.[0] && item.stock[0].units_left <= 5);
    return matchesSearch && matchesCategory;
  });

  // Separar por categoria
  const medicamentos = filteredItems.filter(item => item.category === 'medicamento');
  const suplementos = filteredItems.filter(item => item.category === 'suplemento' || item.category === 'vitamina');

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

  const handleInsightAction = (action: string) => {
    if (action.startsWith('/')) {
      navigate(action);
    }
  };

  const handleStatClick = (filter: string) => {
    if (filter === 'all') {
      setCategoryFilter(null);
    } else if (filter === 'low-stock') {
      navigate('/estoque');
    } else {
      setCategoryFilter(filter);
    }
  };

  // Card com ações visíveis - Design focado em ação clara
  const ItemCard = ({ item, index }: { item: Item; index: number }) => {
    const scheduleSummary = getScheduleSummary(item.schedules);
    const isSupplement = item.category === 'suplemento' || item.category === 'vitamina';
    const supplementCategory = isSupplement ? detectSupplementCategory(item.name) : null;
    const stockInfo = item.stock?.[0];
    const lowStock = stockInfo && stockInfo.units_left <= 5;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        whileTap={{ scale: 0.99 }}
      >
        <div 
          className={cn(
            "p-4 rounded-2xl transition-all duration-200",
            "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
            "border border-border/30 shadow-[var(--shadow-glass)]",
            "hover:shadow-[var(--shadow-glass-hover)] hover:border-border/50",
            isSupplement && "ring-1 ring-performance/20"
          )}
        >
          {/* Linha principal com info */}
          <div className="flex items-center gap-3 mb-3">
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
                <h3 className="font-semibold text-base truncate">{item.name}</h3>
                {supplementCategory && (
                  <SupplementCategoryTag category={supplementCategory} size="sm" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {scheduleSummary && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{scheduleSummary}</span>
                  </div>
                )}
                {stockInfo && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    lowStock ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  )}>
                    {stockInfo.units_left} {stockInfo.unit_label || (language === 'pt' ? 'un.' : 'units')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Linha de ações - SEMPRE VISÍVEL */}
          <div className="flex items-center gap-2 pt-2 border-t border-muted/30">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-10 rounded-xl font-medium"
              onClick={() => navigate(`/adicionar?edit=${item.id}`)}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              {language === 'pt' ? 'Editar' : 'Edit'}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl"
              title={language === 'pt' ? 'Ver bula' : 'View package insert'}
              onClick={(e) => handleOpenBula(item.name, e)}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
        <div className="py-8 text-center text-muted-foreground rounded-2xl bg-muted/30 backdrop-blur-sm">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
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
      <div className="min-h-screen bg-background relative pt-20 pb-28">
        <OceanBackground variant="page" />
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          {/* Hero Header */}
          <PageHeroHeader
            icon={<Pill className="h-6 w-6 text-primary" />}
            title={t('medications.title')}
            subtitle={items.length === 0 
              ? t('medications.addItem') 
              : `${items.length} ${items.length === 1 ? t('medications.itemCount') : t('medications.itemsCount')}`
            }
            action={{
              label: t('medications.addButton'),
              icon: <Plus className="h-5 w-5" />,
              onClick: handleAddClick
            }}
          />

          {/* Quick Actions */}
          {items.length > 0 && (
            <MedicationQuickActions
              onAddMedication={handleAddClick}
              onScanPrescription={() => navigate('/carteira')}
              onViewStock={() => navigate('/estoque')}
              onViewSchedule={() => navigate('/hoje')}
            />
          )}

          {/* Smart Insights */}
          {items.length > 0 && (
            <SmartMedicationInsights
              items={items}
              onActionClick={handleInsightAction}
            />
          )}

          {/* Stats Grid */}
          {items.length > 0 && (
            <MedicationStatsGrid
              items={items}
              onStatClick={handleStatClick}
            />
          )}

          {/* Busca */}
          {items.length > 0 && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('medications.searchPlaceholder')} 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-11 pr-10 h-12 rounded-2xl bg-card/80 backdrop-blur-sm border-2 focus:border-primary transition-all" 
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Category filter badge */}
          {categoryFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {language === 'pt' ? 'Filtrando por:' : 'Filtering by:'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 rounded-full"
                onClick={() => setCategoryFilter(null)}
              >
                {categoryFilter === 'medicamento' 
                  ? (language === 'pt' ? 'Medicamentos' : 'Medications')
                  : (language === 'pt' ? 'Suplementos' : 'Supplements')
                }
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Empty State */}
          {items.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center rounded-3xl bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur-sm border border-border/30"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
              >
                <Pill className="w-10 h-10 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{t('medications.getStarted')}</h3>
              <p className="text-muted-foreground text-sm mb-8 max-w-[280px] mx-auto">
                {t('medications.emptyDesc')}
              </p>
              <Button onClick={handleAddClick} size="lg" className="rounded-2xl gap-2">
                <Plus className="h-5 w-5" />
                {t('medications.addFirstItem')}
              </Button>
            </motion.div>
          )}

          {/* Seções */}
          <AnimatePresence mode="wait">
            {filteredItems.length > 0 && (
              <motion.div 
                key="sections"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                {(!categoryFilter || categoryFilter === 'medicamento') && medicamentos.length > 0 && (
                  <CategorySection 
                    title={t('medications.medicationsSection')} 
                    icon={Pill} 
                    items={medicamentos}
                    emptyMessage={t('medications.noMedications')}
                    accentColor="bg-primary/10 text-primary"
                  />
                )}
                
                {(!categoryFilter || categoryFilter === 'suplemento') && suplementos.length > 0 && (
                  <CategorySection 
                    title={t('medications.supplementsSection')} 
                    icon={Leaf} 
                    items={suplementos}
                    emptyMessage={t('medications.noSupplements')}
                    accentColor="bg-performance/10 text-performance"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results */}
          {items.length > 0 && filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {language === 'pt' ? 'Nenhum item encontrado' : 'No items found'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <FloatingActionButton />
      <Navigation />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} feature="medication" />
      
      <MedicationInfoSheet
        open={!!selectedMedForInfo}
        onOpenChange={handleCloseBula}
        medicationName={selectedMedForInfo || ''}
        info={info}
        isLoading={infoLoading}
        error={infoError}
      />
    </>
  );
}
