import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { StockTimeline } from "@/components/StockTimeline";
import StockChart from "@/components/StockChart";
import { useStockProjection } from "@/hooks/useStockProjection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const { data: stockProjections = [] } = useStockProjection(item?.profile_id);
  const stockProjection = stockProjections.find(sp => sp.item_id === itemId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl pt-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <PageHeader
          title="Detalhes de Estoque"
          description={item?.name || "Carregando..."}
          icon={<Package className="h-6 w-6 text-primary" />}
        />

        <div className="space-y-6 mt-6">
          {item?.stock && stockProjection && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Visão Geral do Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                        <p className="text-2xl font-bold">{item.stock[0]?.units_left || 0} {item.stock[0]?.unit_label || "unidades"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dias Restantes</p>
                        <p className="text-2xl font-bold">{stockProjection?.days_remaining || "N/A"} dias</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Consumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockTimeline
                    itemName={item.name}
                    consumptionHistory={stockProjection?.consumption_history || []}
                    dailyAvg={stockProjection?.daily_consumption_avg || 0}
                    daysRemaining={stockProjection?.days_remaining || null}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
}
