import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingDown, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StockItem {
  id: string;
  item_name: string;
  units_left: number;
  units_total: number;
  projected_end_at: string | null;
  unit_label: string;
}

export default function StockChart() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

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
          units_left,
          units_total,
          projected_end_at,
          unit_label,
          items!inner(id, name, user_id, is_active)
        `)
        .eq("items.user_id", user.id)
        .eq("items.is_active", true)
        .gt("units_total", 0);

      if (stock) {
        const formattedStock = stock.map((s: any) => ({
          id: s.id,
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-muted-foreground text-center">
          Carregando estoque...
        </div>
      </Card>
    );
  }

  if (stockItems.length === 0) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Controle de Estoque
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure o estoque dos seus medicamentos para receber alertas quando estiver acabando.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = stockItems.map(item => ({
    name: item.item_name.length > 15 ? item.item_name.substring(0, 15) + "..." : item.item_name,
    fullName: item.item_name,
    restante: item.units_left,
    total: item.units_total,
    percentage: (item.units_left / item.units_total) * 100,
    unit_label: item.unit_label,
    projected_end_at: item.projected_end_at,
  }));

  // Calculate alerts
  const lowStock = stockItems.filter(item => {
    const percentage = (item.units_left / item.units_total) * 100;
    return percentage < 20 && percentage > 0;
  });

  const criticalStock = stockItems.filter(item => {
    const daysLeft = item.projected_end_at 
      ? differenceInDays(new Date(item.projected_end_at), new Date())
      : null;
    return daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  });

  const getBarColor = (percentage: number) => {
    if (percentage > 50) return "hsl(var(--success))";
    if (percentage > 20) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Controle de Estoque
            </h3>
            {(lowStock.length > 0 || criticalStock.length > 0) && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium text-warning">
                  {lowStock.length + criticalStock.length} alerta(s)
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Acompanhe a quantidade disponível de cada medicamento e planeje suas reposições
          </p>

          {/* Stock Bar Chart */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Unidades', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    if (name === "restante") {
                      return [
                        `${value} de ${props.payload.total} ${props.payload.unit_label}`,
                        props.payload.fullName
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="restante" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Stock Details Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {stockItems.map((item) => {
          const percentage = (item.units_left / item.units_total) * 100;
          const daysLeft = item.projected_end_at 
            ? differenceInDays(new Date(item.projected_end_at), new Date())
            : null;
          
          const isLowStock = percentage < 20 && percentage > 0;
          const isCritical = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

          return (
            <Card 
              key={item.id} 
              className={`p-4 transition-all ${
                isCritical ? 'bg-destructive/5 border-destructive/30' :
                isLowStock ? 'bg-warning/5 border-warning/30' :
                'hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-semibold text-base">{item.item_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.units_left} de {item.units_total} {item.unit_label}
                    </p>
                  </div>
                  {(isLowStock || isCritical) && (
                    <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                      isCritical ? 'text-destructive' : 'text-warning'
                    }`} />
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getBarColor(percentage)
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(percentage)}% disponível</span>
                    {daysLeft !== null && daysLeft > 0 && (
                      <span className={
                        daysLeft <= 7 ? 'text-destructive font-medium' :
                        daysLeft <= 14 ? 'text-warning font-medium' :
                        'text-muted-foreground'
                      }>
                        ~{daysLeft} dias restantes
                      </span>
                    )}
                  </div>
                </div>

                {/* Alert Messages */}
                {isCritical && (
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>Estoque acabando! Acaba em {daysLeft} dias.</span>
                  </div>
                )}
                {isLowStock && !isCritical && (
                  <div className="flex items-start gap-2 p-2 bg-warning/10 rounded text-xs text-warning-foreground">
                    <TrendingDown className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>Estoque baixo. Considere repor em breve.</span>
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Como funciona o estoque?</p>
            <p>
              O sistema calcula automaticamente quando seu estoque vai acabar com base no consumo diário.
              Você receberá alertas quando estiver baixo ou próximo do fim.
            </p>
            <p className="text-xs mt-2">
              💡 <strong>Dica:</strong> Mantenha sempre estoque extra de medicamentos essenciais para evitar interrupções no tratamento.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
