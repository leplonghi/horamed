import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, AlertTriangle, Plus, Minus, Edit, Info, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Progress } from "@/components/ui/progress";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useStockProjection } from "@/hooks/useStockProjection";
import { StockTimeline } from "@/components/StockTimeline";
import { StockOriginBadge } from "@/components/StockOriginBadge";
import { StockConsumptionChart } from "@/components/StockConsumptionChart";
import TutorialHint from "@/components/TutorialHint";
import HelpTooltip from "@/components/HelpTooltip";
import { cn } from "@/lib/utils";
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

export default function StockManagement() {
  const { isEnabled } = useFeatureFlags();
  const { activeProfile } = useUserProfiles();
  const { data: stockProjections, isLoading, refetch } = useStockProjection(activeProfile?.id);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

      // Add refill to consumption history
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

  if (isLoading) {
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
      
      <main className="container max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="heading-page flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              Estoque de Remédios
            </h1>
            <p className="text-lg text-muted-foreground">
              Veja quanto tem de cada remédio, quanto você toma por dia e quando vai acabar.
            </p>
            <p className="text-sm text-muted-foreground">
              O HoraMed calcula automaticamente baseado nas doses que você marca como tomadas.
            </p>
          </div>
        </div>

        {/* Tutorial Hint */}
        <TutorialHint
          id="stock_page"
          title="Controle inteligente de estoque 📦"
          message="O sistema calcula automaticamente quanto tempo seus medicamentos vão durar baseado no uso real. Veja projeções, receba alertas de estoque baixo e links para reposição. Atualize o estoque sempre que comprar mais."
        />

        {/* Empty State */}
        {(!stockProjections || stockProjections.length === 0) && (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="heading-card mb-2">Nenhum estoque configurado</h3>
            <p className="text-subtitle mb-6">
              Configure o controle de estoque ao adicionar medicamentos da receita
            </p>
            <Button onClick={() => window.location.href = "/cofre"}>
              <Plus className="h-4 w-4 mr-2" />
              Ir para Cofre
            </Button>
          </Card>
        )}

        {/* Stock Items */}
        <div className="space-y-4">
          {stockProjections?.map((item) => {
            const percentage = (item.units_left / item.units_total) * 100;
            const status = getStockStatus(item.units_left, item.units_total);
            const isExpanded = expandedItems.has(item.id);
            
            // Calcular data estimada de fim do estoque
            const estimatedEndDate = item.days_remaining 
              ? new Date(Date.now() + item.days_remaining * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
              : null;
            
            // Verificar se o medicamento está concluído
            const isFinished = item.treatment_end_date 
              ? new Date(item.treatment_end_date) < new Date() 
              : false;

            return (
              <Card key={item.id} className={cn(
                "transition-all hover:shadow-md border-l-4",
                isFinished
                  ? "bg-muted/50 border-l-muted-foreground/30 opacity-60"
                  : percentage <= 10 ? 'border-l-destructive' :
                    percentage <= 20 ? 'border-l-warning' :
                    'border-l-primary'
              )}>
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          "text-xl font-bold",
                          isFinished ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {item.item_name}
                        </h3>
                        {!isFinished && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/estoque/${item.item_id}`}
                            className="text-xs"
                          >
                            Ver detalhes completos →
                          </Button>
                        )}
                      </div>
                      
                      {isFinished && (
                        <div className="p-3 bg-muted border border-muted-foreground/20 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <span className="text-lg">✓</span>
                            Tratamento concluído
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Este medicamento finalizou o período de tratamento.
                          </p>
                        </div>
                      )}
                      
                      {/* Informações de origem da receita */}
                      {item.created_from_prescription_id && item.prescription_title && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Origem da receita:</p>
                            <button
                              onClick={() => window.location.href = `/cofre/${item.created_from_prescription_id}`}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {item.prescription_title}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cards de métricas principais */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-background border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Estoque Atual</p>
                          <p className="text-2xl font-bold text-foreground">
                            {item.units_left}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            de {item.units_total} unidades
                          </p>
                        </div>

                        <div className="bg-background border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Consumo médio</p>
                          <p className="text-2xl font-bold text-foreground">
                            {item.daily_consumption_avg.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">por dia</p>
                        </div>

                        <div className="bg-background border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Acabará em</p>
                          <p className="text-2xl font-bold text-foreground">
                            {item.days_remaining || '?'}
                          </p>
                          <p className="text-xs text-muted-foreground">dias</p>
                        </div>
                      </div>

                      {/* Resumo de doses tomadas */}
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <p className="text-sm font-medium text-foreground">Doses tomadas nos últimos 7 dias</p>
                          </div>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {item.taken_count_7d} de {item.scheduled_count_7d}
                          </p>
                        </div>
                        {item.adherence_7d !== null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Adesão: {Math.round(item.adherence_7d)}%
                          </p>
                        )}
                      </div>

                      {/* Data estimada de fim */}
                      {estimatedEndDate && item.days_remaining && item.days_remaining > 0 && (
                        <div className={`p-3 rounded-lg border ${
                          item.days_remaining <= 7 
                            ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                            : item.days_remaining <= 14
                            ? 'bg-warning/10 border-warning/30 text-warning-foreground'
                            : 'bg-muted border-border'
                        }`}>
                          <p className="text-xs font-medium mb-1">
                            {item.days_remaining <= 7 
                              ? '🚨 Previsão de fim de estoque:'
                              : item.days_remaining <= 14
                              ? '⚠️ Previsão de fim de estoque:'
                              : '📅 Previsão de fim de estoque:'
                            }
                          </p>
                          <p className="text-sm font-bold">
                            {estimatedEndDate} ({item.days_remaining} dias)
                          </p>
                          {item.days_remaining <= 14 && (
                            <p className="text-xs mt-1 opacity-90">
                              Considere comprar em breve para não interromper o tratamento
                            </p>
                          )}
                        </div>
                      )}
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
                              <Minus className="h-4 w-4 mr-2" />
                              Remover
                            </Button>
                          </div>

                          {adjustmentAmount > 0 && (
                            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                              <p>
                                Após adicionar: <strong className="text-success">{item.units_left + adjustmentAmount}</strong>
                              </p>
                              <p>
                                Após remover: <strong className="text-warning">{Math.max(0, item.units_left - adjustmentAmount)}</strong>
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
                      {item.days_remaining !== null && item.days_remaining > 0 && (
                        <span className={
                          item.days_remaining <= 7 ? "text-destructive font-medium" :
                          item.days_remaining <= 14 ? "text-warning font-medium" :
                          ""
                        }>
                          ~{item.days_remaining} dias restantes
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
                            <strong>🚨 Estoque Crítico!</strong>
                            <p>Apenas {item.units_left} {item.units_left === 1 ? 'unidade restante' : 'unidades restantes'}. Compre agora para não interromper o tratamento.</p>
                          </div>
                          {isEnabled('affiliate') && (
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
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div className="text-sm flex-1">
                            <strong>⚠️ Estoque Baixo</strong>
                            <p>Considere repor em breve. {item.days_remaining && `Acabará em ~${item.days_remaining} dias.`}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Expandable Details */}
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
                    <CollapsibleTrigger className="w-full">
                      <Button variant="ghost" size="sm" className="w-full">
                        {isExpanded ? '▼' : '▶'} Ver detalhes e análises
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

        {/* Info Card */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-foreground">💡 Como Funciona o Controle Automático</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Dedução automática:</strong> O estoque diminui quando você marca uma dose como tomada</li>
                <li><strong>Projeção inteligente:</strong> Calculamos quando vai acabar baseado no seu padrão real de consumo</li>
                <li><strong>Histórico completo:</strong> Veja linha do tempo de tudo que foi tomado, ajustado ou reabastecido</li>
                <li><strong>Alertas personalizados:</strong> Receba avisos antes de acabar, considerando seu ritmo de uso</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>

      <Navigation />
    </div>
  );
}
