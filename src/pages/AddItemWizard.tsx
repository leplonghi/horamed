import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pill, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

import ProgressiveWizard from "@/components/medication-wizard/ProgressiveWizard";
import StepName from "@/components/medication-wizard/StepName";
import StepCategory from "@/components/medication-wizard/StepCategory";
import StepContinuous from "@/components/medication-wizard/StepContinuous";
import StepFrequency from "@/components/medication-wizard/StepFrequency";
import StepTimes from "@/components/medication-wizard/StepTimes";
import StepStock from "@/components/medication-wizard/StepStock";
import StepDetails from "@/components/medication-wizard/StepDetails";
import Navigation from "@/components/Navigation";
import logo from "@/assets/horamed-logo-web.webp";

type Category = "medicamento" | "vitamina" | "suplemento" | "outro";
type FrequencyType = "daily" | "specific_days" | "weekly" | "every_x_days" | "as_needed";

interface FormData {
  name: string;
  category: Category;
  isContinuous: boolean;
  treatmentDays: number | null;
  startDate: string;
  frequency: FrequencyType;
  daysOfWeek: number[];
  times: string[];
  doseText: string;
  withFood: boolean;
  notes: string;
  stock: {
    enabled: boolean;
    unitsTotal: number;
    unitLabel: string;
  };
}

const INITIAL_DATA: FormData = {
  name: "",
  category: "medicamento",
  isContinuous: false,
  treatmentDays: null,
  startDate: new Date().toISOString().split('T')[0],
  frequency: "daily",
  daysOfWeek: [],
  times: ["08:00"],
  doseText: "",
  withFood: false,
  notes: "",
  stock: {
    enabled: false,
    unitsTotal: 0,
    unitLabel: "comprimidos"
  }
};

