import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface TravelCalculation {
  medication: {
    id: string;
    name: string;
    dose_text: string;
    category: string;
  };
  dailyDoses: number;
  totalRequired: number;
  currentStock: number;
  needsToBuy: number;
  packingNotes: string;
}

interface TravelPackingListProps {
  calculations: TravelCalculation[];
  tripDays: number;
}

export function TravelPackingList({ calculations, tripDays }: TravelPackingListProps) {
  const needsToBuy = calculations.filter(c => c.needsToBuy > 0);
  const readyToPack = calculations.filter(c => c.needsToBuy === 0);

  return (
    <div className="space-y-4">
      {needsToBuy.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShoppingCart className="h-5 w-5" />
                Precisa Comprar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {needsToBuy.map((item, index) => (
                <motion.div
                  key={item.medication.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.medication.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.medication.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.medication.dose_text}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Estoque: <span className="font-medium">{item.currentStock}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Necessário: <span className="font-medium">{item.totalRequired}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <AlertCircle className="h-5 w-5 text-destructive mb-1 ml-auto" />
                    <p className="text-lg font-bold text-destructive">
                      {item.needsToBuy}
                    </p>
                    <p className="text-xs text-muted-foreground">faltam</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {readyToPack.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lista de Bagagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readyToPack.map((item, index) => (
                <motion.div
                  key={item.medication.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <p className="font-medium">{item.medication.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {item.medication.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {item.medication.dose_text}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{item.totalRequired}</p>
                      <p className="text-xs text-muted-foreground">unidades</p>
                    </div>
                  </div>
                  <div className="pl-6">
                    <p className="text-xs text-muted-foreground italic">
                      💡 {item.packingNotes}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.dailyDoses}x por dia × {tripDays} dias (+2 dias de margem)
                    </p>
                  </div>
                  {index < readyToPack.length - 1 && <Separator className="mt-3" />}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
