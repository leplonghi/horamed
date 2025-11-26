import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Pill, Package, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import MedicationOCRWrapper from "@/components/MedicationOCRWrapper";
import HealthProfileSetup from "@/components/HealthProfileSetup";
import HelpTooltip from "@/components/HelpTooltip";
import logo from "@/assets/horamed-logo.png";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { medicamentosBrasileiros } from "@/data/medicamentos-brasileiros";
import { cn } from "@/lib/utils";

export default function AddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [addMethod, setAddMethod] = useState<"manual" | "ocr">("manual");
  const [showHealthSetup, setShowHealthSetup] = useState(false);
  const [hasHealthProfile, setHasHealthProfile] = useState(false);
  const { showFeedback } = useFeedbackToast();
  const { activeProfile } = useUserProfiles();
  const [openNameCombobox, setOpenNameCombobox] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    dose_text: "",
    category: "medicamento",
    with_food: false,
    notes: "",
    treatment_duration_days: null as number | null,
    total_doses: null as number | null,
    treatment_start_date: "",
    treatment_end_date: "",
    dose_quantity: 1,
    dose_unit: "comprimidos",
  });
  
  // Filter medications based on search
  const filteredMedicamentos = useMemo(() => {
    if (!formData.name) return medicamentosBrasileiros.slice(0, 50);
    const search = formData.name.toLowerCase();
    return medicamentosBrasileiros
      .filter(med => med.nome.toLowerCase().includes(search))
      .slice(0, 50);
  }, [formData.name]);

  const [schedules, setSchedules] = useState([
    {
      freq_type: "daily",
      times: ["08:00"],
      days_of_week: [] as number[],
      mode: "manual" as "manual" | "interval" | "times_per_day",
      interval_hours: 8,
      times_per_day: 3,
      start_time: "08:00",
    },
  ]);

  const [stockData, setStockData] = useState({
    enabled: false,
    units_total: 0,
    units_left: 0,
    unit_label: "un",
    alert_threshold: 20, // Alert when stock is below 20%
  });

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Check if user has health profile (birth_date and weight_kg are required)
      if (user && !isEditing) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("birth_date, weight_kg")
          .eq("user_id", user.id)
          .single();

        const hasProfile = !!(profile?.birth_date && profile?.weight_kg);
        setHasHealthProfile(hasProfile);
        
        // Show health setup modal if profile is incomplete
        if (!hasProfile) {
          setShowHealthSetup(true);
        }
      }
    };

    initUser();

    if (isEditing) {
      loadItemData(isEditing);
    } else {
      // Check for OCR params in URL
      const name = searchParams.get("name");
      const dose = searchParams.get("dose");
      const category = searchParams.get("category");
      
      if (name) {
        setFormData(prev => ({
          ...prev,
          name: name,
          dose_text: dose || "",
          category: category || "medicamento",
        }));
      }
    }
  }, [isEditing, searchParams]);

  const loadItemData = async (itemId: string) => {
    try {
      const { data: item, error } = await supabase
        .from("items")
        .select(`
          *,
          schedules (*),
          stock (*)
        `)
        .eq("id", itemId)
        .single();

      if (error) throw error;

      setFormData({
        name: item.name,
        dose_text: item.dose_text || "",
        category: item.category,
        with_food: item.with_food,
        notes: item.notes || "",
        treatment_duration_days: item.treatment_duration_days || null,
        total_doses: item.total_doses || null,
        treatment_start_date: item.treatment_start_date || "",
        treatment_end_date: item.treatment_end_date || "",
        dose_quantity: 1,
        dose_unit: "comprimidos",
      });

      if (item.schedules && item.schedules.length > 0) {
        setSchedules(
          item.schedules.map((s: any) => ({
            freq_type: s.freq_type,
            times: Array.isArray(s.times) ? s.times : [],
            days_of_week: s.days_of_week || [],
            mode: "manual" as "manual" | "interval" | "times_per_day",
            interval_hours: 8,
            times_per_day: 3,
            start_time: "08:00",
          }))
        );
      }

      if (item.stock) {
        const stockArray = Array.isArray(item.stock) ? item.stock : [item.stock];
        if (stockArray.length > 0) {
          setStockData({
            enabled: true,
            units_total: stockArray[0].units_total,
            units_left: stockArray[0].units_left || stockArray[0].units_total,
            unit_label: stockArray[0].unit_label,
            alert_threshold: 20,
          });
        }
      }
    } catch (error) {
      console.error("Error loading item:", error);
      toast.error("Erro ao carregar item");
    }
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { 
        freq_type: "daily", 
        times: ["08:00"], 
        days_of_week: [],
        mode: "manual" as "manual" | "interval" | "times_per_day",
        interval_hours: 8,
        times_per_day: 3,
        start_time: "08:00",
      },
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const addTime = (scheduleIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times.push("12:00");
    setSchedules(newSchedules);
  };

  const removeTime = (scheduleIndex: number, timeIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times = newSchedules[scheduleIndex].times.filter(
      (_, i) => i !== timeIndex
    );
    setSchedules(newSchedules);
  };

  const updateTime = (scheduleIndex: number, timeIndex: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times[timeIndex] = value;
    setSchedules(newSchedules);
  };

  const updateFreqType = (scheduleIndex: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].freq_type = value;
    setSchedules(newSchedules);
  };

  const updateScheduleMode = (scheduleIndex: number, mode: "manual" | "interval" | "times_per_day") => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].mode = mode;
    
    // Auto-calculate times based on mode
    if (mode === "interval") {
      const times = calculateIntervalTimes(
        newSchedules[scheduleIndex].start_time,
        newSchedules[scheduleIndex].interval_hours
      );
      newSchedules[scheduleIndex].times = times;
    } else if (mode === "times_per_day") {
      const times = calculateTimesPerDay(newSchedules[scheduleIndex].times_per_day);
      newSchedules[scheduleIndex].times = times;
    }
    
    setSchedules(newSchedules);
  };

  const updateIntervalHours = (scheduleIndex: number, hours: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].interval_hours = hours;
    
    // Recalculate times
    const times = calculateIntervalTimes(
      newSchedules[scheduleIndex].start_time,
      hours
    );
    newSchedules[scheduleIndex].times = times;
    setSchedules(newSchedules);
  };

  const updateTimesPerDay = (scheduleIndex: number, times: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times_per_day = times;
    
    // Recalculate times
    const calculatedTimes = calculateTimesPerDay(times);
    newSchedules[scheduleIndex].times = calculatedTimes;
    setSchedules(newSchedules);
  };

  const updateStartTime = (scheduleIndex: number, time: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].start_time = time;
    
    // Recalculate times if in interval mode
    if (newSchedules[scheduleIndex].mode === "interval") {
      const times = calculateIntervalTimes(
        time,
        newSchedules[scheduleIndex].interval_hours
      );
      newSchedules[scheduleIndex].times = times;
    }
    
    setSchedules(newSchedules);
  };

  const calculateIntervalTimes = (startTime: string, intervalHours: number): string[] => {
    const times: string[] = [];
    const [startHour, startMinute] = startTime.split(":").map(Number);
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    const hoursInDay = 24;
    const dosesPerDay = Math.floor(hoursInDay / intervalHours);
    
    for (let i = 0; i < dosesPerDay; i++) {
      times.push(
        `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`
      );
      currentHour = (currentHour + intervalHours) % 24;
    }
    
    return times;
  };

  const calculateTimesPerDay = (timesPerDay: number): string[] => {
    const times: string[] = [];
    
    if (timesPerDay === 1) {
      times.push("08:00");
    } else if (timesPerDay === 2) {
      times.push("08:00", "20:00");
    } else if (timesPerDay === 3) {
      times.push("08:00", "14:00", "20:00");
    } else if (timesPerDay === 4) {
      times.push("08:00", "12:00", "16:00", "20:00");
    } else {
      // Distribute evenly throughout the day
      const intervalHours = 24 / timesPerDay;
      for (let i = 0; i < timesPerDay; i++) {
        const hour = Math.floor(8 + (i * intervalHours)) % 24;
        times.push(`${hour.toString().padStart(2, "0")}:00`);
      }
    }
    
    return times;
  };

  // Calculate total doses per day
  const calculateTotalDosesPerDay = (): number => {
    return schedules.reduce((total, schedule) => total + schedule.times.length, 0);
  };

  // Calculate total doses for treatment (considering dose quantity)
  const calculateTotalTreatmentDoses = (): number | null => {
    if (!formData.treatment_duration_days) return null;
    const dosesPerDay = calculateTotalDosesPerDay();
    return dosesPerDay * formData.treatment_duration_days;
  };

  // Calculate total units needed for treatment
  const calculateTotalUnitsNeeded = (): number | null => {
    const totalDoses = calculateTotalTreatmentDoses();
    if (!totalDoses) return null;
    return totalDoses * formData.dose_quantity;
  };

  // Auto-calculate treatment end date
  const calculateEndDate = (): string | null => {
    if (!formData.treatment_start_date || !formData.treatment_duration_days) return null;
    const startDate = new Date(formData.treatment_start_date);
    const endDate = new Date(startDate.getTime() + formData.treatment_duration_days * 24 * 60 * 60 * 1000);
    return endDate.toISOString().split('T')[0];
  };

  // Calculate stock consumption and alert (considering dose quantity)
  const calculateStockConsumption = () => {
    const dosesPerDay = calculateTotalDosesPerDay();
    const unitsPerDay = dosesPerDay * formData.dose_quantity;
    
    if (!stockData.enabled || stockData.units_total === 0) return null;
    
    const daysUntilEmpty = Math.floor(stockData.units_total / unitsPerDay);
    const alertThresholdUnits = Math.ceil((stockData.units_total * stockData.alert_threshold) / 100);
    const daysUntilAlert = Math.floor(alertThresholdUnits / unitsPerDay);
    
    return {
      dosesPerDay,
      unitsPerDay,
      daysUntilEmpty,
      daysUntilAlert,
      alertThresholdUnits,
    };
  };

  // Auto-update treatment end date when start date or duration changes
  useEffect(() => {
    const endDate = calculateEndDate();
    if (endDate && endDate !== formData.treatment_end_date) {
      setFormData(prev => ({ ...prev, treatment_end_date: endDate }));
    }
  }, [formData.treatment_start_date, formData.treatment_duration_days]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Digite o nome do item");
      return;
    }

    if (schedules.length === 0 || schedules.some((s) => s.times.length === 0)) {
      toast.error("Adicione pelo menos um horário para cada agendamento");
      return;
    }

    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        // Update existing item
        const treatmentEndDate = formData.treatment_start_date && formData.treatment_duration_days
          ? new Date(new Date(formData.treatment_start_date).getTime() + formData.treatment_duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null;

        const { error: itemError } = await supabase
          .from("items")
          .update({
            name: formData.name,
            dose_text: formData.dose_text || null,
            category: formData.category,
            with_food: formData.with_food,
            notes: formData.notes || null,
            treatment_duration_days: formData.treatment_duration_days || null,
            total_doses: formData.total_doses || null,
            treatment_start_date: formData.treatment_start_date || null,
            treatment_end_date: treatmentEndDate,
            profile_id: activeProfile?.id || null,
          })
          .eq("id", isEditing);

        if (itemError) throw itemError;

        // Delete old schedules and doses
        await supabase.from("schedules").delete().eq("item_id", isEditing);

        // Create new schedules and doses
        for (const schedule of schedules) {
          const { data: newSchedule, error: scheduleError } = await supabase
            .from("schedules")
            .insert({
              item_id: isEditing,
              freq_type: schedule.freq_type,
              times: schedule.times,
              days_of_week: schedule.days_of_week,
            })
            .select()
            .single();

          if (scheduleError) throw scheduleError;

          // Generate dose instances
          const doseInstances = [];
          const now = new Date();

          for (let day = 0; day < 7; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);

            for (const time of schedule.times) {
              const [hours, minutes] = time.split(":").map(Number);
              const dueAt = new Date(date);
              dueAt.setHours(hours, minutes, 0, 0);

              if (dueAt > now) {
                doseInstances.push({
                  schedule_id: newSchedule.id,
                  item_id: isEditing,
                  due_at: dueAt.toISOString(),
                  status: "scheduled",
                });
              }
            }
          }

          if (doseInstances.length > 0) {
            await supabase.from("dose_instances").insert(doseInstances);
          }
        }

        // Update stock
        if (stockData.enabled) {
          await supabase.from("stock").delete().eq("item_id", isEditing);
          await supabase.from("stock").insert({
            item_id: isEditing,
            units_total: stockData.units_total,
            units_left: stockData.units_left || stockData.units_total,
            unit_label: stockData.unit_label,
          });
        } else {
          await supabase.from("stock").delete().eq("item_id", isEditing);
        }

        toast.success("Item atualizado com sucesso! 🎉");
      } else {
        // Create new item
        const treatmentEndDate = formData.treatment_start_date && formData.treatment_duration_days
          ? new Date(new Date(formData.treatment_start_date).getTime() + formData.treatment_duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null;

        const { data: item, error: itemError } = await supabase
          .from("items")
          .insert({
            user_id: userId,
            name: formData.name,
            dose_text: formData.dose_text || null,
            category: formData.category,
            with_food: formData.with_food,
            notes: formData.notes || null,
            treatment_duration_days: formData.treatment_duration_days || null,
            total_doses: formData.total_doses || null,
            treatment_start_date: formData.treatment_start_date || null,
            treatment_end_date: treatmentEndDate,
            profile_id: activeProfile?.id || null,
          })
          .select()
          .single();

        if (itemError) {
          // Check if error is subscription limit
          if (itemError.message?.includes('Limite de medicamentos atingido')) {
            toast.error("Limite de medicamentos atingido. Faça upgrade para o plano Premium!", {
              action: {
                label: "Ver Planos",
                onClick: () => navigate('/planos'),
              },
            });
            setLoading(false);
            return;
          }
          throw itemError;
        }

        // Create schedules and doses
        for (const schedule of schedules) {
          const { data: newSchedule, error: scheduleError } = await supabase
            .from("schedules")
            .insert({
              item_id: item.id,
              freq_type: schedule.freq_type,
              times: schedule.times,
              days_of_week: schedule.days_of_week,
            })
            .select()
            .single();

          if (scheduleError) throw scheduleError;

          // Generate dose instances
          const doseInstances = [];
          const now = new Date();

          for (let day = 0; day < 7; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);

            for (const time of schedule.times) {
              const [hours, minutes] = time.split(":").map(Number);
              const dueAt = new Date(date);
              dueAt.setHours(hours, minutes, 0, 0);

              if (dueAt > now) {
                doseInstances.push({
                  schedule_id: newSchedule.id,
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
        }

        // Create stock
        if (stockData.enabled && stockData.units_total > 0) {
          await supabase.from("stock").insert({
            item_id: item.id,
            units_total: stockData.units_total,
            units_left: stockData.units_total,
            unit_label: stockData.unit_label,
          });
        }

        showFeedback("medication-added", { medicationName: formData.name });
      }

      navigate("/medicamentos");
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Erro ao salvar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HealthProfileSetup 
        open={showHealthSetup} 
        onComplete={() => {
          setShowHealthSetup(false);
          setHasHealthProfile(true);
        }} 
      />
      
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="HoraMed" className="h-10 w-auto" />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Pill className="h-6 w-6" />
                {isEditing ? "Editar Item" : "Adicionar Item"}
              </h2>
              <p className="text-muted-foreground">
                {isEditing
                  ? "Atualize as informações do seu medicamento"
                  : "Adicione um novo medicamento ou suplemento"}
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={addMethod === "manual" ? "default" : "outline"}
                  onClick={() => setAddMethod("manual")}
                  className="h-auto py-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="h-6 w-6" />
                    <span>Manual</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={addMethod === "ocr" ? "default" : "outline"}
                  onClick={() => setAddMethod("ocr")}
                  className="h-auto py-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="h-6 w-6" />
                    <span>Ler Remédio</span>
                  </div>
                </Button>
              </div>

              {addMethod === "ocr" && (
                <Card className="p-6">
                  <MedicationOCRWrapper
                    onResult={(result) => {
                      setFormData(prev => ({
                        ...prev,
                        name: result.name,
                        dose_text: result.dose || "",
                        category: result.category || "medicamento",
                        treatment_duration_days: result.duration_days || null,
                        total_doses: result.total_doses || null,
                        treatment_start_date: result.start_date || "",
                      }));
                      setAddMethod("manual");
                      toast.success("Dados extraídos! Complete as informações abaixo.");
                    }}
                  />
                </Card>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do item *</Label>
                  <Popover open={openNameCombobox} onOpenChange={setOpenNameCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openNameCombobox}
                        className="w-full justify-between h-auto min-h-[40px] text-left font-normal"
                      >
                        <span className={cn("truncate", !formData.name && "text-muted-foreground")}>
                          {formData.name || "Digite ou selecione um medicamento..."}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Buscar medicamento..." 
                          value={formData.name}
                          onValueChange={(value) => setFormData({ ...formData, name: value })}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-4 text-sm">
                              <p className="font-medium mb-2">Não encontrou?</p>
                              <p className="text-muted-foreground mb-3">Digite o nome do seu medicamento</p>
                              <Button 
                                size="sm" 
                                onClick={() => setOpenNameCombobox(false)}
                                className="w-full"
                              >
                                Continuar com "{formData.name}"
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredMedicamentos.map((med) => (
                              <CommandItem
                                key={med.nome}
                                value={med.nome}
                                onSelect={(currentValue) => {
                                  setFormData({ ...formData, name: currentValue });
                                  setOpenNameCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.name === med.nome ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{med.nome}</div>
                                  {med.principioAtivo && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {med.principioAtivo}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    💊 Selecione da lista ou digite o nome do seu medicamento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicamento">💊 Medicamento</SelectItem>
                      <SelectItem value="vitamina">🧪 Vitamina</SelectItem>
                      <SelectItem value="suplemento">🌿 Suplemento</SelectItem>
                      <SelectItem value="outro">📦 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dose">Concentração/Dosagem</Label>
                  <Input
                    id="dose"
                    placeholder="Ex: 500mg, 10mg/ml"
                    value={formData.dose_text}
                    onChange={(e) =>
                      setFormData({ ...formData, dose_text: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Concentração do medicamento (ex: 500mg por comprimido)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dose-quantity">Quantidade por Dose *</Label>
                    <Input
                      id="dose-quantity"
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="Ex: 1, 2, 0.5"
                      value={formData.dose_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, dose_quantity: parseFloat(e.target.value) || 1 })
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantas unidades tomar por vez
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dose-unit">Unidade *</Label>
                    <Select
                      value={formData.dose_unit}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dose_unit: value })
                      }
                    >
                      <SelectTrigger id="dose-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprimidos">comprimidos</SelectItem>
                        <SelectItem value="cápsulas">cápsulas</SelectItem>
                        <SelectItem value="gotas">gotas</SelectItem>
                        <SelectItem value="ml">ml (mililitros)</SelectItem>
                        <SelectItem value="gr">gr (gramas)</SelectItem>
                        <SelectItem value="sachês">sachês</SelectItem>
                        <SelectItem value="inalações">inalações</SelectItem>
                        <SelectItem value="aplicações">aplicações</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="with-food">Tomar com alimento</Label>
                    <p className="text-sm text-muted-foreground">
                      Requer ingestão com refeição
                    </p>
                  </div>
                  <Switch
                    id="with-food"
                    checked={formData.with_food}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, with_food: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Duração do Tratamento (Opcional)</Label>
                  <HelpTooltip 
                    content="Configure o período do tratamento se for temporário (ex: antibióticos por 7 dias). O sistema calcula automaticamente o total de unidades necessárias."
                  />
                </div>
                <p className="text-sm text-muted-foreground -mt-2">
                  Configure o período de tratamento para calcular automaticamente as doses
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Data de Início</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formData.treatment_start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, treatment_start_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration-days">Duração (dias)</Label>
                    <Input
                      id="duration-days"
                      type="number"
                      min="1"
                      placeholder="Ex: 7, 14, 30"
                      value={formData.treatment_duration_days || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          treatment_duration_days: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantos dias deve durar o tratamento
                    </p>
                  </div>
                </div>

                {formData.treatment_start_date && formData.treatment_end_date && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Data de término:</span>
                      <span className="text-sm font-bold">
                        {new Date(formData.treatment_end_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    
                    {calculateTotalTreatmentDoses() && (
                      <>
                        <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                          <span className="text-sm font-medium">Total de tomadas:</span>
                          <span className="text-sm font-bold text-primary">
                            {calculateTotalTreatmentDoses()} doses
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total de {formData.dose_unit}:</span>
                          <span className="text-lg font-bold text-primary">
                            {calculateTotalUnitsNeeded()} {formData.dose_unit}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Horários</Label>
                  <HelpTooltip 
                    content="Configure os horários do medicamento. Use 'Automático' para calcular intervalos ou distribuir doses ao longo do dia."
                  />
                </div>

                {schedules.map((schedule, scheduleIndex) => (
                  <Card key={scheduleIndex} className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Select
                        value={schedule.freq_type}
                        onValueChange={(value) => updateFreqType(scheduleIndex, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>

                      {schedules.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSchedule(scheduleIndex)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Schedule Mode Selector */}
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium">Modo de Configuração</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={schedule.mode === "manual" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateScheduleMode(scheduleIndex, "manual")}
                          className="text-xs"
                        >
                          Manual
                        </Button>
                        <Button
                          type="button"
                          variant={schedule.mode === "interval" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateScheduleMode(scheduleIndex, "interval")}
                          className="text-xs"
                        >
                          A cada X horas
                        </Button>
                        <Button
                          type="button"
                          variant={schedule.mode === "times_per_day" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateScheduleMode(scheduleIndex, "times_per_day")}
                          className="text-xs"
                        >
                          X vezes/dia
                        </Button>
                      </div>
                    </div>

                    {/* Interval Mode */}
                    {schedule.mode === "interval" && (
                      <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`start-time-${scheduleIndex}`} className="text-sm">
                              Horário Inicial
                            </Label>
                            <Input
                              id={`start-time-${scheduleIndex}`}
                              type="time"
                              value={schedule.start_time}
                              onChange={(e) => updateStartTime(scheduleIndex, e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`interval-${scheduleIndex}`} className="text-sm">
                              A cada (horas)
                            </Label>
                            <Input
                              id={`interval-${scheduleIndex}`}
                              type="number"
                              min="1"
                              max="24"
                              value={schedule.interval_hours}
                              onChange={(e) =>
                                updateIntervalHours(scheduleIndex, parseInt(e.target.value) || 8)
                              }
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ✅ {schedule.times.length} doses por dia calculadas automaticamente
                        </p>
                      </div>
                    )}

                    {/* Times Per Day Mode */}
                    {schedule.mode === "times_per_day" && (
                      <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="space-y-2">
                          <Label htmlFor={`times-per-day-${scheduleIndex}`} className="text-sm">
                            Quantas vezes por dia?
                          </Label>
                          <Select
                            value={schedule.times_per_day.toString()}
                            onValueChange={(value) =>
                              updateTimesPerDay(scheduleIndex, parseInt(value))
                            }
                          >
                            <SelectTrigger id={`times-per-day-${scheduleIndex}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 vez (manhã)</SelectItem>
                              <SelectItem value="2">2 vezes (manhã e noite)</SelectItem>
                              <SelectItem value="3">3 vezes (manhã, tarde e noite)</SelectItem>
                              <SelectItem value="4">4 vezes</SelectItem>
                              <SelectItem value="5">5 vezes</SelectItem>
                              <SelectItem value="6">6 vezes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ✅ Horários distribuídos automaticamente ao longo do dia
                        </p>
                      </div>
                    )}

                    {/* Manual Mode or Show Times */}
                    {schedule.mode === "manual" ? (
                      <>
                        {schedule.times.map((time, timeIndex) => (
                          <div key={timeIndex} className="flex gap-2">
                            <Input
                              type="time"
                              value={time}
                              onChange={(e) =>
                                updateTime(scheduleIndex, timeIndex, e.target.value)
                              }
                              className="flex-1"
                            />
                            {schedule.times.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTime(scheduleIndex, timeIndex)}
                                className="text-destructive"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTime(scheduleIndex)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar horário
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Horários Calculados:</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {schedule.times.map((time, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-background border border-border rounded text-center text-sm font-medium"
                            >
                              {time}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}

                {/* Total Doses Summary */}
                <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Tomadas por dia:</span>
                    <span className="text-lg font-bold text-primary">
                      {calculateTotalDosesPerDay()} doses
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Consumo diário:</span>
                    <span className="text-lg font-bold text-primary">
                      {calculateTotalDosesPerDay() * formData.dose_quantity} {formData.dose_unit}
                    </span>
                  </div>
                  {formData.treatment_duration_days && (
                    <>
                      <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                        <span className="text-sm font-semibold">Total de tomadas no tratamento:</span>
                        <span className="text-lg font-bold text-primary">
                          {calculateTotalTreatmentDoses()} doses
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Total de {formData.dose_unit} necessários:</span>
                        <span className="text-xl font-bold text-primary">
                          {calculateTotalUnitsNeeded()} {formData.dose_unit}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="stock-enabled" className="flex items-center gap-2 text-base font-semibold">
                      <Package className="h-5 w-5 text-primary" />
                      Controlar Estoque
                      <HelpTooltip 
                        content="Ative para receber alertas quando seus medicamentos estiverem acabando. O sistema desconta automaticamente quando você marca doses como tomadas."
                      />
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas automáticos quando o medicamento estiver acabando
                    </p>
                  </div>
                  <Switch
                    id="stock-enabled"
                    checked={stockData.enabled}
                    onCheckedChange={(checked) =>
                      setStockData({ ...stockData, enabled: checked })
                    }
                  />
                </div>

                {stockData.enabled && (
                  <Card className="p-4 space-y-4 bg-muted/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="units-total" className="text-sm font-medium">
                          Quantidade Total *
                        </Label>
                        <Input
                          id="units-total"
                          type="number"
                          min="1"
                          placeholder="Ex: 30"
                          value={stockData.units_total || ""}
                          onChange={(e) =>
                            setStockData({
                              ...stockData,
                              units_total: parseInt(e.target.value) || 0,
                            })
                          }
                          required={stockData.enabled}
                        />
                        <p className="text-xs text-muted-foreground">
                          Quantidade que você tem agora
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit-label" className="text-sm font-medium">
                          Unidade *
                        </Label>
                        <Select
                          value={stockData.unit_label}
                          onValueChange={(value) =>
                            setStockData({ ...stockData, unit_label: value })
                          }
                        >
                          <SelectTrigger id="unit-label">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comprimidos">comprimidos</SelectItem>
                            <SelectItem value="cápsulas">cápsulas</SelectItem>
                            <SelectItem value="gotas">gotas</SelectItem>
                            <SelectItem value="ml">ml (mililitros)</SelectItem>
                            <SelectItem value="gr">gr (gramas)</SelectItem>
                            <SelectItem value="unidades">unidades</SelectItem>
                            <SelectItem value="sachês">sachês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alert-threshold" className="text-sm font-medium">
                        Alerta de Estoque Baixo
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="alert-threshold"
                          type="number"
                          min="1"
                          max="50"
                          value={stockData.alert_threshold}
                          onChange={(e) =>
                            setStockData({
                              ...stockData,
                              alert_threshold: parseInt(e.target.value) || 20,
                            })
                          }
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">
                          % restante para alertar
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Você será alertado quando restar apenas{" "}
                        <strong>{stockData.alert_threshold}%</strong> do estoque total
                        {stockData.units_total > 0 && (
                          <span className="text-warning font-medium">
                            {" "}(≈ {Math.ceil((stockData.units_total * stockData.alert_threshold) / 100)}{" "}
                            {stockData.unit_label})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Stock Consumption Preview */}
                    {calculateStockConsumption() && (
                      <div className="space-y-3 p-4 bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/30 rounded-lg">
                        <Label className="text-sm font-semibold text-warning flex items-center gap-2">
                          📊 Previsão de Consumo
                        </Label>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tomadas por dia:</span>
                            <span className="font-medium">
                              {calculateStockConsumption()!.dosesPerDay} doses
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Consumo diário:</span>
                            <span className="font-medium">
                              {calculateStockConsumption()!.unitsPerDay} {stockData.unit_label}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-warning/20">
                            <span className="text-muted-foreground">Estoque dura:</span>
                            <span className="font-bold text-lg">
                              {calculateStockConsumption()!.daysUntilEmpty} dias
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Alerta em:</span>
                            <span className="font-medium text-warning">
                              {calculateStockConsumption()!.daysUntilAlert} dias ({calculateStockConsumption()!.alertThresholdUnits} {stockData.unit_label})
                            </span>
                          </div>
                        </div>
                        
                        {calculateTotalUnitsNeeded() && stockData.units_total < calculateTotalUnitsNeeded()! && (
                          <div className="pt-3 border-t border-destructive/30 bg-destructive/10 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                            <p className="text-xs font-semibold text-destructive flex items-center gap-2">
                              ⚠️ Estoque insuficiente para completar o tratamento!
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Faltam <strong>{calculateTotalUnitsNeeded()! - stockData.units_total} {stockData.unit_label}</strong> para completar as {calculateTotalTreatmentDoses()} doses do tratamento.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Package className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Como funciona:</strong> O sistema calcula automaticamente
                          quando seu estoque vai acabar baseado no consumo diário. Você receberá
                          alertas na página inicial e no gráfico de estoque.
                        </span>
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg"
            >
              {loading ? "Salvando..." : isEditing ? "Atualizar item" : "Salvar item"}
            </Button>
          </form>
        </div>
      </div>
      <Navigation />
    </>
  );
}