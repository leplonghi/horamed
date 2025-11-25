import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TravelPackingList } from "@/components/TravelPackingList";
import { useTravelMode } from "@/hooks/useTravelMode";
import { Plane, MapPin, Calendar, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { addDays } from "date-fns";

const COMMON_TIMEZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "America/New_York", label: "Nova York (EST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Europe/London", label: "Londres (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tóquio (JST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

export default function TravelMode() {
  const [tripDays, setTripDays] = useState<number>(7);
  const [destinationTimezone, setDestinationTimezone] = useState<string>("America/New_York");
  const [adjustSchedules, setAdjustSchedules] = useState(true);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const { calculations, isLoading, calculateTravelNeeds, adjustSchedulesForTimezone } = useTravelMode();
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleCalculate = async () => {
    if (tripDays < 1) {
      toast.error("Duração da viagem deve ser maior que 0");
      return;
    }

    await calculateTravelNeeds(tripDays, destinationTimezone);
    setHasCalculated(true);
    toast.success("Cálculos realizados com sucesso!");
  };

  const handleApplyAdjustments = async () => {
    if (!adjustSchedules) {
      toast.info("Ajustes de horário não serão aplicados");
      return;
    }

    const start = new Date(startDate);
    const end = addDays(start, tripDays);

    await adjustSchedulesForTimezone(destinationTimezone, start, end);
    toast.success("Horários ajustados para o fuso horário de destino!");
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <PageHeader
        title="Modo Viagem"
        description="Planeje sua viagem com ajustes automáticos de horários e lista de bagagem inteligente"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Configurar Viagem
            </CardTitle>
            <CardDescription>
              Configure os detalhes da sua viagem para gerar sua lista de bagagem e ajustar horários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Partida
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip-days" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duração (dias)
                </Label>
                <Input
                  id="trip-days"
                  type="number"
                  min="1"
                  value={tripDays}
                  onChange={(e) => setTripDays(parseInt(e.target.value) || 1)}
                  placeholder="7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Fuso Horário de Destino
              </Label>
              <Select value={destinationTimezone} onValueChange={setDestinationTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ajustar Horários Automaticamente
                </Label>
                <p className="text-sm text-muted-foreground">
                  Seus horários de dose serão ajustados para o fuso horário de destino
                </p>
              </div>
              <Switch checked={adjustSchedules} onCheckedChange={setAdjustSchedules} />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCalculate}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Calculando..." : "Calcular Necessidades"}
              </Button>
              
              {hasCalculated && adjustSchedules && (
                <Button
                  onClick={handleApplyAdjustments}
                  variant="secondary"
                >
                  Aplicar Ajustes
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {hasCalculated && calculations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <TravelPackingList calculations={calculations} tripDays={tripDays} />
        </motion.div>
      )}

      {hasCalculated && calculations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum medicamento ativo encontrado para calcular
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
