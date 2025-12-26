import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Camera, Search, Plus, Pill, Calendar, UtensilsCrossed, Package, Sparkles, AlertTriangle, Edit, Info, ExternalLink, History, Leaf, Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import MedicationOCRWrapper from "@/components/MedicationOCRWrapper";
import AdBanner from "@/components/AdBanner";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import TutorialHint from "@/components/TutorialHint";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";
import { isSupplement, getSupplementTags } from "@/utils/supplementHelpers";
import SupplementTag from "@/components/fitness/SupplementTag";
import { AffiliateCard } from "@/components/fitness/AffiliateCard";
import { getRecommendations, dismissRecommendation } from "@/lib/affiliateEngine";
import { motion } from "framer-motion";
import ContextualClara from "@/components/ContextualClara";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useStockProjection } from "@/hooks/useStockProjection";
import { StockTimeline } from "@/components/StockTimeline";
import { StockOriginBadge } from "@/components/StockOriginBadge";
import { StockConsumptionChart } from "@/components/StockConsumptionChart";
import HelpTooltip from "@/components/HelpTooltip";
import { microcopy } from "@/lib/microcopy";
import { useTranslation } from "@/contexts/LanguageContext";
import { getCategoryColors } from "@/lib/categoryColors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  stock?: Array<{
    units_left: number;
    unit_label: string;
  }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  medicamento: "💊",
  vitamina: "🔴",
  suplemento: "🌿",
  outro: "📦",
};

const CATEGORY_LABELS: Record<string, string> = {
  medicamento: "medicamento",
  vitamina: "vitamina",
  suplemento: "suplemento",
  outro: "outro",
};

