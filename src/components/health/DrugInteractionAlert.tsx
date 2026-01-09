import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp, Pill, Info, ShieldAlert, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface DrugInteraction {
  id: string;
  drug_a: string;
  drug_b: string;
  interaction_type: string;
  description: string;
  recommendation: string | null;
}

interface DrugInteractionAlertProps {
  itemId?: string;
  itemName?: string;
  className?: string;
  compact?: boolean;
}

export default function DrugInteractionAlert({
  itemId,
  itemName,
  className,
  compact = false
}: DrugInteractionAlertProps) {
  const { t, language } = useLanguage();
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (itemName) {
      checkInteractions(itemName);
    } else {
      loadAllInteractions();
    }
  }, [itemName, itemId]);

  const loadAllInteractions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's active medications
      const { data: items } = await supabase
        .from("items")
        .select("name")
        .eq("is_active", true);

      if (!items || items.length < 2) {
        setInteractions([]);
        setLoading(false);
        return;
      }

      const medicationNames = items.map(i => i.name.toLowerCase());

      // Query drug_interactions table
      const { data: interactionsData } = await supabase
        .from("drug_interactions")
        .select("*");

      if (interactionsData) {
        const relevantInteractions = interactionsData.filter(interaction => {
          const drugA = interaction.drug_a.toLowerCase();
          const drugB = interaction.drug_b.toLowerCase();
          return medicationNames.some(name => name.includes(drugA) || drugA.includes(name)) &&
                 medicationNames.some(name => name.includes(drugB) || drugB.includes(name));
        });
        setInteractions(relevantInteractions);
      }
    } catch (error) {
      console.error("Error loading interactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkInteractions = async (medName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's other active medications
      const { data: items } = await supabase
        .from("items")
        .select("name")
        .eq("is_active", true)
        .neq("name", medName);

      if (!items || items.length === 0) {
        setInteractions([]);
        setLoading(false);
        return;
      }

      const otherMeds = items.map(i => i.name.toLowerCase());
      const currentMed = medName.toLowerCase();

      // Query drug_interactions table
      const { data: interactionsData } = await supabase
        .from("drug_interactions")
        .select("*");

      if (interactionsData) {
        const relevantInteractions = interactionsData.filter(interaction => {
          const drugA = interaction.drug_a.toLowerCase();
          const drugB = interaction.drug_b.toLowerCase();
          const currentMatches = currentMed.includes(drugA) || drugA.includes(currentMed) ||
                                 currentMed.includes(drugB) || drugB.includes(currentMed);
          const otherMatches = otherMeds.some(name => 
            name.includes(drugA) || drugA.includes(name) ||
            name.includes(drugB) || drugB.includes(name)
          );
          return currentMatches && otherMatches;
        });
        setInteractions(relevantInteractions);
      }
    } catch (error) {
      console.error("Error checking interactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (type: string) => {
    switch (type) {
      case "grave":
      case "severe":
        return {
          color: "bg-destructive/15 text-destructive border-destructive/30",
          icon: ShieldAlert,
          label: language === 'pt' ? 'Grave' : 'Severe'
        };
      case "moderada":
      case "moderate":
        return {
          color: "bg-warning/15 text-warning border-warning/30",
          icon: AlertTriangle,
          label: language === 'pt' ? 'Moderada' : 'Moderate'
        };
      default:
        return {
          color: "bg-blue-500/15 text-blue-600 border-blue-500/30",
          icon: Info,
          label: language === 'pt' ? 'Leve' : 'Mild'
        };
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  const visibleInteractions = interactions.filter(i => !dismissed.includes(i.id));

  if (loading || visibleInteractions.length === 0) {
    return null;
  }

  if (compact) {
    const mostSevere = visibleInteractions.reduce((prev, curr) => {
      const severityOrder = ['grave', 'severe', 'moderada', 'moderate', 'leve', 'mild'];
      const prevIdx = severityOrder.indexOf(prev.interaction_type.toLowerCase());
      const currIdx = severityOrder.indexOf(curr.interaction_type.toLowerCase());
      return currIdx < prevIdx ? curr : prev;
    }, visibleInteractions[0]);

    const config = getSeverityConfig(mostSevere.interaction_type);
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("inline-flex", className)}
      >
        <Badge className={cn("gap-1.5 cursor-pointer", config.color)} onClick={() => setExpanded(!expanded)}>
          <Icon className="h-3 w-3" />
          {visibleInteractions.length} {language === 'pt' ? 'interação' : 'interaction'}{visibleInteractions.length > 1 ? (language === 'pt' ? 'ões' : 's') : ''}
        </Badge>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={className}
      >
        <Card className={cn(
          "overflow-hidden",
          "bg-gradient-to-br from-warning/10 to-orange-500/5",
          "border-warning/30 shadow-[var(--shadow-glass)]"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-warning/20">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {language === 'pt' ? 'Interações Medicamentosas' : 'Drug Interactions'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {visibleInteractions.length} {language === 'pt' ? 'detectada' : 'detected'}{visibleInteractions.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="gap-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    {language === 'pt' ? 'Ocultar' : 'Hide'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {language === 'pt' ? 'Ver' : 'View'}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0 space-y-3">
                  {visibleInteractions.map((interaction) => {
                    const config = getSeverityConfig(interaction.interaction_type);
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={interaction.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={cn(
                          "p-3 rounded-xl border",
                          config.color.replace('/15', '/10').replace('/30', '/20')
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm flex items-center gap-1">
                                  <Pill className="h-3 w-3" />
                                  {interaction.drug_a}
                                </span>
                                <span className="text-muted-foreground text-xs">+</span>
                                <span className="font-medium text-sm flex items-center gap-1">
                                  <Pill className="h-3 w-3" />
                                  {interaction.drug_b}
                                </span>
                                <Badge variant="outline" className={cn("text-xs", config.color)}>
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {interaction.description}
                              </p>
                              {interaction.recommendation && (
                                <p className="text-xs font-medium text-primary">
                                  💡 {interaction.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleDismiss(interaction.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    ⚠️ {language === 'pt' 
                      ? 'Consulte seu médico antes de fazer alterações'
                      : 'Consult your doctor before making changes'}
                  </p>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
