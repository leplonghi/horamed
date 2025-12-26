import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Camera, Check, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { cn } from "@/lib/utils";

type SchedulePreset = "1x" | "2x" | "3x" | "custom";
type AddMethod = "manual" | "camera" | "gallery";

export default function AddMedicationWizard() {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const { hasFeature } = useSubscription();
  const [step, setStep] = useState(0); // 0 = choose method, 1-3 = wizard steps
  const [loading, setSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Step 1 - Basic info
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);
  
  // Load and filter medications from CSV
  const { medicamentos: filteredMedicamentos, loading: loadingMeds } = useFilteredMedicamentos(name, 100);

  // Step 2 - Schedule
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>("1x");
  const [customTimes, setCustomTimes] = useState<string[]>(["08:00"]);

  // Step 3 - Optional settings
  const [withFood, setWithFood] = useState(false);
  const [notes, setNotes] = useState("");
  const [enableStock, setEnableStock] = useState(false);
  const [stockTotal, setStockTotal] = useState("");
  const [treatmentDays, setTreatmentDays] = useState("");

  const presetSchedules = {
    "1x": { label: "1x ao dia (manhã)", times: ["08:00"], icon: "☀️" },
    "2x": { label: "2x ao dia (manhã/noite)", times: ["08:00", "20:00"], icon: "🌗" },
    "3x": { label: "3x ao dia (8h/14h/20h)", times: ["08:00", "14:00", "20:00"], icon: "🕐" },
    custom: { label: "Personalizar horários", times: [], icon: "⚙️" },
  };
  
  // OCR Processing
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      await processOCR(base64);
    };
    reader.readAsDataURL(file);
  };
  
  const processOCR = async (imageData: string) => {
    setIsProcessingOCR(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-medication', {
        body: { image: imageData }
      });
      
      if (error) throw error;
      
      if (data?.name) {
        setName(data.name);
        if (data.dose) setDose(data.dose);
        if (data.duration_days) setTreatmentDays(data.duration_days.toString());
        toast.success("Dados extraídos com sucesso!");
        setStep(1); // Go to first wizard step
      } else {
        toast.error("Não foi possível extrair os dados. Tente novamente.");
        setImagePreview(null);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Erro ao processar imagem");
      setImagePreview(null);
    } finally {
      setIsProcessingOCR(false);
    }
  };
  
  const handleMethodSelect = (method: AddMethod) => {
    if (method === "manual") {
      setStep(1);
    } else if (method === "camera") {
      if (!hasFeature('ocr')) {
        setShowUpgradeModal(true);
        return;
      }
      cameraInputRef.current?.click();
    } else if (method === "gallery") {
      if (!hasFeature('ocr')) {
        setShowUpgradeModal(true);
        return;
      }
      galleryInputRef.current?.click();
    }
  };

  const handleNext = () => {
    if (step === 1 && (!name || !dose)) {
      toast.error("Preencha o nome e a dose");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Determine times based on preset
      let finalTimes = customTimes;
      if (schedulePreset !== "custom") {
        finalTimes = presetSchedules[schedulePreset].times;
      }

      // Create medication item
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id || null,
          name,
          dose_text: dose,
          with_food: withFood,
          notes: notes || null,
          treatment_duration_days: treatmentDays ? parseInt(treatmentDays) : null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Create schedule
      const { error: scheduleError } = await supabase
        .from("schedules")
        .insert({
          item_id: item.id,
          freq_type: "daily",
          times: finalTimes,
        });

      if (scheduleError) throw scheduleError;

      // Create stock if enabled
      if (enableStock && stockTotal) {
        const { error: stockError } = await supabase
          .from("stock")
          .insert({
            item_id: item.id,
            units_total: parseInt(stockTotal),
            units_left: parseInt(stockTotal),
          });

        if (stockError) throw stockError;
      }

      toast.success("Item adicionado com sucesso!");
      navigate("/hoje");
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Erro ao salvar item");
    } finally {
      setSaving(false);
    }
  };

  const progressSteps = [
    { number: 1, active: step >= 1 },
    { number: 2, active: step >= 2 },
    { number: 3, active: step >= 3 },
  ];

  return (
    <>
      <Header />
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature="OCR de receitas"
      />
      
      <div className="min-h-screen bg-background pt-20 px-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Step 0 - Choose Method */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Adicionar Medicamento</h1>
                <p className="text-muted-foreground">Como você quer adicionar?</p>
              </div>
              
              {isProcessingOCR ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Processando imagem...</p>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg opacity-50" />
                    )}
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  <Card 
                    className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => handleMethodSelect("manual")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Digitar manualmente</h3>
                        <p className="text-sm text-muted-foreground">Preencha os dados do medicamento</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card 
                    className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => handleMethodSelect("camera")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10">
                        <Camera className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Escanear receita</h3>
                        <p className="text-sm text-muted-foreground">Tire foto e extraímos os dados</p>
                      </div>
                      {!hasFeature('ocr') && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Premium</span>
                      )}
                    </div>
                  </Card>
                  
                  <Card 
                    className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => handleMethodSelect("gallery")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-500/10">
                        <Image className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Importar da galeria</h3>
                        <p className="text-sm text-muted-foreground">Use uma foto já existente</p>
                      </div>
                      {!hasFeature('ocr') && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Premium</span>
                      )}
                    </div>
                  </Card>
                </div>
              )}
              
              <Button variant="ghost" className="w-full" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            </div>
          )}
          
          {/* Wizard Steps 1-3 */}
          {step >= 1 && (
            <>
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2">
                {progressSteps.map((s, idx) => (
                  <div key={s.number} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                        s.active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.number}
                    </div>
                    {idx < progressSteps.length - 1 && (
                      <div
                        className={`w-12 h-1 mx-2 transition-colors ${
                          step > s.number ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && "Informações do Item"}
                {step === 2 && "Horários"}
                {step === 3 && "Configurações Adicionais"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Passo 1 de 3 - Remédio, suplemento ou vitamina"}
                {step === 2 && "Passo 2 de 3"}
                {step === 3 && "Passo 3 de 3"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 - Basic Info */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Medicamento</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between h-auto min-h-[40px] text-left font-normal"
                        >
                          <span className={cn("truncate", !name && "text-muted-foreground")}>
                            {name || "Digite ou selecione um medicamento..."}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Buscar medicamento..." 
                            value={name}
                            onValueChange={setName}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-4 text-sm">
                                <p className="font-medium mb-2">Não encontrou?</p>
                                <p className="text-muted-foreground mb-3">Digite o nome do seu medicamento</p>
                                <Button 
                                  size="sm" 
                                  onClick={() => setOpenCombobox(false)}
                                  className="w-full"
                                >
                                  Continuar com "{name}"
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredMedicamentos.map((med) => (
                                <CommandItem
                                  key={med.nome}
                                  value={med.nome}
                                  onSelect={(currentValue) => {
                                    setName(currentValue);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      name === med.nome ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{med.nome}</div>
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
                    <Label htmlFor="dose">Dose</Label>
                    <Input
                      id="dose"
                      placeholder="Ex: 1 comprimido, 2 cápsulas, 5ml"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>Dica:</strong> Você pode escanear uma receita para preencher
                      automático
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate("/scan")}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Escanear Receita
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2 - Schedule */}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Quando você toma?</Label>
                    <RadioGroup value={schedulePreset} onValueChange={(v) => setSchedulePreset(v as SchedulePreset)}>
                      {Object.entries(presetSchedules).map(([key, preset]) => (
                        <div
                          key={key}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        >
                          <RadioGroupItem value={key} id={key} />
                          <Label htmlFor={key} className="flex-1 cursor-pointer">
                            <span className="mr-2">{preset.icon}</span>
                            {preset.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {schedulePreset === "custom" && (
                    <div className="space-y-2">
                      <Label>Horários personalizados</Label>
                      {customTimes.map((time, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => {
                              const newTimes = [...customTimes];
                              newTimes[idx] = e.target.value;
                              setCustomTimes(newTimes);
                            }}
                          />
                          {customTimes.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newTimes = customTimes.filter((_, i) => i !== idx);
                                setCustomTimes(newTimes);
                              }}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomTimes([...customTimes, "12:00"])}
                      >
                        + Adicionar horário
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Step 3 - Optional Settings */}
              {step === 3 && (
                <>
                  <div className="space-y-4">
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                        <span className="font-medium">▶ Controle de Estoque</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="enable-stock">Ativar controle</Label>
                          <Switch
                            id="enable-stock"
                            checked={enableStock}
                            onCheckedChange={setEnableStock}
                          />
                        </div>
                        {enableStock && (
                          <div className="space-y-2">
                            <Label htmlFor="stock">Quantidade total</Label>
                            <Input
                              id="stock"
                              type="number"
                              placeholder="Ex: 30"
                              value={stockTotal}
                              onChange={(e) => setStockTotal(e.target.value)}
                            />
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                        <span className="font-medium">▶ Duração do Tratamento</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="treatment-days">Duração (dias)</Label>
                          <Input
                            id="treatment-days"
                            type="number"
                            placeholder="Ex: 7"
                            value={treatmentDays}
                            onChange={(e) => setTreatmentDays(e.target.value)}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-accent">
                        <span className="font-medium">▶ Observações</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <Textarea
                          placeholder="Observações adicionais..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor="with-food">Tomar com alimento</Label>
                      <Switch
                        id="with-food"
                        checked={withFood}
                        onCheckedChange={setWithFood}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
                {step < 3 && (
                  <Button onClick={handleNext} className="flex-1">
                    Continuar
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {step === 3 && (
                  <Button onClick={handleSave} disabled={loading} className="flex-1">
                    {loading ? "Salvando..." : "Salvar ✓"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
