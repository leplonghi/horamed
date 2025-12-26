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
  const { subscription, loading: subLoading, hasFeature } = useSubscription();
  
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
        toast.success("Medicamento identificado!");
        setMedicationData(prev => ({
          ...prev,
          name: data.name,
          category: data.category || "medicamento",
        }));
        setCurrentStep(1);
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
    { number: 1, title: "O que é?", icon: Sparkles },
    { number: 2, title: "Quando tomar?", icon: Calendar },
  ];

  const methodOptions = [
    {
      id: "camera",
      icon: Camera,
      title: "Escanear Receita",
      description: "Tire foto da receita ou caixa",
      premium: true,
    },
    {
      id: "upload",
      icon: Upload,
      title: "Enviar Imagem",
      description: "Selecione da galeria",
      premium: true,
    },
    {
      id: "manual",
      icon: Edit3,
      title: "Digitar Manualmente",
      description: "Preencher os dados",
      premium: false,
    },
  ];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
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
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="pb-2 space-y-1">
            <DialogTitle className="text-lg sm:text-xl">
              {isEditing ? "Editar Item" : currentStep === 0 ? "Adicionar Medicamento" : "Adicionar Item"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {currentStep === 0 
                ? "Como você quer adicionar?" 
                : currentStep === 1 
                  ? "Informe o nome e tipo" 
                  : "Configure os horários"}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps - só mostra após step 0 */}
          {currentStep > 0 && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 py-3 sm:py-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all",
                          isActive 
                            ? "bg-primary text-primary-foreground scale-110 shadow-lg" 
                            : isCompleted 
                              ? "bg-green-500 text-white" 
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <span className={cn(
                        "text-[10px] sm:text-xs font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-8 sm:w-12 h-0.5 mx-1.5 sm:mx-2 transition-all",
                        currentStep > step.number ? "bg-green-500" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-1">
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
                          Analisando imagem...
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
                            <span>Controlar estoque</span>
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

          {/* Navigation Buttons - Mobile optimized */}
          {currentStep > 0 && (
            <div className="flex justify-between gap-3 pt-3 sm:pt-4 border-t mt-3 sm:mt-4">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => setCurrentStep(0) : handleBack}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none h-11 sm:h-10"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span>Voltar</span>
              </Button>

              <Button 
                onClick={handleNext} 
                disabled={isSubmitting} 
                className="flex-1 sm:flex-none sm:min-w-[120px] h-11 sm:h-10"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === 2 ? (
                  <>
                    {isEditing ? "Salvar" : "Adicionar"}
                    <Check className="w-4 h-4 ml-1 sm:ml-2" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Cancel button only on step 0 */}
          {currentStep === 0 && !processingOCR && (
            <div className="pt-3 sm:pt-4 border-t mt-3 sm:mt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-11 sm:h-10"
              >
                Cancelar
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
