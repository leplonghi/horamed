import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const SubscriptionCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-orange-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Assinatura cancelada
            </h1>
            <p className="text-muted-foreground">
              O pagamento não foi concluído. Você pode tentar novamente quando quiser.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              Você continua com acesso ao plano gratuito com 1 medicamento e funcionalidades básicas.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/planos")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Voltar aos planos
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/hoje")}
              className="w-full"
            >
              Continuar no plano gratuito
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => navigate("/ajuda")}
              className="w-full text-muted-foreground"
            >
              <HelpCircle className="mr-2 w-4 h-4" />
              Preciso de ajuda
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Dúvidas? Entre em contato pelo chat ou email.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default SubscriptionCanceled;
