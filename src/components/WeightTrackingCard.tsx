import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Plus, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WeightRegistrationModal from "./WeightRegistrationModal";
import { useNavigate } from "react-router-dom";

interface WeightTrackingCardProps {
  userId: string;
  profileId?: string;
}

export default function WeightTrackingCard({ userId, profileId }: WeightTrackingCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const { data: latestWeight, refetch } = useQuery({
    queryKey: ["latest-weight", userId, profileId],
    queryFn: async () => {
      let query = supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", userId);
      
      if (profileId) {
        query = query.eq("profile_id", profileId);
      } else {
        query = query.is("profile_id", null);
      }
      
      const { data, error } = await query
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Card className="border-2 hover:border-primary/30 transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Acompanhamento de peso
          </CardTitle>
          <CardDescription>
            Registre seu peso regularmente para acompanhar a evolução
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Peso atual</p>
              {latestWeight ? (
                <p className="text-3xl font-bold text-primary">
                  {latestWeight.weight_kg} <span className="text-lg font-normal">kg</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Ainda não registrado</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Última medição</p>
              {latestWeight ? (
                <p className="text-sm font-medium">
                  {format(new Date(latestWeight.recorded_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">-</p>
              )}
            </div>
          </div>

          <Button
            className="w-full gap-2 h-12 text-base"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-5 w-5" />
            Registrar novo peso
          </Button>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Use este espaço para registrar o peso sempre que se pesar. Assim, o HoraMed mostra a
            evolução e coloca no relatório para o médico.
          </p>

          <Button
            variant="link"
            className="text-xs h-auto p-0 gap-1"
            onClick={() => navigate(`/peso/historico${profileId ? `?profile=${profileId}` : ""}`)}
          >
            <History className="h-3 w-3" />
            Ver histórico de peso
          </Button>
        </CardContent>
      </Card>

      <WeightRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        profileId={profileId}
        onSuccess={refetch}
      />
    </>
  );
}
