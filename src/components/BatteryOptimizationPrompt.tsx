/**
 * Battery Optimization Prompt for Android
 * 
 * Shows a warning when the app may be affected by battery optimization
 * and guides the user to exempt the app.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Battery, AlertTriangle, Settings, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Capacitor } from "@capacitor/core";
import { useLanguage } from "@/contexts/LanguageContext";

interface BatteryOptimizationPromptProps {
  onDismiss?: () => void;
  forcedShow?: boolean;
}

export default function BatteryOptimizationPrompt({ 
  onDismiss, 
  forcedShow = false 
}: BatteryOptimizationPromptProps) {
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const isAndroid = Capacitor.getPlatform() === "android";
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isAndroid || !isNative) return;
    
    // Check if already dismissed
    const alreadyDismissed = localStorage.getItem("battery_optimization_dismissed");
    if (alreadyDismissed && !forcedShow) {
      setDismissed(true);
      return;
    }

    // Show after a short delay to not overwhelm user
    const timer = setTimeout(() => {
      setShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAndroid, isNative, forcedShow]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("battery_optimization_dismissed", "true");
    onDismiss?.();
  };

  const handleRemindLater = () => {
    setShow(false);
  };

  const handleOpenSettings = () => {
    // Unfortunately, we can't directly open battery settings from web
    // User needs to do this manually
    // In a real native app, we'd use a Capacitor plugin for this
    
    // Show instructions instead
    setShow(false);
    
    // Could dispatch an event to show a modal with detailed instructions
    window.dispatchEvent(new CustomEvent("show-battery-instructions"));
  };

  if (!isAndroid || !isNative || !show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="p-4 shadow-lg border-amber-500/30 bg-card">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-500/10 shrink-0">
              <Battery className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {language === "pt" 
                    ? "Economia de Bateria" 
                    : "Battery Optimization"}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 -mt-1 -mr-2"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {language === "pt" 
                  ? "Alguns celulares Android limitam alarmes em segundo plano. Para garantir seus lembretes, remova a restrição de bateria do HoraMed."
                  : "Some Android phones limit background alarms. To ensure your reminders work, remove battery restrictions for HoraMed."}
              </p>

              <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                <p className="font-medium mb-1">
                  {language === "pt" ? "Como fazer:" : "How to do it:"}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>
                    {language === "pt" 
                      ? "Configurações > Apps > HoraMed"
                      : "Settings > Apps > HoraMed"}
                  </li>
                  <li>
                    {language === "pt" 
                      ? "Bateria > Sem restrição"
                      : "Battery > Unrestricted"}
                  </li>
                </ol>
              </div>

              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleOpenSettings}
                  className="flex-1"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {language === "pt" ? "Ver instruções" : "See instructions"}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRemindLater}
                >
                  {language === "pt" ? "Depois" : "Later"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Detailed instructions modal content
export function BatteryInstructionsContent() {
  const { language } = useLanguage();
  
  const manufacturers = [
    {
      name: "Samsung",
      steps: language === "pt" 
        ? [
            "Configurações > Apps",
            "Toque em HoraMed",
            "Bateria > Sem restrição",
            "Também: Configurações > Cuidados com dispositivo > Bateria > Limites de uso em segundo plano > Nunca suspender > Adicione HoraMed"
          ]
        : [
            "Settings > Apps",
            "Tap HoraMed", 
            "Battery > Unrestricted",
            "Also: Settings > Device care > Battery > Background usage limits > Never sleeping > Add HoraMed"
          ],
    },
    {
      name: "Xiaomi/Redmi",
      steps: language === "pt"
        ? [
            "Configurações > Apps > Gerenciar apps",
            "Encontre HoraMed",
            "Economia de bateria > Sem restrições",
            "Autostart > Ativar",
          ]
        : [
            "Settings > Apps > Manage apps",
            "Find HoraMed",
            "Battery saver > No restrictions",
            "Autostart > Enable",
          ],
    },
    {
      name: "Huawei",
      steps: language === "pt"
        ? [
            "Configurações > Apps > Apps",
            "Encontre HoraMed",
            "Uso da bateria > Desativar gerenciamento automático",
            "Configurações > Bateria > Iniciar apps > HoraMed > Gerenciar manualmente > Ativar tudo",
          ]
        : [
            "Settings > Apps > Apps",
            "Find HoraMed",
            "Battery usage > Disable automatic management",
            "Settings > Battery > App launch > HoraMed > Manage manually > Enable all",
          ],
    },
    {
      name: "Motorola/Stock Android",
      steps: language === "pt"
        ? [
            "Configurações > Apps",
            "Encontre HoraMed",
            "Bateria > Sem restrição",
          ]
        : [
            "Settings > Apps",
            "Find HoraMed",
            "Battery > Unrestricted",
          ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-600">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-semibold">
          {language === "pt" 
            ? "Importante para seus lembretes funcionarem!"
            : "Important for your reminders to work!"}
        </h3>
      </div>

      <p className="text-sm text-muted-foreground">
        {language === "pt"
          ? "Celulares Android podem desativar alarmes para economizar bateria. Siga as instruções para sua marca:"
          : "Android phones may disable alarms to save battery. Follow the instructions for your brand:"}
      </p>

      <div className="space-y-4">
        {manufacturers.map((mfr) => (
          <div key={mfr.name} className="border rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">{mfr.name}</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
              {mfr.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <ExternalLink className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs">
          {language === "pt"
            ? "Dica: Pesquise no Google 'desativar economia de bateria [sua marca]' para instruções específicas."
            : "Tip: Search Google for 'disable battery optimization [your brand]' for specific instructions."}
        </p>
      </div>
    </div>
  );
}
