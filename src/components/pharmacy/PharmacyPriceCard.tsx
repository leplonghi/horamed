import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, 
  ExternalLink, 
  Truck, 
  MapPin,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Pharmacy {
  name: string;
  price: number;
  link: string;
  delivery: boolean;
  distance: number;
}

interface PharmacyPriceCardProps {
  medicationName: string;
  onBuy?: (pharmacy: Pharmacy) => void;
}

export default function PharmacyPriceCard({ medicationName, onBuy }: PharmacyPriceCardProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [savings, setSavings] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [searched, setSearched] = useState(false);

  const t = {
    title: language === 'pt' ? 'Comparar Preços' : 'Compare Prices',
    search: language === 'pt' ? 'Buscar Preços' : 'Search Prices',
    savings: language === 'pt' ? 'Economia' : 'Savings',
    lowestPrice: language === 'pt' ? 'Menor preço' : 'Lowest price',
    delivery: language === 'pt' ? 'Entrega' : 'Delivery',
    buy: language === 'pt' ? 'Comprar' : 'Buy',
    showMore: language === 'pt' ? 'Ver mais' : 'Show more',
    showLess: language === 'pt' ? 'Ver menos' : 'Show less',
    refresh: language === 'pt' ? 'Atualizar' : 'Refresh',
  };

  const searchPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pharmacy-prices', {
        body: { medicationName }
      });
      
      if (error) throw error;
      
      setPharmacies(data.pharmacies);
      setSavings(data.savings);
      setSearched(true);
      
    } catch (error) {
      console.error("Error searching prices:", error);
      toast.error(language === 'pt' ? 'Erro ao buscar preços' : 'Error searching prices');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (pharmacy: Pharmacy) => {
    // Track affiliate click
    supabase.functions.invoke('affiliate-click', {
      body: { 
        pharmacy: pharmacy.name, 
        medication: medicationName,
        price: pharmacy.price
      }
    }).catch(console.error);

    window.open(pharmacy.link, '_blank');
    onBuy?.(pharmacy);
  };

  const displayedPharmacies = expanded ? pharmacies : pharmacies.slice(0, 3);

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            {t.title}
          </div>
          {savings > 0 && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
              <TrendingDown className="h-3 w-3" />
              {t.savings}: R$ {savings.toFixed(2)}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground truncate">{medicationName}</p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : searched ? (
          <>
            <AnimatePresence>
              {displayedPharmacies.map((pharmacy, index) => (
                <motion.div
                  key={pharmacy.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    index === 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{pharmacy.name}</p>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                            {t.lowestPrice}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {pharmacy.delivery && (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {t.delivery}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pharmacy.distance.toFixed(1)} km
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        R$ {pharmacy.price.toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBuy(pharmacy)}
                        className="mt-1 gap-1"
                      >
                        {t.buy}
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {pharmacies.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full gap-2"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    {t.showLess}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {t.showMore} ({pharmacies.length - 3})
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={searchPrices}
              disabled={loading}
              className="w-full gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </>
        ) : (
          <Button 
            onClick={searchPrices} 
            disabled={loading} 
            className="w-full gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {t.search}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
