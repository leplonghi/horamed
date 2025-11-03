import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdherenceChartProps {
  doses?: Array<{
    id: string;
    item_id: string;
    due_at: string;
    status: 'scheduled' | 'taken' | 'missed' | 'skipped';
    taken_at: string | null;
    items: {
      name: string;
      dose_text: string | null;
    };
  }>;
  weeklyData?: { day: string; taken: number; total: number }[];
  period?: "today" | "week" | "month";
}

export default function AdherenceChart({ doses, weeklyData, period = "week" }: AdherenceChartProps) {
  // Generate chart data based on period or use provided weeklyData
  const generateChartData = () => {
    // If weeklyData is provided, use it directly (legacy support)
    if (weeklyData) {
      return weeklyData;
    }

    // Otherwise, generate from doses
    if (!doses || doses.length === 0) {
      return [];
    }

    if (period === 'today') {
      // Group by hour
      const hourlyData: Record<string, { taken: number; total: number }> = {};
      doses.forEach(dose => {
        const hour = format(new Date(dose.due_at), 'HH:00');
        if (!hourlyData[hour]) {
          hourlyData[hour] = { taken: 0, total: 0 };
        }
        hourlyData[hour].total++;
        if (dose.status === 'taken') {
          hourlyData[hour].taken++;
        }
      });
      return Object.entries(hourlyData).map(([hour, data]) => ({
        day: hour,
        taken: data.taken,
        total: data.total
      }));
    } else if (period === 'week') {
      // Group by day of week
      const dayData: Record<string, { taken: number; total: number }> = {};
      doses.forEach(dose => {
        const day = format(new Date(dose.due_at), 'EEE', { locale: ptBR });
        if (!dayData[day]) {
          dayData[day] = { taken: 0, total: 0 };
        }
        dayData[day].total++;
        if (dose.status === 'taken') {
          dayData[day].taken++;
        }
      });
      return Object.entries(dayData).map(([day, data]) => ({
        day,
        taken: data.taken,
        total: data.total
      }));
    } else {
      // Group by day of month
      const dayData: Record<string, { taken: number; total: number }> = {};
      doses.forEach(dose => {
        const day = format(new Date(dose.due_at), 'dd/MM');
        if (!dayData[day]) {
          dayData[day] = { taken: 0, total: 0 };
        }
        dayData[day].total++;
        if (dose.status === 'taken') {
          dayData[day].taken++;
        }
      });
      return Object.entries(dayData).map(([day, data]) => ({
        day,
        taken: data.taken,
        total: data.total
      }));
    }
  };

  const data = generateChartData();

  const chartData = data.map((day) => ({
    dia: day.day,
    Tomadas: day.taken,
    "Não Tomadas": day.total - day.taken,
    total: day.total,
    adherence: day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0,
  }));

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          Nenhum dado disponível para exibir
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Adesão {period === "today" ? "Diária" : period === "week" ? "Semanal" : "Mensal"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Visualização detalhada das doses tomadas e não tomadas
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="dia" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Doses', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: string, props: any) => {
                const percentage = props.payload.adherence;
                return [
                  `${value} doses ${name === "Tomadas" ? `(${percentage}%)` : ''}`,
                  name
                ];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="Tomadas" 
              stackId="doses"
              fill="hsl(var(--success))" 
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Não Tomadas" 
              stackId="doses"
              fill="hsl(var(--destructive))" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="flex items-center justify-center gap-6 pt-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Tomadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Não Tomadas</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
