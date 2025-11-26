import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, FileText, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { StockTimeline } from "@/components/StockTimeline";
import { useStockProjection } from "@/hooks/useStockProjection";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StockDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const { data: item } = useQuery({
    queryKey: ["item-stock-details", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          stock (*)
        `)
        .eq("id", itemId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  const { data: doseHistory } = useQuery({
    queryKey: ["dose-history", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dose_instances")
        .select("*")
        .eq("item_id", itemId)
        .eq("status", "taken")
        .order("taken_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  const { data: stockProjections = [] } = useStockProjection(item?.profile_id);
  const stockProjection = stockProjections.find(sp => sp.item_id === itemId);

  const estimatedEndDate = stockProjection?.days_remaining 
    ? new Date(Date.now() + stockProjection.days_remaining * 24 * 60 * 60 * 1000)
    : null;

  const stockPercentage = item?.stock?.[0]
    ? (item.stock[0].units_left / item.stock[0].units_total) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl pt-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">{item?.name || "Carregando..."}</h1>
            </div>
            <p className="text-muted-foreground">Detalhes completos de estoque e consumo</p>
          </div>

          {/* Card de origem da receita */}
          {item?.stock?.[0]?.created_from_prescription_id && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Este medicamento veio da receita:</p>
                  <button
                    onClick={() => navigate(`/cofre/${item.stock[0].created_from_prescription_id}`)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Ver receita completa →
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Resumo do estoque atual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                <p className="text-4xl font-bold text-foreground">
                  {item?.stock?.[0]?.units_left || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  de {item?.stock?.[0]?.units_total || 0} {item?.stock?.[0]?.unit_label || "unidades"}
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      stockPercentage <= 10 ? 'bg-destructive' :
                      stockPercentage <= 20 ? 'bg-warning' :
                      'bg-primary'
                    }`}
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-950/10">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Consumo Médio</p>
                <p className="text-4xl font-bold text-foreground">
                  {stockProjection?.daily_consumption_avg.toFixed(1) || "0"}
                </p>
                <p className="text-sm text-muted-foreground">unidades por dia</p>
                {stockProjection?.adherence_7d !== null && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Adesão: {Math.round(stockProjection.adherence_7d)}% nos últimos 7 dias
                  </p>
                )}
              </div>
            </Card>

            <Card className={`p-6 ${
              (stockProjection?.days_remaining || 0) <= 7 
                ? 'bg-gradient-to-br from-destructive/20 to-destructive/10'
                : (stockProjection?.days_remaining || 0) <= 14
                ? 'bg-gradient-to-br from-warning/20 to-warning/10'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-950/10'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Previsão de fim</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {stockProjection?.days_remaining || "?"} dias
                </p>
                {estimatedEndDate && (
                  <p className="text-sm text-muted-foreground">
                    {format(estimatedEndDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                )}
                {(stockProjection?.days_remaining || 0) <= 14 && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-background/50 rounded">
                    <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">
                      Compre em breve!
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Histórico de doses tomadas */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Histórico de doses tomadas</h2>
              </div>
              
              {doseHistory && doseHistory.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Últimas {doseHistory.length} doses registradas:
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {doseHistory.map((dose, index) => (
                      <div
                        key={dose.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Dose #{doseHistory.length - index}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dose.taken_at 
                                ? format(new Date(dose.taken_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                : "Data não registrada"}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ Tomado
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma dose registrada ainda</p>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline de consumo */}
          {stockProjection && (
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Timeline de Estoque</h2>
                <StockTimeline
                  itemName={item?.name || ""}
                  consumptionHistory={stockProjection.consumption_history || []}
                  dailyAvg={stockProjection.daily_consumption_avg}
                  daysRemaining={stockProjection.days_remaining}
                />
              </div>
            </Card>
          )}

          {/* Explicação de como funciona */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="space-y-3">
              <h3 className="font-bold text-foreground">💡 Como calculamos estas informações</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li><strong>Estoque atual:</strong> Reduzido automaticamente cada vez que você marca uma dose como tomada</li>
                <li><strong>Consumo médio:</strong> Calculado com base nas doses que você realmente tomou nos últimos 7 dias</li>
                <li><strong>Previsão de fim:</strong> Estimativa de quando o estoque acabará se você continuar no ritmo atual</li>
                <li><strong>Histórico:</strong> Registro de todas as doses tomadas para você acompanhar seu tratamento</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
