import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardStepIdentity } from "./WizardStepIdentity";
import { WizardStepSchedule } from "./WizardStepSchedule";
import { WizardStepStock } from "./WizardStepStock";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaywallDialog from "@/components/PaywallDialog";

interface MedicationData {
  // Step 1: Identity
  name: string;
  category: string;
  notes: string;
  
  // Step 2: Schedule
  frequency: "daily" | "specific_days" | "weekly";
  times: string[]; // ["08:00", "14:00", "20:00"]
  daysOfWeek?: number[]; // [1, 3, 5] for Mon, Wed, Fri
  continuousUse: boolean;
  startDate?: string;
  endDate?: string;
  
  // Step 3: Stock
  unitsTotal: number;
  unitLabel: string;
  lowStockThreshold: number;
}

interface MedicationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MedicationWizard({ open, onOpenChange }: MedicationWizardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProfile } = useUserProfiles();
  const { subscription, loading: subLoading } = useSubscription();
  
  // Extract prefill data from navigation state (from OCR)
  const prefillData = location.state?.prefillData;
  const remainingMedications = location.state?.remainingMedications || [];
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const [medicationData, setMedicationData] = useState<MedicationData>({
    name: "",
    category: "medicamento",
    notes: "",
    frequency: "daily",
    times: ["08:00"],
    continuousUse: true,
    unitsTotal: 30,
    unitLabel: "comprimidos",
    lowStockThreshold: 5,
  });

  // Update form data when prefill data changes
  useEffect(() => {
    if (prefillData) {
      setMedicationData(prev => ({
        ...prev,
        name: prefillData.name || prev.name,
        category: prefillData.category || prev.category,
        notes: prefillData.notes || prev.notes,
      }));
    }
  }, [prefillData]);

  const updateData = (partialData: Partial<MedicationData>) => {
    setMedicationData(prev => ({ ...prev, ...partialData }));
  };

  // Check if user can create medication (FREE: 1 active med, PREMIUM: unlimited)
  const checkMedicationLimit = async (): Promise<boolean> => {
    if (subLoading) return false;
    
    const planType = subscription?.plan_type || 'free';
    const status = subscription?.status || 'active';
    
    // Premium users have no limit
    if (planType === 'premium' && status === 'active') {
      return true;
    }
    
    // Free users: check if they already have 1 active medication
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

    // Free users can have max 1 active medication
    if ((count || 0) >= 1) {
      setShowPaywall(true);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    // Step 1: Basic validation
    if (currentStep === 1) {
      if (!medicationData.name.trim()) {
        toast.error("Por favor, digite o nome do medicamento");
        return;
      }
      
      // Check limit before allowing to proceed
      const canProceed = await checkMedicationLimit();
      if (!canProceed) return;
    }

    // Step 2: Schedule validation
    if (currentStep === 2) {
      if (medicationData.times.length === 0) {
        toast.error("Por favor, adicione pelo menos um horário");
        return;
      }
      
      if (!medicationData.continuousUse && !medicationData.endDate) {
        toast.error("Por favor, defina uma data de término");
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Create medication item
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

      // 2. Create schedule(s)
      const scheduleData = {
        item_id: newItem.id,
        times: medicationData.times,
        freq_type: medicationData.frequency,
        is_active: true,
        ...(medicationData.frequency === 'specific_days' && {
          days_of_week: medicationData.daysOfWeek,
        }),
      };

      const { error: scheduleError } = await supabase
        .from('schedules')
        .insert(scheduleData);

      if (scheduleError) throw scheduleError;

      // 3. Create stock record
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

      // Success!
      toast.success(`${medicationData.name} adicionado com sucesso! 🎉`);
      
      // Close wizard and navigate to medication list
      onOpenChange(false);
      navigate('/rotina');
      
      // Reset wizard state
      setCurrentStep(1);
      setMedicationData({
        name: "",
        category: "medicamento",
        notes: "",
        frequency: "daily",
        times: ["08:00"],
        continuousUse: true,
        unitsTotal: 30,
        unitLabel: "comprimidos",
        lowStockThreshold: 5,
      });
      
    } catch (error: any) {
      console.error('Error creating medication:', error);
      toast.error(error.message || "Erro ao criar medicamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Identificação", subtitle: "Nome e categoria" },
    { number: 2, title: "Horários", subtitle: "Quando tomar" },
    { number: 3, title: "Estoque", subtitle: "Quantidade disponível" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Adicionar Medicamento</DialogTitle>
            <DialogDescription>
              Siga os passos para configurar seu medicamento completo
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8 px-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      currentStep === step.number
                        ? "bg-primary text-primary-foreground scale-110"
                        : currentStep > step.number
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.number ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-[300px]"
            >
              {currentStep === 1 && (
                <WizardStepIdentity data={medicationData} updateData={updateData} />
              )}
              {currentStep === 2 && (
                <WizardStepSchedule data={medicationData} updateData={updateData} />
              )}
              {currentStep === 3 && (
                <WizardStepStock data={medicationData} updateData={updateData} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Finalizar"}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Paywall for Free users who hit medication limit */}
      <PaywallDialog
        open={showPaywall}
        onOpenChange={setShowPaywall}
        triggerReason="medication_limit"
      />
    </>
  );
}
