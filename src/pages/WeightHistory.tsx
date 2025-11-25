import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Plus, ArrowLeft, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WeightRegistrationModal from "@/components/WeightRegistrationModal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WeightHistory() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profile");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: weightLogs, refetch } = useQuery({
    queryKey: ["weight-history", user?.id, profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user?.id)
        .eq("profile_id", profileId || null)
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const chartData = weightLogs
    ?.slice()
    .reverse()
    .map((log) => ({
      date: format(new Date(log.recorded_at), "dd/MM", { locale: ptBR }),
      weight: typeof log.weight_kg === 'string' ? parseFloat(log.weight_kg) : log.weight_kg,
    }));

  const getTrend = () => {
    if (!weightLogs || weightLogs.length < 2) return null;
    const latest = typeof weightLogs[0].weight_kg === 'string' 
      ? parseFloat(weightLogs[0].weight_kg) 
      : weightLogs[0].weight_kg;
    const previous = typeof weightLogs[1].weight_kg === 'string'
      ? parseFloat(weightLogs[1].weight_kg)
      : weightLogs[1].weight_kg;
    const diff = latest - previous;
    return {
      diff,
      icon: diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus,
      color: diff > 0 ? "text-orange-600" : diff < 0 ? "text-green-600" : "text-muted-foreground",
      text: diff > 0 ? `+${diff.toFixed(1)} kg` : diff < 0 ? `${diff.toFixed(1)} kg` : "Manteve",
    };
  };

  const trend = getTrend();

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title="Histórico de Peso"
            description="Acompanhe a evolução do seu peso ao longo do tempo"
            icon={<Scale className="h-6 w-6 text-primary" />}
          />
        </div>

        {/* Summary Card */}
        {weightLogs && weightLogs.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {weightLogs[0].weight_kg}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Peso atual (kg)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{weightLogs.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Registros</p>
                </div>
                {trend && (
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <trend.icon className={`h-5 w-5 ${trend.color}`} />
                      <p className={`text-2xl font-bold ${trend.color}`}>{trend.text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Última variação</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Card */}
        {chartData && chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Peso</CardTitle>
              <CardDescription>Últimos 30 dias de registros</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`${value} kg`, "Peso"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        <Button
          className="w-full gap-2 h-12 text-base"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Registrar novo peso
        </Button>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Registros</CardTitle>
            <CardDescription>
              {weightLogs?.length || 0} {weightLogs?.length === 1 ? "registro" : "registros"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weightLogs && weightLogs.length > 0 ? (
              <div className="space-y-3">
                {weightLogs.map((log, index) => {
                  const prevWeight = weightLogs[index + 1]?.weight_kg;
                  const currentWeight = typeof log.weight_kg === 'string' ? parseFloat(log.weight_kg) : log.weight_kg;
                  const previousWeight = prevWeight && typeof prevWeight === 'string' ? parseFloat(prevWeight) : prevWeight;
                  const diff = previousWeight ? currentWeight - previousWeight : null;

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-primary">
                            {log.weight_kg} <span className="text-sm font-normal">kg</span>
                          </p>
                          {diff !== null && (
                            <span
                              className={`text-sm font-medium ${
                                diff > 0
                                  ? "text-orange-600"
                                  : diff < 0
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(log.recorded_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            "{log.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Nenhum registro de peso ainda
                </p>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primeiro peso
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <WeightRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        profileId={profileId || undefined}
        onSuccess={refetch}
      />
    </div>
  );
}
