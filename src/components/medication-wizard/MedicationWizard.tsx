import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Calendar, Package, ChevronDown, Camera, Upload, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardStepIdentity } from "./WizardStepIdentity";
import { WizardStepSchedule } from "./WizardStepSchedule";
import { WizardStepStock } from "./WizardStepStock";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaywallDialog from "@/components/PaywallDialog";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import UpgradeModal from "@/components/UpgradeModal";
import { useLanguage } from "@/contexts/LanguageContext";
interface MedicationData {
  name: string;
  category: string;
  notes: string;
  supplementCategory?: string;
  frequency: "daily" | "specific_days" | "weekly";
  times: string[];
  daysOfWeek?: number[];
  continuousUse: boolean;
  startDate?: string;
  endDate?: string;
  unitsTotal: number;
  unitLabel: string;
  lowStockThreshold: number;
  notificationType: "silent" | "push" | "alarm";
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
  continuousUse: false,
  unitsTotal: 30,
  unitLabel: "comprimidos",
  lowStockThreshold: 5,
  notificationType: "push",
};

export default function MedicationWizard({ open, onOpenChange, editItemId }: MedicationWizardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeProfile } = useUserProfiles();
  const { subscription, loading: subLoading, hasFeature } = useSubscription();
  const { t } = useLanguage();
  
  const urlEditId = searchParams.get("edit");
  const itemIdToEdit = editItemId || urlEditId;
  const isEditing = !!itemIdToEdit;
  
  const prefillData = location.state?.prefillData;
  
  // Step 0 = seleção de método, 1 = identidade, 2 = horários
  const [currentStep, setCurrentStep] = useState(isEditing ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [medicationData, setMedicationData] = useState<MedicationData>(INITIAL_DATA);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemIdToEdit && open) {
      loadItemData(itemIdToEdit);
    }
  }, [itemIdToEdit, open]);

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
        notificationType: (item.notification_type as "silent" | "push" | "alarm") || "push",
      });
      
      // Mostrar estoque se já existir
      if (stock?.units_total) {
        setShowStock(true);
      }
    } catch (error) {
      console.error("Error loading item:", error);
      toast.error("Erro ao carregar medicamento");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset step when opening (only for new items)
  useEffect(() => {
    if (open && !isEditing) {
      setCurrentStep(0);
      setMedicationData(INITIAL_DATA);
      setOcrPreview(null);
    }
  }, [open, isEditing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setOcrPreview(base64);
        processOCR(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = async (imageData: string) => {
    setProcessingOCR(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-medication", {
        body: { image: imageData },
      });

      if (error) throw error;

      if (data?.name) {
        // Create the medication immediately and redirect to edit
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            profile_id: activeProfile?.id,
            name: data.name,
            category: data.category || "medicamento",
            is_active: true,
            notification_type: "push",
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Create default schedule
        await supabase.from('schedules').insert({
          item_id: newItem.id,
          times: ["08:00"],
          freq_type: "daily",
          is_active: true,
        });

        toast.success("Medicamento criado! Complete as informações.");
        onOpenChange(false);
        navigate(`/adicionar?edit=${newItem.id}`);
      } else {
        toast.error("Não foi possível identificar o medicamento");
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Erro ao processar imagem. Preencha manualmente.");
      setCurrentStep(1);
    } finally {
      setProcessingOCR(false);
      setOcrPreview(null);
    }
  };

  const handleMethodSelect = (method: "camera" | "upload" | "manual") => {
    if (method === "manual") {
      setCurrentStep(1);
      return;
    }

    if (!hasFeature("ocr")) {
      setShowUpgradeModal(true);
      return;
    }

    if (method === "camera") {
      cameraInputRef.current?.click();
    } else if (method === "upload") {
      fileInputRef.current?.click();
    }
  };

  const updateData = (partialData: Partial<MedicationData>) => {
    setMedicationData(prev => ({ ...prev, ...partialData }));
  };

  const checkMedicationLimit = async (): Promise<boolean> => {
    if (isEditing) return true;
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
    if (currentStep === 1) {
      if (!medicationData.name.trim()) {
        toast.error("Digite o nome do medicamento");
        return;
      }
      const canProceed = await checkMedicationLimit();
      if (!canProceed) return;
      setCurrentStep(2);
      return;
    }
    
    if (currentStep === 2) {
      if (medicationData.times.length === 0) {
        toast.error("Adicione pelo menos um horário");
        return;
      }
      // Salvar diretamente - estoque é opcional
      handleSubmit();
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

      if (isEditing && itemIdToEdit) {
        const { error: itemError } = await supabase
          .from('items')
          .update({
            name: medicationData.name,
            category: medicationData.category,
            notes: medicationData.notes || null,
            treatment_start_date: medicationData.startDate || new Date().toISOString().split('T')[0],
            treatment_end_date: medicationData.continuousUse ? null : medicationData.endDate,
            notification_type: medicationData.notificationType,
          })
          .eq("id", itemIdToEdit);

        if (itemError) throw itemError;

        await supabase.from("schedules").delete().eq("item_id", itemIdToEdit);

        const { error: scheduleError } = await supabase
          .from('schedules')
          .insert({
            item_id: itemIdToEdit,
            times: medicationData.times,
            freq_type: medicationData.frequency,
            is_active: true,
            ...(medicationData.frequency === 'specific_days' && {
              days_of_week: medicationData.daysOfWeek,
            }),
          });

        if (scheduleError) throw scheduleError;

        // Atualizar estoque apenas se configurado
        if (showStock) {
          await supabase.from("stock").delete().eq("item_id", itemIdToEdit);
          await supabase.from('stock').insert({
            item_id: itemIdToEdit,
            units_total: medicationData.unitsTotal,
            units_left: medicationData.unitsTotal,
            unit_label: medicationData.unitLabel,
            last_refill_at: new Date().toISOString(),
          });
        }

        toast.success(`${medicationData.name} atualizado!`);
      } else {
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
            notification_type: medicationData.notificationType,
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

        // Criar estoque apenas se configurado
        if (showStock) {
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
        }

        toast.success(`${medicationData.name} adicionado!`);
      }
      
      onOpenChange(false);
      navigate('/rotina');
      
      setCurrentStep(1);
      setMedicationData(INITIAL_DATA);
      setShowStock(false);
      
    } catch (error: any) {
      console.error('Error saving medication:', error);
      toast.error(error.message || "Erro ao salvar medicamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: t('wizard.step1'), icon: Sparkles },
    { number: 2, title: t('wizard.step2'), icon: Calendar },
  ];

  const methodOptions = [
    {
      id: "camera",
      icon: Camera,
      title: t('meds.scanPrescription'),
      description: t('wizard.scanDesc'),
      premium: true,
    },
    {
      id: "upload",
      icon: Upload,
      title: t('wizard.uploadImage'),
      description: t('wizard.uploadDesc'),
      premium: true,
    },
    {
      id: "manual",
      icon: Edit3,
      title: t('wizard.typeManually'),
      description: t('wizard.typeManuallyDesc'),
      premium: false,
    },
  ];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Hidden file inputs for OCR */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl gap-0">
          {/* Header fixo */}
          <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b bg-background shrink-0">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-semibold">
                {isEditing ? t('common.edit') : currentStep === 0 ? t('meds.addMedication') : t('wizard.addItem')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {currentStep === 0 
                  ? t('wizard.chooseMethod') 
                  : currentStep === 1 
                    ? `${t('wizard.step')} 1: ${t('wizard.step1')}` 
                    : `${t('wizard.step')} 2: ${t('wizard.step2')}`}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Progress Steps - compacto e fixo */}
          {currentStep > 0 && (
            <div className="flex items-center justify-center gap-6 py-4 px-4 bg-muted/30 shrink-0">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm font-medium",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : isCompleted 
                              ? "bg-green-500 text-white" 
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                      </div>
                      <span className={cn(
                        "text-sm font-medium hidden sm:block",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5",
                        currentStep > step.number ? "bg-green-500" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 0: Seleção de método */}
                {currentStep === 0 && (
                  <div className="space-y-3 py-2">
                    {processingOCR ? (
                      <Card className="p-8 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground text-center">
                          {t('wizard.analyzingImage')}
                        </p>
                      </Card>
                    ) : (
                      methodOptions.map((option) => (
                        <Card
                          key={option.id}
                          className="p-4 cursor-pointer hover:bg-accent/50 transition-all border-2 hover:border-primary/30"
                          onClick={() => handleMethodSelect(option.id as "camera" | "upload" | "manual")}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <option.icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{option.title}</h3>
                                {option.premium && !hasFeature("ocr") && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                                    Premium
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                
                {currentStep === 1 && (
                  <WizardStepIdentity data={medicationData} updateData={updateData} />
                )}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <WizardStepSchedule data={medicationData} updateData={updateData} />
                    
                    {/* Estoque opcional - colapsável */}
                    <Collapsible open={showStock} onOpenChange={setShowStock}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between"
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{t('wizard.controlStock')}</span>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform",
                            showStock && "rotate-180"
                          )} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <WizardStepStock 
                          data={medicationData} 
                          updateData={updateData}
                          dosesPerDay={medicationData.times.length}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons - fixo no footer */}
          {currentStep > 0 && (
            <div className="flex gap-3 p-4 sm:px-6 border-t bg-background shrink-0">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => setCurrentStep(0) : handleBack}
                disabled={isSubmitting}
                className="flex-1 h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </Button>

              <Button 
                onClick={handleNext} 
                disabled={isSubmitting} 
                className="flex-1 h-12"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === 2 ? (
                  <>
                    {isEditing ? t('common.save') : t('common.add')}
                    <Check className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    {t('common.next')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Cancel button only on step 0 */}
          {currentStep === 0 && !processingOCR && (
            <div className="p-4 sm:px-6 border-t bg-background shrink-0">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full h-11 text-muted-foreground"
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="OCR de receitas"
      />

      <PaywallDialog
        open={showPaywall}
        onOpenChange={setShowPaywall}
        triggerReason="medication_limit"
      />
    </>
  );
}
