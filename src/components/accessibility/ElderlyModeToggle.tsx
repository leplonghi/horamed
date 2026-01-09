import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Accessibility, Eye, Volume2, ZoomIn, Hand } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const ELDERLY_MODE_KEY = "horamed_elderly_mode";

export function useElderlyMode() {
  const [isElderlyMode, setIsElderlyMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ELDERLY_MODE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(ELDERLY_MODE_KEY, String(isElderlyMode));
    
    // Apply global CSS class
    if (isElderlyMode) {
      document.documentElement.classList.add('elderly-mode');
    } else {
      document.documentElement.classList.remove('elderly-mode');
    }
  }, [isElderlyMode]);

  return { isElderlyMode, setIsElderlyMode };
}

interface ElderlyModeToggleProps {
  className?: string;
  compact?: boolean;
}

export default function ElderlyModeToggle({ className, compact = false }: ElderlyModeToggleProps) {
  const { isElderlyMode, setIsElderlyMode } = useElderlyMode();
  const { language } = useLanguage();

  const features = [
    {
      icon: ZoomIn,
      label: language === 'pt' ? 'Textos maiores' : 'Larger text',
      desc: language === 'pt' ? '+30% no tamanho das fontes' : '+30% font size'
    },
    {
      icon: Hand,
      label: language === 'pt' ? 'Botões maiores' : 'Larger buttons',
      desc: language === 'pt' ? '+50% na área de toque' : '+50% touch area'
    },
    {
      icon: Eye,
      label: language === 'pt' ? 'Alto contraste' : 'High contrast',
      desc: language === 'pt' ? 'Cores mais definidas' : 'Sharper colors'
    },
    {
      icon: Volume2,
      label: language === 'pt' ? 'Sons claros' : 'Clear sounds',
      desc: language === 'pt' ? 'Alertas sonoros mais audíveis' : 'More audible alerts'
    }
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between p-4 rounded-xl bg-muted/30", className)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl",
            isElderlyMode ? "bg-primary/20" : "bg-muted"
          )}>
            <Accessibility className={cn(
              "h-5 w-5",
              isElderlyMode ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="font-medium">
              {language === 'pt' ? 'Modo Acessível' : 'Accessibility Mode'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'pt' ? 'Textos e botões maiores' : 'Larger text and buttons'}
            </p>
          </div>
        </div>
        <Switch
          checked={isElderlyMode}
          onCheckedChange={setIsElderlyMode}
        />
      </div>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden",
      "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
      "border border-border/30 shadow-[var(--shadow-glass)]",
      className
    )}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: isElderlyMode ? 1.1 : 1 }}
              className={cn(
                "p-3 rounded-xl transition-colors",
                isElderlyMode 
                  ? "bg-primary/20" 
                  : "bg-muted"
              )}
            >
              <Accessibility className={cn(
                "h-6 w-6 transition-colors",
                isElderlyMode ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.div>
            <div>
              <h3 className="font-semibold text-lg">
                {language === 'pt' ? 'Modo Acessível' : 'Accessibility Mode'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' 
                  ? 'Ideal para idosos e baixa visão' 
                  : 'Ideal for elderly and low vision'}
              </p>
            </div>
          </div>
          <Switch
            checked={isElderlyMode}
            onCheckedChange={setIsElderlyMode}
            className="scale-125"
          />
        </div>

        {/* Features */}
        <motion.div
          initial={false}
          animate={{ opacity: isElderlyMode ? 1 : 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-3 rounded-xl border transition-all",
                isElderlyMode
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/30 border-border/20"
              )}
            >
              <feature.icon className={cn(
                "h-5 w-5 mb-2",
                isElderlyMode ? "text-primary" : "text-muted-foreground"
              )} />
              <p className={cn(
                "font-medium text-sm",
                isElderlyMode ? "text-foreground" : "text-muted-foreground"
              )}>
                {feature.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {isElderlyMode && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-center text-primary font-medium pt-2"
          >
            ✓ {language === 'pt' ? 'Modo acessível ativado' : 'Accessibility mode enabled'}
          </motion.p>
        )}
      </div>
    </Card>
  );
}
