import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ConfettiExplosion from "@/components/celebrations/ConfettiExplosion";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex items-center justify-center p-4">
      <ConfettiExplosion trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Bem-vindo ao Premium! 🎉
            </h1>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso. Aproveite todos os recursos ilimitados!
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 justify-center text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Recursos desbloqueados:</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✅ Medicamentos ilimitados</li>
              <li>✅ Documentos ilimitados</li>
              <li>✅ IA sem limites</li>
              <li>✅ Relatórios mensais</li>
              <li>✅ WhatsApp + Push + Alarme</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/hoje")}
              className="w-full"
            >
              Começar a usar
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/assinatura")}
              className="w-full"
            >
              Gerenciar assinatura
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Sua assinatura inclui 7 dias de teste grátis. Você pode cancelar a qualquer momento.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
