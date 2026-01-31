import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pencil,
  Trash2,
  Camera,
  Search,
  Plus,
  Pill,
  Calendar,
  Package,
  Sparkles,
  Clock,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import DockNavigation from "@/components/ui/dock-navigation";
import ModernHeader from "@/components/ui/modern-header";
import {
  BentoGrid,
  BentoCard,
  BentoHeader,
  BentoValue,
} from "@/components/ui/bento-grid";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";
import { useSubscription } from "@/hooks/useSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  medicamento: {
    icon: "💊",
    label: "Medicamentos",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  vitamina: {
    icon: "❤️",
    label: "Vitaminas",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  suplemento: {
    icon: "⚡",
    label: "Suplementos",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  outro: {
    icon: "📦",
    label: "Outros",
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
};

export default function RotinaBento() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const { hasFeature } = useSubscription();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select(
          `
          id, name, dose_text, category, with_food, is_active, created_at,
          schedules (id, times, freq_type),
          stock (units_left, unit_label)
        `
        )
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const formattedData = (data || []).map((item) => ({
        ...item,
        stock: item.stock
          ? Array.isArray(item.stock)
            ? item.stock
            : [item.stock]
          : [],
      }));

      setItems(formattedData);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error(
        language === "pt" ? "Erro ao carregar itens" : "Error loading items"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTab = activeTab === "todos" || item.category === activeTab;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [items, activeTab, searchTerm]);

  const deleteItem = async (id: string) => {
    if (
      !confirm(
        language === "pt"
          ? "Excluir este item?"
          : "Delete this item?"
      )
    )
      return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      toast.success(
        language === "pt" ? "Item excluído" : "Item deleted"
      );
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(language === "pt" ? "Erro ao excluir" : "Error deleting");
    }
  };

  const getCategoryCount = (category: string) => {
    return items.filter((item) => item.category === category).length;
  };

  const getScheduleSummary = (schedule: any) => {
    if (!schedule.times || schedule.times.length === 0)
      return language === "pt" ? "Sem horários" : "No times";
    const times = Array.isArray(schedule.times)
      ? schedule.times
      : [schedule.times];
    return times.join(", ");
  };

  // Stats
  const totalItems = items.length;
  const lowStockCount = items.filter(
    (item) => item.stock?.[0]?.units_left <= 5
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />

      <main className="pt-20 pb-24 px-4 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {language === "pt" ? "Minha Rotina" : "My Routine"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "pt"
                ? `${totalItems} itens cadastrados`
                : `${totalItems} items registered`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl h-11 w-11"
              onClick={() =>
                hasFeature("ocr")
                  ? navigate("/scan")
                  : toast.info(
                      language === "pt"
                        ? "Recurso Premium"
                        : "Premium feature"
                    )
              }
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="rounded-2xl h-11 w-11"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Bento */}
        <BentoGrid className="grid-cols-3">
          <BentoCard variant="gradient" size={1} delay={0}>
            <div className="text-center">
              <span className="text-3xl font-bold">{totalItems}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "pt" ? "Total" : "Total"}
              </p>
            </div>
          </BentoCard>

          <BentoCard variant="default" size={1} delay={1}>
            <div className="text-center">
              <span className="text-3xl font-bold">
                {getCategoryCount("medicamento")}
              </span>
              <p className="text-xs text-muted-foreground mt-1">💊</p>
            </div>
          </BentoCard>

          <BentoCard
            variant={lowStockCount > 0 ? "highlight" : "default"}
            size={1}
            delay={2}
            onClick={
              lowStockCount > 0 ? () => navigate("/estoque") : undefined
            }
          >
            <div className="text-center">
              <span
                className={`text-3xl font-bold ${
                  lowStockCount > 0 ? "text-warning" : ""
                }`}
              >
                {lowStockCount}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "pt" ? "Baixo estoque" : "Low stock"}
              </p>
            </div>
          </BentoCard>
        </BentoGrid>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              language === "pt"
                ? "Buscar medicamentos..."
                : "Search medications..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-2 focus:border-primary bg-card/80 backdrop-blur-sm"
          />
        </motion.div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-auto gap-1 p-1.5 rounded-2xl bg-muted/50 flex-nowrap overflow-x-auto">
            <TabsTrigger value="todos" className="rounded-xl shrink-0 px-4">
              <Pill className="h-4 w-4 mr-2" />
              {language === "pt" ? "Todos" : "All"} ({items.length})
            </TabsTrigger>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-xl shrink-0 px-4"
              >
                {config.icon} ({getCategoryCount(key)})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-3xl bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl bg-card/80 backdrop-blur-sm p-8 text-center border border-dashed border-border"
                >
                  <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    {searchTerm
                      ? language === "pt"
                        ? "Nenhum item encontrado"
                        : "No items found"
                      : language === "pt"
                      ? "Nenhum item cadastrado"
                      : "No items registered"}
                  </p>
                  {!searchTerm && (
                    <Button
                      className="mt-4 rounded-2xl"
                      onClick={() => setWizardOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {language === "pt" ? "Adicionar" : "Add"}
                    </Button>
                  )}
                </motion.div>
              ) : (
                filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-3xl bg-card/80 backdrop-blur-sm p-5 border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {item.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              CATEGORY_CONFIG[item.category]?.color ||
                              "bg-muted"
                            }`}
                          >
                            {CATEGORY_CONFIG[item.category]?.icon}{" "}
                            {CATEGORY_CONFIG[item.category]?.label}
                          </Badge>
                        </div>

                        {item.dose_text && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.dose_text}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {item.schedules?.[0] && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {getScheduleSummary(item.schedules[0])}
                            </span>
                          )}
                          {item.stock?.[0] && (
                            <span
                              className={`flex items-center gap-1 ${
                                item.stock[0].units_left <= 5
                                  ? "text-warning"
                                  : ""
                              }`}
                            >
                              <Package className="h-3.5 w-3.5" />
                              {item.stock[0].units_left}{" "}
                              {item.stock[0].unit_label}
                            </span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/adicionar?edit=${item.id}`)
                            }
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            {language === "pt" ? "Editar" : "Edit"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {language === "pt" ? "Excluir" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </main>

      <DockNavigation />
      <MedicationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
