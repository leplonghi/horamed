import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bell, Loader2 } from "lucide-react";
import { differenceInSeconds } from "date-fns";

interface Props {
  scheduledTime: Date;
  itemName: string;
  onCreateItem: () => Promise<boolean>;
  onNotificationReceived: () => void;
}

export default function OnboardingWaiting({ 
  scheduledTime, 
  itemName, 
  onCreateItem,
  onNotificationReceived 
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [creating, setCreating] = useState(true);
  const [created, setCreated] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const createItem = async () => {
      const success = await onCreateItem();
      setCreating(false);
      setCreated(success);
      
      if (success) {
        // Start countdown
        const updateCountdown = () => {
          const diff = differenceInSeconds(scheduledTime, new Date());
          setSecondsLeft(Math.max(0, diff));
          
          if (diff <= 0) {
            // Time's up! Wait a moment then proceed
            setTimeout(() => {
              onNotificationReceived();
            }, 2000);
          }
        };

        updateCountdown();
        intervalRef.current = setInterval(updateCountdown, 1000);
      }
    };

    createItem();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scheduledTime, onCreateItem, onNotificationReceived]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (creating) {
    return (
      <div className="text-center space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
        <p className="text-lg text-muted-foreground">
          Configurando seu primeiro lembrete...
        </p>
      </div>
    );
  }

  if (!created) {
    return (
      <div className="text-center space-y-6">
        <p className="text-lg text-destructive">
          Houve um problema ao criar o lembrete. Por favor, tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Aguarde o lembrete
        </h1>
        <p className="text-muted-foreground">
          Em até {secondsLeft > 60 ? "alguns minutos" : "instantes"} você vai receber seu primeiro lembrete.
        </p>
      </motion.div>

      {/* Countdown */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="py-8"
      >
        <div className="relative w-40 h-40 mx-auto">
          {/* Animated ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-primary"
              strokeDasharray={440}
              strokeDashoffset={440 * (1 - (120 - secondsLeft) / 120)}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Bell className="w-8 h-8 text-primary mb-2" />
            <span className="text-3xl font-bold text-foreground">
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Item info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-muted/50 rounded-xl p-4"
      >
        <p className="text-sm text-muted-foreground">Seu lembrete:</p>
        <p className="text-lg font-semibold text-foreground mt-1">
          💊 {itemName}
        </p>
      </motion.div>

      {/* Pulsing indicator */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-sm text-muted-foreground"
      >
        Aguardando notificação...
      </motion.div>
    </div>
  );
}