export default function MedicamentosHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get("tab") || "rotina";
  const { t } = useTranslation();
  
  // Rotina state
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOCR, setShowOCR] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { hasFeature, canAddMedication, isExpired } = useSubscription();
  const [affiliateProduct, setAffiliateProduct] = useState<any>(null);
  const [showAffiliateCard, setShowAffiliateCard] = useState(false);
  
  // Stock state
  const { isEnabled } = useFeatureFlags();
  const { activeProfile } = useUserProfiles();
  const { data: stockProjections, isLoading: stockLoading, refetch } = useStockProjection(activeProfile?.id);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const setActiveSection = (section: string) => {
    setSearchParams({ tab: section });
  };

  useEffect(() => {
    const hasSupplements = items.some(item => 
      item.category === 'vitamina' || item.category === 'suplemento'
    );
    
    if (hasSupplements) {
      const product = getRecommendations({ 
        type: "MEDICATION_LIST", 
        hasSupplements: true 
      });
      if (product) {
        setAffiliateProduct(product);
        setShowAffiliateCard(true);
      }
    }
  }, [items]);

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
          ),
          stock (
            units_left,
            unit_label
          )
        `)
        .eq("is_active", true)
        .order("category")
        .order("name");

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        stock: item.stock ? (Array.isArray(item.stock) ? item.stock : [item.stock]) : []
      }));
      
      setItems(formattedData);
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

  const getCategoryCount = (category: string) => {
    return items.filter(item => item.category === category).length;
  };

  // Stock functions
  const updateStock = async (stockId: string, newUnitsLeft: number) => {
    try {
      const { error } = await supabase
        .from("stock")
        .update({ 
          units_left: newUnitsLeft,
          last_refill_at: new Date().toISOString(),
        })
        .eq("id", stockId);

      if (error) throw error;

      const stock = stockProjections?.find(s => s.id === stockId);
      if (stock && newUnitsLeft > stock.units_left) {
        const history = [...stock.consumption_history, {
          date: new Date().toISOString(),
          amount: newUnitsLeft - stock.units_left,
          reason: 'refill' as const,
        }] as any;

        await supabase
          .from("stock")
          .update({ consumption_history: history })
          .eq("id", stockId);
      }

      toast.success("✓ Estoque atualizado!");
      refetch();
      setEditingItem(null);
      setAdjustmentAmount(0);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Erro ao atualizar estoque");
    }
  };

  const handleRestock = async (itemId: string, itemName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-click', {
        body: { medication_id: itemId, medication_name: itemName }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Link aberto em nova aba');
      }
    } catch (error) {
      console.error('Error handling restock:', error);
      toast.error('Erro ao abrir link de reposição');
    }
  };

  const getStockStatus = (unitsLeft: number, unitsTotal: number) => {
    const percentage = (unitsLeft / unitsTotal) * 100;
    if (percentage <= 10) return { color: "text-destructive", bg: "bg-destructive/10", label: "Crítico" };
    if (percentage <= 20) return { color: "text-warning", bg: "bg-warning/10", label: "Baixo" };
    if (percentage <= 50) return { color: "text-primary", bg: "bg-primary/10", label: "Médio" };
    return { color: "text-success", bg: "bg-success/10", label: "Bom" };
  };

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const renderItemCard = (item: Item, index: number, isSupplementItem: boolean = false) => {
    const supplementTags = isSupplementItem ? getSupplementTags(item.name) : [];
    const categoryConfig = getCategoryColors(item.category);
    const CategoryIcon = categoryConfig.icon;
    
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Card className={`overflow-hidden border-l-4 ${categoryConfig.bgColor} ${categoryConfig.borderColor} border hover:shadow-lg transition-all duration-300`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`p-2.5 rounded-xl ${categoryConfig.iconBg} flex-shrink-0`}>
                <CategoryIcon className={`h-5 w-5 ${categoryConfig.color}`} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.name}
                    </h3>
                    {item.dose_text && (
                      <p className="text-sm text-muted-foreground">{item.dose_text}</p>
                    )}
                  </div>
                  
                  {/* Actions - compact on mobile */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10"
                      onClick={() => navigate(`/adicionar?edit=${item.id}`)}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                
                {/* Tags & Info */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryConfig.badgeColor}`}>
                    {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
                  </span>
                  {supplementTags.map((tag, idx) => (
                    <SupplementTag key={idx} type={tag as any} />
                  ))}
                </div>
                
                {/* Schedule & Stock info */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {item.schedules && item.schedules.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{getScheduleSummary(item.schedules[0])}</span>
                    </div>
                  )}
                  {item.with_food && (
                    <div className="flex items-center gap-1">
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      <span>Com alimento</span>
                    </div>
                  )}
                  {item.stock && item.stock.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      <span>{item.stock[0].units_left} {item.stock[0].unit_label}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-subtle pt-20 p-6 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-48 skeleton rounded-lg" />
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
      <div className="min-h-screen bg-gradient-subtle pt-20 p-4 sm:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {t('meds.title')}
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Gerencie medicamentos e estoque
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button
                size="default"
                className="rounded-xl hover-lift gap-2 shadow-md"
                onClick={() => setWizardOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
              <span className="text-[10px] text-muted-foreground sm:hidden">Novo remédio</span>
            </div>
          </div>

          {/* Section Tabs - Redesign com labels claros */}
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-auto p-1.5 rounded-2xl bg-muted/60 backdrop-blur-sm gap-1">
              <TabsTrigger 
                value="rotina" 
                className="rounded-xl py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex flex-col items-center gap-1 transition-all"
              >
                <div className="p-1.5 rounded-lg bg-primary/10 group-data-[state=active]:bg-primary/20">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium">Meus Remédios</span>
              </TabsTrigger>
              <TabsTrigger 
                value="estoque" 
                className="rounded-xl py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex flex-col items-center gap-1 transition-all"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium">Estoque</span>
              </TabsTrigger>
              <TabsTrigger 
                value="historico" 
                className="rounded-xl py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex flex-col items-center gap-1 transition-all"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <History className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium">Histórico</span>
              </TabsTrigger>
            </TabsList>

            {/* Tabs Help - Tooltip contextual */}
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {activeSection === "rotina" && (
                  <>
                    <span>{microcopy.help.medications.tabs.rotina}</span>
                    <HelpTooltip content="Aqui você cadastra horários e doses de cada item." iconSize="sm" />
                  </>
                )}
                {activeSection === "estoque" && (
                  <>
                    <span>{microcopy.help.medications.tabs.estoque}</span>
                    <HelpTooltip content={microcopy.help.stock.refill} iconSize="sm" />
                  </>
                )}
                {activeSection === "historico" && (
                  <>
                    <span>{microcopy.help.medications.tabs.historico}</span>
                    <HelpTooltip content="Útil para mostrar ao médico durante consultas." iconSize="sm" />
                  </>
                )}
              </div>
            </div>

            {/* ROTINA TAB */}
            <TabsContent value="rotina" className="space-y-6 mt-6">
              <TutorialHint
                id="rotina_page"
                title="Organize sua rotina de saúde 💊"
                message="Aqui você cadastra todos os seus medicamentos, vitaminas e suplementos. Defina horários, doses e durações."
              />

              <AdBanner />

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search') + "..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 rounded-full border-2 focus:border-primary transition-all h-12"
                />
              </div>

              {/* Category Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-2 p-1.5 rounded-2xl bg-muted/50">
                  <TabsTrigger 
                    value="todos" 
                    className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 transition-all"
                  >
                    <Pill className="h-4 w-4 mr-2" />
                    Todos ({items.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="medicamento" 
                    className="rounded-xl px-4 py-2.5 transition-all"
                  >
                    💊 ({getCategoryCount("medicamento")})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="vitamina" 
                    className="rounded-xl px-4 py-2.5 transition-all"
                  >
                    ❤️ ({getCategoryCount("vitamina")})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="suplemento" 
                    className="rounded-xl px-4 py-2.5 transition-all"
                  >
                    ⚡ ({getCategoryCount("suplemento")})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-6">
                  {filteredItems.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl bg-card/80 backdrop-blur-sm p-8 text-center border-2 border-dashed"
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                        <Pill className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {searchTerm ? "Nenhum item encontrado" : "Nenhum item cadastrado ainda"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Use o botão + para adicionar seu primeiro item
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      {filteredItems.filter(item => item.category === 'medicamento').length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Medicamentos
                          </h3>
                          {filteredItems
                            .filter(item => item.category === 'medicamento')
                            .map((item, index) => renderItemCard(item, index, false))}
                        </div>
                      )}

                      {filteredItems.filter(item => item.category === 'vitamina' || item.category === 'suplemento').length > 0 && (
                        <div className="space-y-3 mt-6">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Suplementos & Vitaminas
                          </h3>
                          {filteredItems
                            .filter(item => item.category === 'vitamina' || item.category === 'suplemento')
                            .map((item, index) => renderItemCard(item, index, true))}
                        </div>
                      )}

                      {filteredItems.filter(item => item.category === 'outro').length > 0 && (
                        <div className="space-y-3 mt-6">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Outros
                          </h3>
                          {filteredItems
                            .filter(item => item.category === 'outro')
                            .map((item, index) => renderItemCard(item, index, false))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {showAffiliateCard && affiliateProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AffiliateCard
                    product={affiliateProduct}
                    context="MEDICATION_LIST"
                    onDismiss={() => {
                      dismissRecommendation(affiliateProduct.id);
                      setShowAffiliateCard(false);
                    }}
                  />
                </motion.div>
              )}
            </TabsContent>

            {/* ESTOQUE TAB */}
            <TabsContent value="estoque" className="space-y-6 mt-6">
              <TutorialHint
                id={microcopy.tutorials.estoque.id}
                title={microcopy.tutorials.estoque.title}
                message={microcopy.tutorials.estoque.message}
              />

              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">Como funciona?</p>
                        <HelpTooltip content={microcopy.help.stock.projection} iconSize="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Cada vez que você marca uma dose como <strong>tomada</strong>, o estoque diminui automaticamente. 
                        O app calcula quantos dias ainda vão durar!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {stockLoading ? (
                <div className="animate-pulse text-center text-muted-foreground py-8">Carregando estoque...</div>
              ) : (!stockProjections || stockProjections.length === 0) ? (
                <Card className="p-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nenhum estoque configurado</h3>
                  <p className="text-muted-foreground mb-6">
                    Configure o controle de estoque ao adicionar medicamentos
                  </p>
                  <Button onClick={() => setActiveSection("rotina")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar medicamento
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {stockProjections?.map((item) => {
                    const percentage = (item.units_left / item.units_total) * 100;
                    const status = getStockStatus(item.units_left, item.units_total);
                    const isExpanded = expandedItems.has(item.id);

                    return (
                      <Card key={item.id} className={`transition-all hover:shadow-md ${status.bg}`}>
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-lg">{item.item_name}</h3>
                              
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground">
                                  <strong className={status.color}>
                                    {item.units_left}
                                  </strong>{" "}
                                  de {item.units_total} unidades
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>

                              <StockOriginBadge
                                prescriptionId={item.created_from_prescription_id}
                                prescriptionTitle={item.prescription_title}
                                lastRefillAt={item.last_refill_at}
                              />
                            </div>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setEditingItem(item.id);
                                  setAdjustmentAmount(0);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Ajustar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ajustar Estoque</DialogTitle>
                                  <DialogDescription>
                                    {item.item_name} - Adicione ou remova unidades
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Estoque Atual</Label>
                                    <div className="text-3xl font-bold text-primary">
                                      {item.units_left} unidades
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="adjustment">Quantidade para ajustar</Label>
                                    <Input
                                      id="adjustment"
                                      type="number"
                                      min="1"
                                      placeholder="Ex: 30"
                                      value={adjustmentAmount || ""}
                                      onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      onClick={() => updateStock(item.id, item.units_left + adjustmentAmount)}
                                      disabled={adjustmentAmount <= 0}
                                      className="w-full"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Reabastecer
                                    </Button>
                                    <Button
                                      onClick={() => updateStock(item.id, Math.max(0, item.units_left - adjustmentAmount))}
                                      disabled={adjustmentAmount <= 0}
                                      variant="outline"
                                      className="w-full"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Remover
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <div className="space-y-2">
                            <Progress value={percentage} className="h-3" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{Math.round(percentage)}% disponível</span>
                              {item.days_remaining !== null && item.days_remaining > 0 && (
                                <span className={`${
                                  item.days_remaining <= 7 ? "text-destructive font-medium" :
                                  item.days_remaining <= 14 ? "text-warning font-medium" : ""
                                }`}>
                                  ~{item.days_remaining} dias restantes
                                </span>
                              )}
                            </div>
                          </div>

                          {percentage <= 20 && (
                            <div className={`flex items-start gap-2 p-3 rounded-lg ${
                              percentage <= 10 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"
                            }`}>
                              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <div className="text-sm flex-1">
                                <strong>{percentage <= 10 ? "🚨 Estoque Crítico!" : "⚠️ Estoque Baixo"}</strong>
                                <p>{percentage <= 10 ? `Apenas ${item.units_left} unidades restantes.` : `Considere repor em breve.`}</p>
                              </div>
                              {isEnabled('affiliate') && percentage <= 10 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestock(item.item_id, item.item_name)}
                                  className="shrink-0"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Comprar
                                </Button>
                              )}
                            </div>
                          )}

                          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
                            <CollapsibleTrigger className="w-full">
                              <Button variant="ghost" size="sm" className="w-full">
                                {isExpanded ? '▼' : '▶'} Ver detalhes
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <StockConsumptionChart
                                  itemName={item.item_name}
                                  takenCount={item.taken_count_7d}
                                  scheduledCount={item.scheduled_count_7d}
                                  adherence={item.adherence_7d}
                                  trend={item.consumption_trend}
                                  unitsLeft={item.units_left}
                                  unitsTotal={item.units_total}
                                />
                                <StockTimeline
                                  itemName={item.item_name}
                                  consumptionHistory={item.consumption_history}
                                  dailyAvg={item.daily_consumption_avg}
                                  daysRemaining={item.days_remaining}
                                />
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* HISTÓRICO TAB */}
            <TabsContent value="historico" className="space-y-6 mt-6">
              <TutorialHint
                id={microcopy.tutorials.historico.id}
                title={microcopy.tutorials.historico.title}
                message={microcopy.tutorials.historico.message}
              />

              <Card className="p-8 text-center">
                <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                  Histórico de Doses
                  <HelpTooltip content="Veja todas as doses tomadas, horários e padrões. Ideal para mostrar ao médico." />
                </h3>
                <p className="text-muted-foreground mb-6">
                  Veja o histórico completo de todas as doses tomadas
                </p>
                <Button onClick={() => navigate("/historico-medicamentos")}>
                  <History className="h-4 w-4 mr-2" />
                  Ver Histórico Completo
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* OCR Section */}
      {showOCR && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full space-y-4" style={{ boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Escanear Receita</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowOCR(false)}>✕</Button>
            </div>
            <MedicationOCRWrapper 
              onResult={(result) => {
                setShowOCR(false);
                setWizardOpen(true);
              }} 
            />
          </div>
        </div>
      )}

      <MedicationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="ocr"
      />

      <Navigation />
    </>
  );
}
