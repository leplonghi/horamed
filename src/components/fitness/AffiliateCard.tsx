import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Zap, ExternalLink, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AffiliateProduct {
  name: string;
  description: string;
  url?: string;
  source?: string;
}

interface AffiliateCardProps {
  product: AffiliateProduct;
  onDismiss?: () => void;
  context?: string; // "medication_list" | "detail_page" | "exam_view" | "ai_query"
}

export function AffiliateCard({ product, onDismiss, context }: AffiliateCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-lime-50/50 dark:from-amber-950/20 dark:to-lime-950/20 relative">
      <CardContent className="p-4 space-y-3">
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div>
              <h4 className="font-semibold text-sm text-foreground">{product.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {product.description}
              </p>
            </div>

            {product.url && (
              <Button
                size="sm"
                variant="default"
                className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                onClick={() => window.open(product.url, '_blank')}
              >
                Ver mais
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}

            <div className="space-y-1 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                Este link é de afiliado. Você apoia o HoraMed.
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-blue-500" />
                Consulte seu profissional de saúde.
              </p>
              {product.source && (
                <p className="text-[10px] text-muted-foreground italic">
                  Fonte: {product.source}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
