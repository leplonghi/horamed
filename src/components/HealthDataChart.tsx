import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Activity } from "lucide-react";

interface HealthDataPoint {
  date: string;
  weight_kg: number | null;
  height_cm: number | null;
}

interface HealthDataChartProps {
  data: HealthDataPoint[];
}

export default function HealthDataChart({ data }: HealthDataChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Evolução dos Dados de Saúde
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum histórico de dados de saúde disponível ainda.
          Adicione seus dados no perfil para visualizar a evolução.
        </p>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    date: format(new Date(point.date), "dd/MMM", { locale: ptBR }),
    peso: point.weight_kg,
    imc: point.weight_kg && point.height_cm 
      ? parseFloat((point.weight_kg / Math.pow(point.height_cm / 100, 2)).toFixed(1))
      : null,
  }));

  const hasWeightData = data.some(d => d.weight_kg !== null);
  const hasHeightData = data.some(d => d.height_cm !== null);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Evolução dos Dados de Saúde
      </h3>
      
      {hasWeightData && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Peso (kg)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="peso" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasWeightData && hasHeightData && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">IMC (Índice de Massa Corporal)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                domain={[15, 35]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="imc" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>18.5-25 Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>25-30 Sobrepeso</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>30+ Obesidade</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
