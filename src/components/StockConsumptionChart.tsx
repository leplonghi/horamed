import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  itemName: string;
  takenCount: number;
  scheduledCount: number;
  adherence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  unitsLeft: number;
  unitsTotal: number;
}

export function StockConsumptionChart({
  itemName,
  takenCount,
  scheduledCount,
  adherence,
  trend,
  unitsLeft,
  unitsTotal,
}: Props) {
  const missedCount = scheduledCount - takenCount;
  const stockPercentage = (unitsLeft / unitsTotal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Análise de Consumo (7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adherence Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-subtitle">Seu progresso</span>
            <span className={`font-semibold ${
              adherence >= 80 ? 'text-success' :
              adherence >= 60 ? 'text-warning' :
              'text-destructive'
            }`}>
              {adherence}%
            </span>
          </div>
          <Progress value={adherence} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>✓ {takenCount} tomadas</span>
            {missedCount > 0 && (
              <span className="text-warning">⚠ {missedCount} perdidas</span>
            )}
          </div>
        </div>

        {/* Consumption Trend */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {trend === 'increasing' && (
              <>
                <TrendingUp className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Consumo aumentando</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <Minus className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Consumo estável</span>
              </>
            )}
            {trend === 'decreasing' && (
              <>
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Consumo diminuindo</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {trend === 'increasing' && 
              'Você está tomando mais doses recentemente. Verifique se está seguindo a prescrição corretamente.'}
            {trend === 'stable' && 
              'Seu consumo está consistente. Continue assim!'}
            {trend === 'decreasing' && 
              'Você está tomando menos doses recentemente. Não se esqueça do tratamento!'}
          </p>
        </div>

        {/* Stock Status */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-subtitle">Estoque restante</span>
            <span className={`font-semibold ${
              stockPercentage <= 10 ? 'text-destructive' :
              stockPercentage <= 25 ? 'text-warning' :
              'text-success'
            }`}>
              {unitsLeft} de {unitsTotal}
            </span>
          </div>
          <Progress value={stockPercentage} className="h-2" />
        </div>

        {/* Smart Insights */}
        {adherence < 80 && missedCount > 0 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-xs text-warning-foreground">
              <strong>💡 Dica:</strong> Você perdeu {missedCount} {missedCount === 1 ? 'dose' : 'doses'} essa semana.
              Configure lembretes para não esquecer!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
