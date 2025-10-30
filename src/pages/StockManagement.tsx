import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, AlertTriangle, TrendingDown, Plus, Minus, Edit, Info, ShoppingCart, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Progress } from "@/components/ui/progress";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StockItem {
  id: string;
  item_id: string;
  item_name: string;
  units_left: number;
  units_total: number;
  projected_end_at: string | null;
  unit_label: string;
}

export default function StockManagement() {
  const { isEnabled } = useFeatureFlags();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stock } = await supabase
        .from("stock")
        .select(`
          id,
          item_id,
          units_left,
          units_total,
          projected_end_at,
          unit_label,
          items!inner(id, name, user_id, is_active)
        `)
        .eq("items.user_id", user.id)
        .eq("items.is_active", true)
        .order("units_left", { ascending: true });

      if (stock) {
        const formattedStock = stock.map((s: any) => ({
          id: s.id,
          item_id: s.items.id,
          item_name: s.items.name,
          units_left: s.units_left,
          units_total: s.units_total,
          projected_end_at: s.projected_end_at,
          unit_label: s.unit_label || "unidades",
        }));
        setStockItems(formattedStock);
      }
    } catch (error) {
      console.error("Error loading stock:", error);
      toast.error("Erro ao carregar estoque");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (stockId: string, newUnitsLeft: number) => {
    try {
      const { error } = await supabase
        .from("stock")
        .update({ units_left: newUnitsLeft })
        .eq("id", stockId);

      if (error) throw error;

      toast.success("Estoque atualizado!");
      loadStock();
      setEditingItem(null);
      setAdjustmentAmount(0);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Erro ao atualizar estoque");
    }
  };

  const addStock = async (stockId: string, currentLeft: number) => {
    if (adjustmentAmount <= 0) {
      toast.error("Digite uma quantidade válida");
      return;
    }
    await updateStock(stockId, currentLeft + adjustmentAmount);
  };

  const removeStock = async (stockId: string, currentLeft: number) => {
    if (adjustmentAmount <= 0) {
      toast.error("Digite uma quantidade válida");
      return;
    }
    const newAmount = Math.max(0, currentLeft - adjustmentAmount);
    await updateStock(stockId, newAmount);
  };

  const getStockStatus = (unitsLeft: number, unitsTotal: number) => {
    const percentage = (unitsLeft / unitsTotal) * 100;
    if (percentage <= 10) return { color: "text-destructive", bg: "bg-destructive/10", label: "Crítico" };
    if (percentage <= 20) return { color: "text-warning", bg: "bg-warning/10", label: "Baixo" };
    if (percentage <= 50) return { color: "text-primary", bg: "bg-primary/10", label: "Médio" };
    return { color: "text-success", bg: "bg-success/10", label: "Bom" };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando estoque...</div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Gerenciar Estoque
          </h1>
          <p className="text-muted-foreground">
            Controle a quantidade disponível de cada medicamento e receba alertas de reposição
          </p>
        </div>

        {/* Empty State */}
        {stockItems.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum estoque configurado</h3>
            <p className="text-muted-foreground mb-6">
              Configure o controle de estoque ao adicionar ou editar medicamentos
            </p>
            <Button onClick={() => window.location.href = "/adicionar"}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>
          </Card>
        )}

        {/* Stock Items */}
        <div className="space-y-4">
          {stockItems.map((item) => {
            const percentage = (item.units_left / item.units_total) * 100;
            const status = getStockStatus(item.units_left, item.units_total);
            const daysLeft = item.projected_end_at
              ? differenceInDays(new Date(item.projected_end_at), new Date())
              : null;

            return (
              <Card key={item.id} className={`p-6 transition-all hover:shadow-md ${status.bg}`}>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{item.item_name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          <strong className={status.color}>
                            {item.units_left}
                          </strong>{" "}
                          de {item.units_total} {item.unit_label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingItem(item);
                          setAdjustmentAmount(0);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Ajustar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajustar Estoque: {item.item_name}</DialogTitle>
                          <DialogDescription>
                            Adicione ou remova unidades do estoque
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Estoque Atual</Label>
                            <div className="text-3xl font-bold text-primary">
                              {item.units_left} {item.unit_label}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="adjustment">Quantidade para ajustar</Label>
                            <Input
                              id="adjustment"
                              type="number"
                              min="1"
                              placeholder="Ex: 10"
                              value={adjustmentAmount || ""}
                              onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => addStock(item.id, item.units_left)}
                              disabled={adjustmentAmount <= 0}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                            <Button
                              onClick={() => removeStock(item.id, item.units_left)}
                              disabled={adjustmentAmount <= 0}
                              variant="outline"
                              className="w-full"
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Remover
                            </Button>
                          </div>

                          {adjustmentAmount > 0 && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                              <p className="text-muted-foreground">
                                Novo estoque após adicionar:{" "}
                                <strong className="text-success">
                                  {item.units_left + adjustmentAmount} {item.unit_label}
                                </strong>
                              </p>
                              <p className="text-muted-foreground mt-1">
                                Novo estoque após remover:{" "}
                                <strong className="text-warning">
                                  {Math.max(0, item.units_left - adjustmentAmount)} {item.unit_label}
                                </strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={percentage} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Math.round(percentage)}% disponível</span>
                      {daysLeft !== null && daysLeft > 0 && (
                        <span className={
                          daysLeft <= 7 ? "text-destructive font-medium" :
                          daysLeft <= 14 ? "text-warning font-medium" :
                          ""
                        }>
                          ~{daysLeft} dias restantes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alerts */}
                  {percentage <= 20 && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${
                      percentage <= 10 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"
                    }`}>
                      {percentage <= 10 ? (
                        <>
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div className="text-sm flex-1">
                            <strong>Estoque Crítico!</strong>
                            <p>Compre mais {item.item_name} urgentemente para não interromper o tratamento.</p>
                          </div>
                          {isEnabled('affiliate') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestock(item.item_id, item.item_name)}
                              className="shrink-0"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Repor
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div className="text-sm flex-1">
                            <strong>Estoque Baixo</strong>
                            <p>Considere repor em breve para evitar faltas.</p>
                          </div>
                          {isEnabled('affiliate') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestock(item.item_id, item.item_name)}
                              className="shrink-0"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Repor
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-foreground">💡 Dicas para Gerenciar Estoque</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Atualize o estoque sempre que comprar mais medicamentos</li>
                <li>Configure alertas ao adicionar medicamentos na rotina</li>
                <li>O sistema calcula automaticamente quando vai acabar baseado no uso diário</li>
                <li>Mantenha sempre um estoque de segurança para medicamentos essenciais</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>

      <Navigation />
    </div>
  );
}
