import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PharmacyPriceCard from "./PharmacyPriceCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface RefillButtonProps {
  medicationName: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function RefillButton({ 
  medicationName, 
  variant = "outline",
  size = "sm",
  className = ""
}: RefillButtonProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const t = {
    buyRefill: language === 'pt' ? 'Comprar Refil' : 'Buy Refill',
    comparePrices: language === 'pt' ? 'Comparar Preços' : 'Compare Prices',
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => setOpen(true)}
        className={`gap-2 ${className}`}
      >
        <ShoppingBag className="h-4 w-4" />
        {t.buyRefill}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.comparePrices}</DialogTitle>
          </DialogHeader>
          <PharmacyPriceCard 
            medicationName={medicationName}
            onBuy={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
