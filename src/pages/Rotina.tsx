import { useState, useEffect } from "react";
import { decrementStockWithProjection } from "@/lib/stockHelpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Camera, Search, Plus, Pill, Calendar, UtensilsCrossed, Package, Sparkles } from "lucide-react";
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
import logo from "@/assets/horamed-logo.png";
import TutorialHint from "@/components/TutorialHint";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";
import { isSupplement, getSupplementTags } from "@/utils/supplementHelpers";
import SupplementTag from "@/components/fitness/SupplementTag";
import { AffiliateCard } from "@/components/fitness/AffiliateCard";
import { getRecommendations, dismissRecommendation } from "@/lib/affiliateEngine";

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

const CATEGORY_COLORS: Record<string, string> = {
  medicamento: "bg-blue-100 text-blue-700 border-blue-200",
  vitamina: "bg-red-100 text-red-700 border-red-200",
  suplemento: "bg-performance-bg text-performance border-performance-border",
  outro: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function Rotina() {
  const navigate = useNavigate();
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

  // Check for affiliate recommendations
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

        // Decrement stock with projection recalculation
        await decrementStockWithProjection(itemId);

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

  const getCategoryCount = (category: string) => {
    return items.filter(item => item.category === category).length;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 p-6 pb-24">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20 p-6 pb-24 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-between animate-slide-up">
            <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Minha Rotina
            </h2>
            <div className="flex gap-2">
              <Button
                size="icon"
                className="rounded-full bg-success hover:bg-success/90 hover-lift shadow-lg hover:shadow-success/30 transition-all"
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
                className="rounded-full hover-lift shadow-lg hover:shadow-primary/30 transition-all"
                onClick={() => setWizardOpen(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tutorial Hint */}
          <TutorialHint
            id="rotina_page"
            title="Organize sua rotina de saúde 💊"
            message="Aqui você cadastra todos os seus medicamentos, vitaminas e suplementos. Defina horários, doses e durações. Use o botão + para adicionar manualmente ou 📷 para tirar foto da caixa/receita. Simples e rápido!"
          />

          <AdBanner />

          {/* Search */}
          <div className="relative animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-full border-2 focus:border-primary transition-all focus:shadow-lg focus:shadow-primary/10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in" style={{ animationDelay: '200ms' }}>
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 gap-2 flex flex-wrap">
              <TabsTrigger 
                value="todos" 
                className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-white px-4 py-2 transition-all hover:scale-105"
              >
                <Pill className="h-4 w-4 mr-2" />
                Todos {items.length}
              </TabsTrigger>
              <TabsTrigger 
                value="medicamento" 
                className="rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground px-4 py-2 transition-all hover:scale-105"
              >
                <Pill className="h-4 w-4 mr-2" />
                Medicamentos {getCategoryCount("medicamento")}
              </TabsTrigger>
              <TabsTrigger 
                value="vitamina" 
                className="rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground px-4 py-2 transition-all hover:scale-105"
              >
                ❤️ Vitaminas {getCategoryCount("vitamina")}
              </TabsTrigger>
              <TabsTrigger 
                value="suplemento" 
                className="rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground px-4 py-2 transition-all hover:scale-105"
              >
                ⚡ Suplementos {getCategoryCount("suplemento")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3 mt-6">
              {filteredItems.length === 0 ? (
                <Card className="p-8 text-center bg-gradient-to-br from-muted/30 to-background border-2 border-dashed animate-fade-in-scale">
                  <div className="inline-flex p-4 rounded-full bg-muted/50 mb-3">
                    <Pill className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {searchTerm ? "Nenhum item encontrado" : "Nenhum item cadastrado nesta categoria ainda"}
                  </p>
                </Card>
              ) : (
                <>
                  {/* Medications Section */}
                  {filteredItems.filter(item => item.category === 'medicamento').length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pl-2">Medicamentos</h3>
                      {filteredItems.filter(item => item.category === 'medicamento').map((item, index) => (
                        <Card 
                          key={item.id} 
                          style={{ animationDelay: `${index * 50}ms` }}
                          className="p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-primary animate-fade-in-scale card-interactive"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {item.name}
                                  </h3>
                                  <Badge variant="outline" className={`${CATEGORY_COLORS[item.category]} text-xs px-2 py-0.5 rounded-md`}>
                                    {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
                                  </Badge>
                                </div>
                                {item.dose_text && (
                                  <p className="text-sm text-foreground">
                                    {item.dose_text}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/adicionar?edit=${item.id}`)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              {item.schedules && item.schedules.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Diariamente às {getScheduleSummary(item.schedules[0])}</span>
                                </div>
                              )}
                              {item.with_food && (
                                <div className="flex items-center gap-2">
                                  <UtensilsCrossed className="h-4 w-4" />
                                  <span>Tomar com alimento</span>
                                </div>
                              )}
                              {item.stock && item.stock.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{item.stock[0].units_left} {item.stock[0].unit_label} restantes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Supplements & Vitamins Section */}
                  {filteredItems.filter(item => item.category === 'vitamina' || item.category === 'suplemento').length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pl-2">Suplementos & Vitaminas</h3>
                      {filteredItems.filter(item => item.category === 'vitamina' || item.category === 'suplemento').map((item, index) => {
                        const supplementTags = isSupplement(item.category, item.name) 
                          ? getSupplementTags(item.name)
                          : [];
                        
                        return (
                          <Card 
                            key={item.id} 
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-performance animate-fade-in-scale card-interactive"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg font-semibold text-foreground">
                                      {item.name}
                                    </h3>
                                    <Badge variant="outline" className={`${CATEGORY_COLORS[item.category]} text-xs px-2 py-0.5 rounded-md`}>
                                      ⚡ {CATEGORY_LABELS[item.category]}
                                    </Badge>
                                    {supplementTags.map((tag, idx) => (
                                      <SupplementTag key={idx} type={tag.toLowerCase() as any} />
                                    ))}
                                  </div>
                                  {item.dose_text && (
                                    <p className="text-sm text-foreground">
                                      {item.dose_text}
                                    </p>
                                  )}
                                </div>

                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/adicionar?edit=${item.id}`)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              {item.schedules && item.schedules.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Diariamente às {getScheduleSummary(item.schedules[0])}</span>
                                </div>
                              )}
                              {item.with_food && (
                                <div className="flex items-center gap-2">
                                  <UtensilsCrossed className="h-4 w-4" />
                                  <span>Tomar com alimento</span>
                                </div>
                              )}
                              {item.stock && item.stock.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{item.stock[0].units_left} {item.stock[0].unit_label} restantes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                        );
                      })}

                      {/* Affiliate Footer Card - Only if user has supplements */}
                      {showAffiliateCard && affiliateProduct && (
                        <div className="mt-6">
                          <Card className="p-4 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-lime-50/50 dark:from-amber-950/20 dark:to-lime-950/20">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <h4 className="font-semibold text-sm text-foreground">Dicas para seu dia</h4>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Sugestões rápidas com base na sua rotina
                              </p>
                              <AffiliateCard 
                                product={affiliateProduct}
                                context="MEDICATION_LIST"
                                onDismiss={() => {
                                  dismissRecommendation("MEDICATION_LIST");
                                  setShowAffiliateCard(false);
                                }}
                              />
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other items (if any) */}
                  {filteredItems.filter(item => item.category === 'outro').length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pl-2">Outros</h3>
                      {filteredItems.filter(item => item.category === 'outro').map((item, index) => (
                        <Card 
                          key={item.id} 
                          style={{ animationDelay: `${index * 50}ms` }}
                          className="p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-primary animate-fade-in-scale card-interactive"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {item.name}
                                  </h3>
                                  <Badge variant="outline" className={`${CATEGORY_COLORS[item.category]} text-xs px-2 py-0.5 rounded-md`}>
                                    {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
                                  </Badge>
                                </div>
                                {item.dose_text && (
                                  <p className="text-sm text-foreground">
                                    {item.dose_text}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/adicionar?edit=${item.id}`)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              {item.schedules && item.schedules.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Diariamente às {getScheduleSummary(item.schedules[0])}</span>
                                </div>
                              )}
                              {item.with_food && (
                                <div className="flex items-center gap-2">
                                  <UtensilsCrossed className="h-4 w-4" />
                                  <span>Tomar com alimento</span>
                                </div>
                              )}
                              {item.stock && item.stock.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{item.stock[0].units_left} {item.stock[0].unit_label} restantes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
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
            <MedicationOCRWrapper onResult={(result) => {
              setShowOCR(false);
              navigate(`/adicionar?name=${encodeURIComponent(result.name)}&dose=${encodeURIComponent(result.dose || '')}&category=${result.category || 'medicamento'}`);
            }} />
          </div>
        </div>
      )}

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature="OCR de receitas"
      />

      <MedicationWizard 
        open={wizardOpen} 
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) fetchItems(); // Refresh list when wizard closes
        }} 
      />

      <Navigation />
    </>
  );
}