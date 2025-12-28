import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import horamedLogo from '@/assets/horamed-logo-optimized.webp';

interface SplashScreenProps {
  onComplete: () => void;
  minimumDisplayTime?: number;
}

const SplashScreen = ({ onComplete, minimumDisplayTime = 800 }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400);
    }, minimumDisplayTime);

    return () => clearTimeout(timer);
  }, [onComplete, minimumDisplayTime]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 animate-pulse" />
          </div>

          {/* Logo with animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.1
            }}
            className="relative z-10"
          >
            <img 
              src={horamedLogo} 
              alt="HoraMed" 
              width={192}
              height={180}
              className="w-48 h-auto"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-6 text-muted-foreground text-sm font-medium"
          >
            Sua saúde no horário certo
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
