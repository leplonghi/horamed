import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Flame, AlertTriangle, CheckCircle, Snowflake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useStreakProtection } from "@/hooks/useStreakProtection";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreakProtectionCardProps {
  currentStreak: number;
  className?: string;
}

export default function StreakProtectionCard({ 
  currentStreak, 
  className 
}: StreakProtectionCardProps) {
  const { t } = useLanguage();
  const [using, setUsing] = useState(false);
  const {
    freezesAvailable,
    streakAtRisk,
    recoveryMissionsCompleted,
    recoveryMissionsNeeded,
    canRecover,
    loading,
    actions,
  } = useStreakProtection();

  const handleUseFreeze = async () => {
    if (freezesAvailable <= 0) {
      toast.error("Você já usou seu freeze esta semana");
      return;
    }

    setUsing(true);
    const success = await actions.useFreeze();
    setUsing(false);

    if (success) {
      toast.success("🧊 Streak congelado! Sua sequência está salva.");
    } else {
      toast.error("Erro ao usar freeze");
    }
  };

  if (loading) return null;

  // Show protection options only when relevant
  if (!streakAtRisk && currentStreak < 3) return null;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-primary" />
          Proteção de Streak
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current streak display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-semibold">{currentStreak} dias</span>
          </div>
          
          {streakAtRisk ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Em risco
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3" />
              Protegido
            </Badge>
          )}
        </div>

        {/* Streak at risk - show freeze option */}
        {streakAtRisk && freezesAvailable > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-destructive/10 rounded-lg border border-destructive/20"
          >
            <p className="text-sm text-muted-foreground mb-3">
              ⚠️ Seu streak de {currentStreak} dias está em risco! 
              Use um freeze para proteger sua sequência.
            </p>
            
            <Button 
              onClick={handleUseFreeze}
              disabled={using}
              className="w-full gap-2"
              variant="outline"
            >
              <Snowflake className="h-4 w-4" />
              {using ? "Usando..." : "Usar Freeze (1 por semana)"}
            </Button>
          </motion.div>
        )}

        {/* Recovery missions */}
        {canRecover && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-primary/5 rounded-lg border border-primary/20"
          >
            <p className="text-sm font-medium mb-2">
              🎯 Missão de Recuperação
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Complete {recoveryMissionsNeeded} doses seguidas para recuperar seu streak!
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progresso</span>
                <span>{recoveryMissionsCompleted}/{recoveryMissionsNeeded}</span>
              </div>
              <Progress 
                value={(recoveryMissionsCompleted / recoveryMissionsNeeded) * 100} 
                className="h-2"
              />
            </div>
          </motion.div>
        )}

        {/* Freeze availability */}
        {!streakAtRisk && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Snowflake className="h-3.5 w-3.5" />
              Freezes disponíveis
            </span>
            <span className="font-medium">{freezesAvailable}/1 esta semana</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
