import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Calendar, Package, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardStepIdentity } from "./WizardStepIdentity";
import { WizardStepSchedule } from "./WizardStepSchedule";
import { WizardStepStock } from "./WizardStepStock";
import MedicationOCRWrapper from "@/components/MedicationOCRWrapper";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaywallDialog from "@/components/PaywallDialog";
import { cn } from "@/lib/utils";

interface MedicationData {
  name: string;
  category: string;
  notes: string;
  frequency: "daily" | "specific_days" | "weekly";
  times: string[];
  daysOfWeek?: number[];
  continuousUse: boolean;
  startDate?: string;
  endDate?: string;
  unitsTotal: number;
  unitLabel: string;
  lowStockThreshold: number;
}

interface MedicationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItemId?: string;
}

const INITIAL_DATA: MedicationData = {
  name: "",
  category: "medicamento",
  notes: "",
  frequency: "daily",
  times: ["08:00"],
  continuousUse: true,
  unitsTotal: 30,
  unitLabel: "comprimidos",
  lowStockThreshold: 5,
};

export default function MedicationWizard({ open, onOpenChange, editItemId }: MedicationWizardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeProfile } = useUserProfiles();
  const { subscription, loading: subLoading } = useSubscription();
  
  // Check for edit mode from URL params
  const urlEditId = searchParams.get("edit");
  const itemIdToEdit = editItemId || urlEditId;
  const isEditing = !!itemIdToEdit;
  
  const prefillData = location.state?.prefillData;
  
  const [currentStep, setCurrentStep] = useState(isEditing ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [showPaywall, setShowPaywall] = useState(false);
  const [medicationData, setMedicationData] = useState<MedicationData>(INITIAL_DATA);

  // Load existing item data when editing
  useEffect(() => {
    if (itemIdToEdit && open) {
      loadItemData(itemIdToEdit);
    }
  }, [itemIdToEdit, open]);

  // Update form data when prefill data changes
  useEffect(() => {
    if (prefillData) {
      setMedicationData(prev => ({
        ...prev,
        name: prefillData.name || prev.name,
        category: prefillData.category || prev.category,
        notes: prefillData.notes || prev.notes,
      }));
      setCurrentStep(1);
    }
  }, [prefillData]);

  const loadItemData = async (itemId: string) => {
    setIsLoading(true);
    try {
      const { data: item, error } = await supabase
        .from("items")
        .select(`*, schedules (*), stock (*)`)
        .eq("id", itemId)
        .single();

      if (error) throw error;

      const schedule = item.schedules?.[0];
      const stock = Array.isArray(item.stock) ? item.stock[0] : item.stock;

      const freqType = schedule?.freq_type as "daily" | "specific_days" | "weekly" | undefined;
      const scheduleTimes = Array.isArray(schedule?.times) 
        ? schedule.times.map((t: unknown) => String(t)) 
        : ["08:00"];

      setMedicationData({
        name: item.name || "",
        category: item.category || "medicamento",
        notes: item.notes || "",
        frequency: freqType || "daily",
        times: scheduleTimes,
        daysOfWeek: schedule?.days_of_week || [],
        continuousUse: !item.treatment_end_date,
        startDate: item.treatment_start_date || "",
        endDate: item.treatment_end_date || "",
        unitsTotal: stock?.units_left || stock?.units_total || 30,
        unitLabel: stock?.unit_label || "comprimidos",
        lowStockThreshold: 5,
      });
    } catch (error) {
      console.error("Error loading item:", error);
      toast.error("Erro ao carregar medicamento");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = (partialData: Partial<MedicationData>) => {
    setMedicationData(prev => ({ ...prev, ...partialData }));
  };

  const checkMedicationLimit = async (): Promise<boolean> => {
    if (isEditing) return true; // Skip limit check when editing
    if (subLoading) return false;
    
    const planType = subscription?.plan_type || 'free';
    const status = subscription?.status || 'active';
    
    if (planType === 'premium' && status === 'active') return true;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { count, error } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('profile_id', activeProfile?.id || '');

    if (error) {
      console.error('Error checking medication limit:', error);
      return false;
    }

    if ((count || 0) >= 1) {
      setShowPaywall(true);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }
    
    if (currentStep === 1) {
      if (!medicationData.name.trim()) {
        toast.error("Digite o nome do medicamento");
        return;
      }
      const canProceed = await checkMedicationLimit();
      if (!canProceed) return;
    }

    if (currentStep === 2) {
      if (medicationData.times.length === 0) {
        toast.error("Adicione pelo menos um horário");
        return;
      }
      if (!medicationData.continuousUse && !medicationData.endDate) {
        toast.error("Defina uma data de término");
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > (isEditing ? 1 : 0)) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleOCRResult = (result: any) => {
    const detectCategory = (medName: string): string => {
      const nameLower = medName.toLowerCase();
      if (nameLower.includes('vitamina') || nameLower.includes('vit.')) return 'vitamina';
      if (nameLower.includes('suplemento') || nameLower.includes('whey') || nameLower.includes('creatina')) return 'suplemento';
      return 'medicamento';
    };
    
    updateData({
      name: result.name || "",
      category: result.category || detectCategory(result.name || ""),
    });
    
    setCurrentStep(1);
    toast.success("Medicamento identificado!");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isEditing && itemIdToEdit) {
        // UPDATE existing item
        const { error: itemError } = await supabase
          .from('items')
          .update({
            name: medicationData.name,
            category: medicationData.category,
            notes: medicationData.notes || null,
            treatment_start_date: medicationData.startDate || new Date().toISOString().split('T')[0],
            treatment_end_date: medicationData.continuousUse ? null : medicationData.endDate,
          })
          .eq("id", itemIdToEdit);

        if (itemError) throw itemError;

        // Delete old schedules
        await supabase.from("schedules").delete().eq("item_id", itemIdToEdit);

        // Create new schedule
        const { data: newSchedule, error: scheduleError } = await supabase
          .from('schedules')
          .insert({
            item_id: itemIdToEdit,
            times: medicationData.times,
            freq_type: medicationData.frequency,
            is_active: true,
            ...(medicationData.frequency === 'specific_days' && {
              days_of_week: medicationData.daysOfWeek,
            }),
          })
          .select()
          .single();

        if (scheduleError) throw scheduleError;

        // Update stock
        await supabase.from("stock").delete().eq("item_id", itemIdToEdit);
        await supabase.from('stock').insert({
          item_id: itemIdToEdit,
          units_total: medicationData.unitsTotal,
          units_left: medicationData.unitsTotal,
          unit_label: medicationData.unitLabel,
          last_refill_at: new Date().toISOString(),
        });

        toast.success(`${medicationData.name} atualizado! ✓`);
      } else {
        // CREATE new item
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            profile_id: activeProfile?.id,
            name: medicationData.name,
            category: medicationData.category,
            notes: medicationData.notes || null,
            is_active: true,
            treatment_start_date: medicationData.startDate || new Date().toISOString().split('T')[0],
            treatment_end_date: medicationData.continuousUse ? null : medicationData.endDate,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        const { error: scheduleError } = await supabase
          .from('schedules')
          .insert({
            item_id: newItem.id,
            times: medicationData.times,
            freq_type: medicationData.frequency,
            is_active: true,
            ...(medicationData.frequency === 'specific_days' && {
              days_of_week: medicationData.daysOfWeek,
            }),
          });

        if (scheduleError) throw scheduleError;

        const { error: stockError } = await supabase
          .from('stock')
          .insert({
            item_id: newItem.id,
            units_total: medicationData.unitsTotal,
            units_left: medicationData.unitsTotal,
            unit_label: medicationData.unitLabel,
            last_refill_at: new Date().toISOString(),
          });

        if (stockError) throw stockError;

        toast.success(`${medicationData.name} adicionado! 🎉`);
      }
      
      onOpenChange(false);
      navigate('/rotina');
      
      // Reset state
      setCurrentStep(0);
      setMedicationData(INITIAL_DATA);
      
    } catch (error: any) {
      console.error('Error saving medication:', error);
      toast.error(error.message || "Erro ao salvar medicamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = isEditing 
    ? [
        { number: 1, title: "Medicamento", icon: Sparkles },
        { number: 2, title: "Horários", icon: Calendar },
        { number: 3, title: "Estoque", icon: Package },
      ]
    : [
        { number: 0, title: "Escanear", icon: Camera },
        { number: 1, title: "Medicamento", icon: Sparkles },
        { number: 2, title: "Horários", icon: Calendar },
        { number: 3, title: "Estoque", icon: Package },
      ];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando medicamento...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl flex items-center gap-2">
              {isEditing ? "Editar Medicamento" : "Adicionar Medicamento"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing 
                ? "Atualize as informações do seu medicamento"
                : "Siga os passos para configurar seu medicamento"
              }
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps - Compact */}
          <div className="flex items-center justify-center gap-2 py-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isActive 
                          ? "bg-primary text-primary-foreground scale-110 shadow-lg" 
                          : isCompleted 
                            ? "bg-green-500 text-white" 
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-1 transition-all",
                      currentStep > step.number ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="min-h-[300px]"
              >
                {currentStep === 0 && !isEditing && (
                  <div className="space-y-4 py-4">
                    <MedicationOCRWrapper onResult={handleOCRResult} />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Ou pule para digitar manualmente
                      </p>
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <WizardStepIdentity data={medicationData} updateData={updateData} />
                )}
                {currentStep === 2 && (
                  <WizardStepSchedule data={medicationData} updateData={updateData} />
                )}
                {currentStep === 3 && (
                  <WizardStepStock 
                    data={medicationData} 
                    updateData={updateData}
                    dosesPerDay={medicationData.times.length}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === (isEditing ? 1 : 0) || isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                {currentStep === 0 ? "Pular" : "Próximo"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isEditing ? "Salvar" : "Finalizar"}
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PaywallDialog
        open={showPaywall}
        onOpenChange={setShowPaywall}
        triggerReason="medication_limit"
      />
    </>
  );
}