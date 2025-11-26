import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import AdherenceChart from "@/components/AdherenceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InteractiveTimelineChart from "@/components/InteractiveTimelineChart";

export default function AnalyticsDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: doses = [] } = useQuery({
    queryKey: ["analytics-doses", user?.id],
    queryFn: async () => {
      const now = new Date();
      const startDate = subDays(now, 30);

      const { data, error } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(name, user_id)
        `)
        .eq("items.user_id", user?.id)
        .gte("due_at", startOfDay(startDate).toISOString())
        .lte("due_at", endOfDay(now).toISOString())
        .order("due_at", { ascending: true });

      if (error) throw error;
      
      // Transform to match expected type
      const transformedData = (data || []).map(dose => ({
        id: dose.id,
        due_at: dose.due_at,
        status: dose.status as 'scheduled' | 'taken' | 'missed' | 'skipped',
        taken_at: dose.taken_at,
        items: {
          name: (dose.items as any).name
        }
      }));
      
      return transformedData;
    },
    enabled: !!user?.id,
  });

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
          title="Análise Detalhada de Progresso"
          description="Veja estatísticas completas de adesão e pontualidade"
          icon={<BarChart3 className="h-6 w-6 text-primary" />}
        />

        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Adesão</CardTitle>
            </CardHeader>
            <CardContent>
              <AdherenceChart period="month" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveTimelineChart doses={doses} period="month" />
            </CardContent>
          </Card>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
