import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, Pill } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyData {
  day: string;
  adherence: number;
  total: number;
  taken: number;
}

interface MissedItem {
  name: string;
  missed_count: number;
}

export default function Charts() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [missedItems, setMissedItems] = useState<MissedItem[]>([]);
  const [avgDelay, setAvgDelay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartsData();
  }, []);

  const fetchChartsData = async () => {
    try {
      // Get last 7 days data
      const today = new Date();
      const weekAgo = subDays(today, 6);

      const weeklyDataPromises = [];
      for (let i = 0; i < 7; i++) {
        const day = subDays(today, 6 - i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const promise = supabase
          .from("dose_instances")
          .select("status")
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString())
          .then(({ data }) => {
            const total = data?.length || 0;
            const taken = data?.filter((d) => d.status === "taken").length || 0;
            return {
              day: format(day, "EEE", { locale: ptBR }),
              adherence: total > 0 ? Math.round((taken / total) * 100) : 0,
              total,
              taken,
            };
          });

        weeklyDataPromises.push(promise);
      }

      const weekData = await Promise.all(weeklyDataPromises);
      setWeeklyData(weekData);

      // Get most missed items
      const { data: allDoses } = await supabase
        .from("dose_instances")
        .select(`
          status,
          item_id,
          items (name)
        `)
        .gte("due_at", weekAgo.toISOString())
        .in("status", ["skipped", "scheduled"]);

      const missedByItem: { [key: string]: { name: string; count: number } } = {};
      allDoses?.forEach((dose: any) => {
        const itemName = dose.items?.name || "Unknown";
        if (!missedByItem[itemName]) {
          missedByItem[itemName] = { name: itemName, count: 0 };
        }
        missedByItem[itemName].count++;
      });

      const topMissed = Object.values(missedByItem)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => ({
          name: item.name,
          missed_count: item.count,
        }));

      setMissedItems(topMissed);

      // Calculate average delay
      const { data: takenDoses } = await supabase
        .from("dose_instances")
        .select("delay_minutes")
        .eq("status", "taken")
        .gte("due_at", weekAgo.toISOString())
        .not("delay_minutes", "is", null);

      if (takenDoses && takenDoses.length > 0) {
        const totalDelay = takenDoses.reduce(
          (sum, dose) => sum + (dose.delay_minutes || 0),
          0
        );
        setAvgDelay(Math.round(totalDelay / takenDoses.length));
      }
    } catch (error) {
      console.error("Error fetching charts data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando gráficos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Gráficos</h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe sua adesão semanal
          </p>
        </div>

        {/* Weekly Adherence Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Adesão nos últimos 7 dias</h2>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === "adherence") return [`${value}%`, "Adesão"];
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="adherence"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Atraso médio</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{avgDelay} min</p>
            <p className="text-sm text-muted-foreground">
              Tempo médio de atraso ao confirmar doses
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <h3 className="font-semibold">Meta semanal</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {weeklyData.length > 0
                ? Math.round(
                    weeklyData.reduce((sum, d) => sum + d.adherence, 0) /
                      weeklyData.length
                  )
                : 0}
              %
            </p>
            <p className="text-sm text-muted-foreground">
              Adesão média da semana
            </p>
          </Card>
        </div>

        {/* Most Missed Items */}
        {missedItems.length > 0 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-semibold">Itens mais esquecidos</h2>
            </div>

            <div className="space-y-3">
              {missedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-sm font-bold text-warning">
                      {index + 1}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.missed_count} {item.missed_count === 1 ? "vez" : "vezes"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
