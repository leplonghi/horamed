import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  Bell, 
  FileText, 
  Users,
  Gift,
  Clock
} from "lucide-react";
import logo from "@/assets/horamed-logo.png";
import Confetti from "react-confetti";

// Custom hook for window size (for confetti)
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

export default function Welcome() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    // Stop confetti after 4 seconds
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const benefits = [
    { icon: Bell, text: "Lembretes inteligentes no horário certo" },
    { icon: FileText, text: "Carteira de saúde digital com OCR" },
    { icon: Users, text: "Gestão de toda a família" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex items-center justify-center p-6">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 space-y-8 text-center shadow-2xl border-primary/20">
          {/* Success Header */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto"
            >
              <Check className="w-10 h-10 text-primary-foreground" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-foreground">
                Bem-vindo ao HoraMed! 🎉
              </h1>
              <p className="text-muted-foreground mt-2">
                Sua conta foi criada com sucesso
              </p>
            </motion.div>
          </div>

          {/* Trial Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm">
              <Gift className="w-4 h-4 mr-2 inline" />
              7 dias de Premium grátis ativados!
            </Badge>
          </motion.div>

          {/* Benefits List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-foreground text-left">{benefit.text}</p>
              </div>
            ))}
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Seu período Premium expira em <strong className="text-foreground">7 dias</strong></span>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              onClick={() => navigate("/adicionar")}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Adicionar Primeiro Medicamento
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/hoje")}
              className="w-full"
            >
              Explorar o app primeiro
            </Button>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <img src={logo} alt="HoraMed" className="h-8 w-auto mx-auto opacity-50" />
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
