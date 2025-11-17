import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, TrendingDown, MapPin, ExternalLink, Truck, Store, Lock } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface PharmacyPrice {
  name: string;
  price: number;
  link: string;
  delivery: boolean;
  distance: number;
}

interface PriceComparison {
  medication: string;
  pharmacies: PharmacyPrice[];
  savings: number;
  lowestPrice: number;
  highestPrice: number;
}

const Pharmacy = () => {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  const [medicationName, setMedicationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PriceComparison | null>(null);

  // Feature flag: prices desabilitada por padrão
  if (!isEnabled('prices')) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto text-center pt-20 space-y-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Funcionalidade Desabilitada</h2>
            <p className="text-muted-foreground">
              A pesquisa de preços em farmácias está temporariamente desabilitada. Estamos trabalhando em parcerias para oferecer este serviço em breve.
            </p>
            <Button onClick={() => navigate('/hoje')} variant="outline">
              Voltar para Início
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const searchPrices = async () => {
    if (!medicationName.trim()) {
      toast.error("Digite o nome do medicamento");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pharmacy-prices', {
        body: { medicationName: medicationName.trim() }
      });

      if (error) throw error;

      setResults(data);
      toast.success("Preços encontrados!");
    } catch (error) {
      console.error('Error searching prices:', error);
      toast.error("Erro ao buscar preços");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pt-24 space-y-6">{/* pt-24 para compensar o header fixo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Farmácia Virtual</h1>
            <p className="text-muted-foreground">Compare preços e economize</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Medicamento</CardTitle>
            <CardDescription>Digite o nome do medicamento para comparar preços</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Paracetamol 500mg"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPrices()}
              />
              <Button onClick={searchPrices} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <>
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  Economia Potencial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  R$ {results.savings.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprando na farmácia mais barata vs. mais cara
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Preços Encontrados</h2>
              {results.pharmacies.map((pharmacy, index) => (
                <Card key={index} className={index === 0 ? "border-green-500 shadow-lg" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
                          {index === 0 && (
                            <Badge variant="default" className="bg-green-600">
                              Melhor Preço
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {pharmacy.distance} km
                          </div>
                          <div className="flex items-center gap-1">
                            {pharmacy.delivery ? (
                              <>
                                <Truck className="w-4 h-4" />
                                Entrega disponível
                              </>
                            ) : (
                              <>
                                <Store className="w-4 h-4" />
                                Retirada na loja
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-2xl font-bold text-primary">
                          R$ {pharmacy.price.toFixed(2)}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(pharmacy.link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Comprar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Pharmacy;
