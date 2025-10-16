import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Phone, MapPin, Clock, Activity } from "lucide-react";

interface EmergencyResponse {
  guidance: string;
  medication: string;
  missedDoses: number;
  timeSinceMissed: string;
  nearbyPharmacies: Array<{
    name: string;
    address: string;
    distance: number;
    phone: string;
    open24h: boolean;
  }>;
  emergencyContacts: Array<{
    name: string;
    phone: string;
  }>;
}

const Emergency = () => {
  const navigate = useNavigate();
  const [medicationName, setMedicationName] = useState("");
  const [missedDoses, setMissedDoses] = useState("1");
  const [timeSinceMissed, setTimeSinceMissed] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<EmergencyResponse | null>(null);

  const handleEmergency = async () => {
    if (!medicationName.trim() || !timeSinceMissed.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-guidance', {
        body: {
          medicationName: medicationName.trim(),
          missedDoses: parseInt(missedDoses),
          timeSinceMissed: timeSinceMissed.trim(),
          userLocation: null // Em produção, obter geolocalização real
        }
      });

      if (error) throw error;

      setResponse(data);
      toast.success("Orientação obtida");
    } catch (error) {
      console.error('Error getting emergency guidance:', error);
      toast.error("Erro ao obter orientação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-600 font-semibold">
            MODO EMERGÊNCIA - Em caso de emergência grave, ligue para o SAMU (192)
          </AlertDescription>
        </Alert>

        <div>
          <h1 className="text-3xl font-bold text-red-600">Modo Emergência</h1>
          <p className="text-muted-foreground">Orientação rápida para doses esquecidas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Dose Esquecida</CardTitle>
            <CardDescription>Preencha os dados para receber orientação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Medicamento</Label>
              <Input
                placeholder="Ex: Losartana 50mg"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Quantas doses foram esquecidas?</Label>
              <Input
                type="number"
                min="1"
                value={missedDoses}
                onChange={(e) => setMissedDoses(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Há quanto tempo esqueceu? (Ex: 2 horas, 1 dia)</Label>
              <Input
                placeholder="Ex: 3 horas"
                value={timeSinceMissed}
                onChange={(e) => setTimeSinceMissed(e.target.value)}
              />
            </div>

            <Button
              onClick={handleEmergency}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              Obter Orientação de Emergência
            </Button>
          </CardContent>
        </Card>

        {response && (
          <>
            <Card className="border-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Orientação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {response.guidance}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contatos de Emergência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {response.emergencyContacts.map((contact, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open(`tel:${contact.phone}`, '_self')}
                  >
                    <span>{contact.name}</span>
                    <span className="font-bold">{contact.phone}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Farmácias 24h Próximas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {response.nearbyPharmacies.map((pharmacy, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{pharmacy.name}</h3>
                        <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {pharmacy.distance} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Aberto 24h
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${pharmacy.phone}`, '_self')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Ligar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Emergency;
