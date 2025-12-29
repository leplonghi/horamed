import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PaymentMethodModal({ open, onOpenChange, onSuccess }: PaymentMethodModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState<{ last4: string; brand: string; expMonth: number; expYear: number } | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);

  // Load current payment method when modal opens
  const loadCurrentPaymentMethod = async () => {
    setLoadingCard(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-method');
      if (error) throw error;
      
      if (data?.paymentMethod) {
        setCurrentCard(data.paymentMethod);
      }
    } catch (error) {
      console.error('Error loading payment method:', error);
    } finally {
      setLoadingCard(false);
    }
  };

  // Update payment method via Stripe checkout
  const handleUpdatePaymentMethod = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-payment-method');
      
      if (error) throw error;
      
      if (data?.url) {
        // Open in same tab for better UX - user will return after update
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Update payment method error:', error);
      toast.error("Erro ao atualizar forma de pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Load payment method when modal opens
  useState(() => {
    if (open) {
      loadCurrentPaymentMethod();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Forma de Pagamento
          </DialogTitle>
          <DialogDescription>
            Atualize seu cartão de crédito ou débito
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cartão atual</p>
                  {loadingCard ? (
                    <p className="text-xs text-muted-foreground">Carregando...</p>
                  ) : currentCard ? (
                    <p className="text-xs text-muted-foreground">
                      {currentCard.brand.toUpperCase()} •••• {currentCard.last4} 
                      <span className="ml-2">
                        {String(currentCard.expMonth).padStart(2, '0')}/{currentCard.expYear}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum cartão cadastrado</p>
                  )}
                </div>
              </div>
              {currentCard && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativo
                </Badge>
              )}
            </div>
          </Card>

          {/* Security Info */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Pagamento 100% seguro</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seus dados são criptografados e processados pelo Stripe, 
                líder mundial em pagamentos online.
              </p>
            </div>
          </div>

          {/* Update Button */}
          <Button 
            className="w-full" 
            onClick={handleUpdatePaymentMethod}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Abrindo...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                {currentCard ? "Alterar Cartão" : "Adicionar Cartão"}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Você será direcionado para uma página segura para atualizar seu cartão.
            Após a atualização, você retornará automaticamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
