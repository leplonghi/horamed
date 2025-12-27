import { useState, useEffect, useMemo } from "react";
import { decrementStockWithProjection } from "@/lib/stockHelpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Camera, Search, Plus, Pill, Calendar, UtensilsCrossed, Package, Sparkles, ArrowUpDown, SortAsc, SortDesc } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import MedicationOCR from "@/components/MedicationOCR";
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
import { useLanguage } from "@/contexts/LanguageContext";

interface Item {
  id: string;
  name: string;
  dose_text: string | null;
  category: string;
  with_food: boolean;
  is_active: boolean;
  created_at?: string;
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

type SortOption = "name_asc" | "name_desc" | "created_desc" | "created_asc" | "stock_asc" | "stock_desc";

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

export default function Rotina() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [showOCR, setShowOCR] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { hasFeature, canAddMedication, isExpired } = useSubscription();
  const [affiliateProduct, setAffiliateProduct] = useState<any>(null);
  const [showAffiliateCard, setShowAffiliateCard] = useState(false);

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
          created_at,
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
      toast.error(language === 'pt' ? "Erro ao carregar itens" : "Error loading items");
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesTab = activeTab === "todos" || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name, language);
        case "name_desc":
          return b.name.localeCompare(a.name, language);
        case "created_desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "created_asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "stock_asc":
          const stockA = a.stock?.[0]?.units_left ?? Infinity;
          const stockB = b.stock?.[0]?.units_left ?? Infinity;
          return stockA - stockB;
        case "stock_desc":
          const stockADesc = a.stock?.[0]?.units_left ?? -1;
          const stockBDesc = b.stock?.[0]?.units_left ?? -1;
          return stockBDesc - stockADesc;
        default:
          return 0;
      }
    });

    return result;
  }, [items, activeTab, searchTerm, sortBy, language]);

  const deleteItem = async (id: string) => {
    if (!confirm(t('meds.confirmDelete'))) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      toast.success(t('meds.deleteSuccess'));
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(language === 'pt' ? "Erro ao excluir item" : "Error deleting item");
    }
  };

  const getScheduleSummary = (schedule: any) => {
    if (!schedule.times || schedule.times.length === 0) return language === 'pt' ? "Sem horários" : "No times";
    const times = Array.isArray(schedule.times) ? schedule.times : [schedule.times];
    return times.join(", ");
  };

  const getCategoryCount = (category: string) => {
    return items.filter(item => item.category === category).length;
  };

  const renderItemCard = (item: Item, index: number, isSupplement: boolean = false) => {
    const supplementTags = isSupplement ? getSupplementTags(item.name) : [];
    const borderColor = isSupplement ? 'border-l-performance' : 'border-l-primary';
    
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`rounded-2xl bg-card/80 backdrop-blur-sm p-5 hover-lift transition-all border-l-4 ${borderColor}`}
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-foreground">
                  {item.name}
                </h3>
                <span className={`pill text-xs ${isSupplement ? 'pill-warning' : 'pill-primary'}`}>
                  {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
                </span>
                {supplementTags.map((tag, idx) => (
                  <SupplementTag key={idx} type={tag as any} />
                ))}
              </div>
              {item.dose_text && (
                <p className="text-sm text-muted-foreground">{item.dose_text}</p>
              )}
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => navigate(`/adicionar?edit=${item.id}`)}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {item.schedules && item.schedules.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{language === 'pt' ? 'Diariamente às' : 'Daily at'} {getScheduleSummary(item.schedules[0])}</span>
              </div>
            )}
            {item.with_food && (
              <div className="flex items-center gap-1.5">
                <UtensilsCrossed className="h-4 w-4" />
                <span>{language === 'pt' ? 'Com alimento' : 'With food'}</span>
              </div>
            )}
            {item.stock && item.stock.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <span>{item.stock[0].units_left} {item.stock[0].unit_label} {language === 'pt' ? 'restantes' : 'remaining'}</span>
              </div>
            )}
          </div>
        </div>
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
            <h2 className="text-2xl font-bold text-foreground">
              {language === 'pt' ? 'Minha Rotina' : 'My Routine'}
            </h2>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full hover-lift"
                onClick={() => {
                  if (!hasFeature('ocr')) {
                    setShowUpgradeModal(true);
                  } else {
                    setShowOCR(true);
                  }
                }}
              >
                <Camera className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="rounded-full hover-lift"
                onClick={() => setWizardOpen(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tutorial Hint */}
          <TutorialHint
            id="rotina_page"
            title={language === 'pt' ? "Organize sua rotina de saúde 💊" : "Organize your health routine 💊"}
            message={language === 'pt' 
              ? "Aqui você cadastra todos os seus medicamentos, vitaminas e suplementos. Defina horários, doses e durações. Use o botão + para adicionar manualmente ou 📷 para tirar foto da caixa/receita. Simples e rápido!" 
              : "Here you register all your medications, vitamins and supplements. Set times, doses and durations. Use the + button to add manually or 📷 to take a photo of the box/prescription. Simple and fast!"}
          />

          <AdBanner />

          {/* Search and Sort */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'pt' ? "Buscar medicamentos..." : "Search medications..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 rounded-full border-2 focus:border-primary transition-all h-12"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-auto min-w-[140px] rounded-full h-12 border-2">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    {language === 'pt' ? 'Nome A-Z' : 'Name A-Z'}
                  </div>
                </SelectItem>
                <SelectItem value="name_desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    {language === 'pt' ? 'Nome Z-A' : 'Name Z-A'}
                  </div>
                </SelectItem>
                <SelectItem value="created_desc">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {language === 'pt' ? 'Mais recentes' : 'Newest first'}
                  </div>
                </SelectItem>
                <SelectItem value="created_asc">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {language === 'pt' ? 'Mais antigos' : 'Oldest first'}
                  </div>
                </SelectItem>
                <SelectItem value="stock_asc">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {language === 'pt' ? 'Menor estoque' : 'Low stock first'}
                  </div>
                </SelectItem>
                <SelectItem value="stock_desc">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {language === 'pt' ? 'Maior estoque' : 'High stock first'}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-2 p-1.5 rounded-2xl bg-muted/50">
              <TabsTrigger 
                value="todos" 
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 transition-all"
              >
                <Pill className="h-4 w-4 mr-2" />
                {language === 'pt' ? 'Todos' : 'All'} ({items.length})
              </TabsTrigger>
              <TabsTrigger 
                value="medicamento" 
                className="rounded-xl px-4 py-2.5 transition-all"
              >
                💊 {language === 'pt' ? 'Medicamentos' : 'Medications'} ({getCategoryCount("medicamento")})
              </TabsTrigger>
              <TabsTrigger 
                value="vitamina" 
                className="rounded-xl px-4 py-2.5 transition-all"
              >
                ❤️ {language === 'pt' ? 'Vitaminas' : 'Vitamins'} ({getCategoryCount("vitamina")})
              </TabsTrigger>
              <TabsTrigger 
                value="suplemento" 
                className="rounded-xl px-4 py-2.5 transition-all"
              >
                ⚡ {language === 'pt' ? 'Suplementos' : 'Supplements'} ({getCategoryCount("suplemento")})
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
                    {searchTerm 
                      ? (language === 'pt' ? "Nenhum item encontrado" : "No items found")
                      : (language === 'pt' ? "Nenhum item cadastrado ainda" : "No items registered yet")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {language === 'pt' ? 'Use o botão + para adicionar seu primeiro item' : 'Use the + button to add your first item'}
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Medications Section */}
                  {filteredItems.filter(item => item.category === 'medicamento').length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        {language === 'pt' ? 'Medicamentos' : 'Medications'}
                      </h3>
                      {filteredItems
                        .filter(item => item.category === 'medicamento')
                        .map((item, index) => renderItemCard(item, index, false))}
                    </div>
                  )}

                  {/* Supplements & Vitamins Section */}
                  {filteredItems.filter(item => item.category === 'vitamina' || item.category === 'suplemento').length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {language === 'pt' ? 'Suplementos & Vitaminas' : 'Supplements & Vitamins'}
                      </h3>
                      {filteredItems
                        .filter(item => item.category === 'vitamina' || item.category === 'suplemento')
                        .map((item, index) => renderItemCard(item, index, true))}
                    </div>
                  )}

                  {/* Other Items */}
                  {filteredItems.filter(item => item.category === 'outro').length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {language === 'pt' ? 'Outros' : 'Others'}
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

          {/* Affiliate Card */}
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

      {/* Medication Wizard */}
      <MedicationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="ocr"
      />

      <Navigation />
    </>
  );
}