export default function AddItemWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeProfile } = useUserProfiles();
  const { t, language } = useLanguage();
  
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [activeStep, setActiveStep] = useState<string>("name");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Pre-fill from URL params (OCR)
  useEffect(() => {
    const name = searchParams.get("name");
    const category = searchParams.get("category") as Category;
    
    if (name) {
      setFormData(prev => ({
        ...prev,
        name,
        category: category || prev.category
      }));
      // Auto-complete first step if name provided
      setCompletedSteps(new Set(["name"]));
      setActiveStep("category");
    }
  }, [searchParams]);

  const completeStep = (stepId: string, nextStep: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    setActiveStep(nextStep);
  };

  const goToStep = (stepId: string) => {
    // Can only go to completed steps or the next available
    const stepOrder = ["name", "category", "continuous", "frequency", "times", "details", "stock"];
    const stepIndex = stepOrder.indexOf(stepId);
    const lastCompletedIndex = Math.max(...stepOrder.map((s, i) => completedSteps.has(s) ? i : -1));
    
    if (stepIndex <= lastCompletedIndex + 1) {
      setActiveStep(stepId);
    }
  };

  const getDetailsSummary = () => {
    const parts = [];
    if (formData.doseText) parts.push(formData.doseText);
    if (formData.withFood) parts.push("🍽️ Com comida");
    if (parts.length === 0) return "📝 Sem detalhes adicionais";
    return `📝 ${parts.join(" • ")}`;
  };

  const getCategorySummary = () => {
    const labels: Record<Category, string> = {
      medicamento: "💊 Medicamento",
      vitamina: "🧪 Vitamina",
      suplemento: "🌿 Suplemento",
      outro: "📦 Outro"
    };
    return labels[formData.category];
  };

  const getFrequencySummary = () => {
    if (formData.frequency === "daily") return "📅 Todos os dias";
    if (formData.frequency === "weekly") return "🗓️ Semanalmente";
    const days = formData.daysOfWeek.length;
    return `📆 ${days} dias por semana`;
  };

  const getTimesSummary = () => {
    const count = formData.times.length;
    return `⏰ ${count}x ao dia (${formData.times.join(", ")})`;
  };

  const getStockSummary = () => {
    if (!formData.stock.enabled) return "📦 Sem controle";
    return `📦 ${formData.stock.unitsTotal} ${formData.stock.unitLabel}`;
  };

  const dosesPerDay = formData.times.length;

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome do medicamento é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Calculate end date for temporary treatments
      const treatmentEndDate = !formData.isContinuous && formData.startDate && formData.treatmentDays
        ? new Date(new Date(formData.startDate).getTime() + formData.treatmentDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      // Create item
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id || null,
          name: formData.name,
          category: formData.category,
          dose_text: formData.doseText || null,
          with_food: formData.withFood,
          notes: formData.notes || null,
          treatment_duration_days: formData.isContinuous ? null : formData.treatmentDays,
          treatment_start_date: formData.isContinuous ? null : formData.startDate,
          treatment_end_date: treatmentEndDate,
        })
        .select()
        .single();

      if (itemError) {
        if (itemError.message?.includes('Limite de medicamentos')) {
          toast.error("Limite de medicamentos atingido no plano gratuito", {
            action: {
              label: "Ver planos",
              onClick: () => navigate('/planos'),
            },
          });
          return;
        }
        throw itemError;
      }

      // Create schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedules")
        .insert({
          item_id: item.id,
          freq_type: formData.frequency,
          days_of_week: formData.frequency !== "daily" ? formData.daysOfWeek : null,
          times: formData.times,
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Generate dose instances for next 7 days
      const doseInstances = [];
      const now = new Date();

      for (let day = 0; day < 7; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        
        // Check if this day matches the schedule
        const dayOfWeek = date.getDay();
        if (formData.frequency === "specific_days" && !formData.daysOfWeek.includes(dayOfWeek)) continue;
        if (formData.frequency === "weekly" && !formData.daysOfWeek.includes(dayOfWeek)) continue;

        for (const time of formData.times) {
          const [hours, minutes] = time.split(":").map(Number);
          const dueAt = new Date(date);
          dueAt.setHours(hours, minutes, 0, 0);

          if (dueAt > now) {
            doseInstances.push({
              schedule_id: schedule.id,
              item_id: item.id,
              due_at: dueAt.toISOString(),
              status: "scheduled",
            });
          }
        }
      }

      if (doseInstances.length > 0) {
        await supabase.from("dose_instances").insert(doseInstances);
      }

      // Create stock if enabled
      if (formData.stock.enabled && formData.stock.unitsTotal > 0) {
        await supabase.from("stock").insert({
          item_id: item.id,
          units_total: formData.stock.unitsTotal,
          units_left: formData.stock.unitsTotal,
          unit_label: formData.stock.unitLabel,
        });
      }

      toast.success(`${formData.name} adicionado com sucesso!`);
      navigate("/medicamentos");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar medicamento");
    } finally {
      setLoading(false);
    }
  };

  const steps = useMemo(() => [
    {
      id: "name",
      number: 1,
      title: "Nome do Medicamento",
      description: "Qual medicamento você vai tomar?",
      icon: "💊",
      isComplete: completedSteps.has("name"),
      isActive: activeStep === "name",
      isLocked: false,
      summary: formData.name || undefined,
      content: (
        <StepName
          name={formData.name}
          onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
          onComplete={() => completeStep("name", "category")}
        />
      )
    },
    {
      id: "category",
      number: 2,
      title: "Tipo",
      description: "É um medicamento, vitamina ou suplemento?",
      icon: "📋",
      isComplete: completedSteps.has("category"),
      isActive: activeStep === "category",
      isLocked: !completedSteps.has("name"),
      summary: completedSteps.has("category") ? getCategorySummary() : undefined,
      content: (
        <StepCategory
          category={formData.category}
          onCategoryChange={(category) => setFormData(prev => ({ ...prev, category }))}
          onComplete={() => completeStep("category", "continuous")}
        />
      )
    },
    {
      id: "continuous",
      number: 3,
      title: "Duração",
      description: "É uso contínuo ou temporário?",
      icon: "📅",
      isComplete: completedSteps.has("continuous"),
      isActive: activeStep === "continuous",
      isLocked: !completedSteps.has("category"),
      summary: completedSteps.has("continuous") 
        ? (formData.isContinuous ? "♾️ Uso contínuo" : `📅 ${formData.treatmentDays} dias`) 
        : undefined,
      content: (
        <StepContinuous
          isContinuous={formData.isContinuous}
          treatmentDays={formData.treatmentDays}
          startDate={formData.startDate}
          onContinuousChange={(value) => setFormData(prev => ({ ...prev, isContinuous: value }))}
          onTreatmentDaysChange={(days) => setFormData(prev => ({ ...prev, treatmentDays: days }))}
          onStartDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
          onComplete={() => completeStep("continuous", "frequency")}
        />
      )
    },
    {
      id: "frequency",
      number: 4,
      title: "Frequência",
      description: "Com que frequência você toma?",
      icon: "🔄",
      isComplete: completedSteps.has("frequency"),
      isActive: activeStep === "frequency",
      isLocked: !completedSteps.has("continuous"),
      summary: completedSteps.has("frequency") ? getFrequencySummary() : undefined,
      content: (
        <StepFrequency
          frequency={formData.frequency}
          daysOfWeek={formData.daysOfWeek}
          onFrequencyChange={(freq) => setFormData(prev => ({ ...prev, frequency: freq }))}
          onDaysChange={(days) => setFormData(prev => ({ ...prev, daysOfWeek: days }))}
          onComplete={() => completeStep("frequency", "times")}
        />
      )
    },
    {
      id: "times",
      number: 5,
      title: "Horários",
      description: "Quais horários você toma?",
      icon: "⏰",
      isComplete: completedSteps.has("times"),
      isActive: activeStep === "times",
      isLocked: !completedSteps.has("frequency"),
      summary: completedSteps.has("times") ? getTimesSummary() : undefined,
      content: (
        <StepTimes
          times={formData.times}
          onTimesChange={(times) => setFormData(prev => ({ ...prev, times }))}
          onComplete={() => completeStep("times", "details")}
        />
      )
    },
    {
      id: "details",
      number: 6,
      title: "Detalhes",
      description: "Dosagem e observações",
      icon: "📝",
      isComplete: completedSteps.has("details"),
      isActive: activeStep === "details",
      isLocked: !completedSteps.has("times"),
      summary: completedSteps.has("details") ? getDetailsSummary() : undefined,
      content: (
        <StepDetails
          doseText={formData.doseText}
          withFood={formData.withFood}
          notes={formData.notes}
          onDoseTextChange={(value) => setFormData(prev => ({ ...prev, doseText: value }))}
          onWithFoodChange={(value) => setFormData(prev => ({ ...prev, withFood: value }))}
          onNotesChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
          onComplete={() => completeStep("details", "stock")}
        />
      )
    },
    {
      id: "stock",
      number: 7,
      title: "Estoque",
      description: "Controlar quantidade disponível?",
      icon: "📦",
      isComplete: completedSteps.has("stock"),
      isActive: activeStep === "stock",
      isLocked: !completedSteps.has("details"),
      summary: completedSteps.has("stock") ? getStockSummary() : undefined,
      content: (
        <StepStock
          stock={formData.stock}
          dosesPerDay={dosesPerDay}
          onStockChange={(stock) => setFormData(prev => ({ ...prev, stock }))}
          onComplete={() => {
            setCompletedSteps(prev => new Set([...prev, "stock"]));
            setActiveStep("done");
          }}
        />
      )
    },
  ], [formData, activeStep, completedSteps, dosesPerDay]);

  const allStepsComplete = completedSteps.has("stock");

  return (
    <>
      <div className="min-h-screen bg-background p-4 pb-28">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Adicionar Item
              </h1>
              <p className="text-sm text-muted-foreground">
                Preencha cada etapa para configurar
              </p>
            </div>
            <img src={logo} alt="HoraMed" className="h-8 w-auto opacity-50" />
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-between px-1">
            {[1, 2, 3, 4, 5, 6, 7].map((num, i) => (
              <div key={num} className="flex items-center">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
                  ${completedSteps.has(steps[i]?.id) 
                    ? "bg-primary text-primary-foreground" 
                    : activeStep === steps[i]?.id 
                      ? "bg-primary/20 text-primary border-2 border-primary" 
                      : "bg-muted text-muted-foreground"
                  }
                `}>
                  {completedSteps.has(steps[i]?.id) ? <Check className="h-3 w-3" /> : num}
                </div>
                {i < 6 && (
                  <div className={`w-4 h-0.5 mx-0.5 rounded ${
                    completedSteps.has(steps[i]?.id) ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Steps */}
          {!allStepsComplete ? (
            <ProgressiveWizard 
              steps={steps} 
              onStepClick={goToStep}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Summary card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Pill className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{formData.name}</h2>
                    <p className="text-sm text-muted-foreground">{getCategorySummary()}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-primary/10">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">
                      {formData.isContinuous ? "Uso contínuo" : `${formData.treatmentDays} dias`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-primary/10">
                    <span className="text-muted-foreground">Frequência</span>
                    <span className="font-medium">{getFrequencySummary().replace(/📅|🗓️|📆/g, "").trim()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-primary/10">
                    <span className="text-muted-foreground">Horários</span>
                    <span className="font-medium">{formData.times.join(", ")}</span>
                  </div>
                  {formData.doseText && (
                    <div className="flex justify-between py-2 border-b border-primary/10">
                      <span className="text-muted-foreground">Dosagem</span>
                      <span className="font-medium">{formData.doseText}</span>
                    </div>
                  )}
                  {formData.withFood && (
                    <div className="flex justify-between py-2 border-b border-primary/10">
                      <span className="text-muted-foreground">Com alimentação</span>
                      <span className="font-medium">Sim</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Estoque</span>
                    <span className="font-medium">
                      {formData.stock.enabled 
                        ? `${formData.stock.unitsTotal} ${formData.stock.unitLabel}` 
                        : "Não controlado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit buttons */}
              <div className="flex flex-wrap gap-2">
                {steps.map(step => (
                  <Button
                    key={step.id}
                    variant="outline"
                    size="sm"
                    onClick={() => goToStep(step.id)}
                    className="text-xs"
                  >
                    {step.icon} Editar {step.title.toLowerCase()}
                  </Button>
                ))}
              </div>

              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Salvar Medicamento
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      <Navigation />
    </>
  );
}
