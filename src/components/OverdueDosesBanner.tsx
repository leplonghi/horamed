import { AlertTriangle, Clock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverdueDoses } from "@/hooks/useOverdueDoses";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function OverdueDosesBanner() {
  const { overdueDoses, markAsTaken, hasOverdue } = useOverdueDoses();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  if (!hasOverdue) return null;

  const urgencyLevel = overdueDoses.some(d => d.minutesOverdue > 60) 
    ? "critical" 
    : overdueDoses.some(d => d.minutesOverdue > 30) 
      ? "urgent" 
      : "warning";

  const getMessage = () => {
    const count = overdueDoses.length;
    const mostOverdue = overdueDoses[0];
    
    if (count === 1) {
      if (mostOverdue.minutesOverdue > 60) {
        return `⚠️ ${mostOverdue.profileName} não tomou ${mostOverdue.itemName} há mais de 1 hora!`;
      }
      return `${mostOverdue.profileName} precisa tomar ${mostOverdue.itemName}`;
    }
    return `${count} doses atrasadas precisam de atenção`;
  };

  const handleMarkAsTaken = async (doseId: string, itemName: string) => {
    setLoadingIds(prev => new Set(prev).add(doseId));
    try {
      await markAsTaken(doseId);
      toast.success(`${itemName} confirmado!`, {
        description: "Dose registrada com sucesso"
      });
    } catch (error) {
      toast.error("Erro ao confirmar dose");
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(doseId);
        return next;
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          boxShadow: urgencyLevel === "critical" 
            ? ["0 0 0 0 rgba(239, 68, 68, 0.4)", "0 0 0 8px rgba(239, 68, 68, 0)", "0 0 0 0 rgba(239, 68, 68, 0.4)"]
            : undefined
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "w-full p-4 shadow-lg mb-3 rounded-xl border-2",
          urgencyLevel === "critical" && "bg-red-600 text-white border-red-400",
          urgencyLevel === "urgent" && "bg-orange-500 text-white border-orange-400",
          urgencyLevel === "warning" && "bg-amber-500 text-white border-amber-400"
        )}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm truncate">
                {getMessage()}
              </span>
            </div>
            
            {overdueDoses.length === 1 && (
              <Button
                size="sm"
                variant="secondary"
                className="flex-shrink-0 gap-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
                disabled={loadingIds.has(overdueDoses[0].id)}
                onClick={() => handleMarkAsTaken(overdueDoses[0].id, overdueDoses[0].itemName)}
              >
                {loadingIds.has(overdueDoses[0].id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirmar
              </Button>
            )}
          </div>

          {overdueDoses.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {overdueDoses.slice(0, 3).map((dose) => (
                <Button
                  key={dose.id}
                  size="sm"
                  variant="secondary"
                  className="text-xs gap-1"
                  disabled={loadingIds.has(dose.id)}
                  onClick={() => handleMarkAsTaken(dose.id, dose.itemName)}
                >
                  {loadingIds.has(dose.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {dose.itemName}
                  <span className="opacity-70">({dose.minutesOverdue}min)</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
