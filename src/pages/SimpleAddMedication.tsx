import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, PenLine, Check, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { motion, AnimatePresence } from "framer-motion";

type Step = "method" | "name" | "schedule" | "done";

const SCHEDULE_OPTIONS = [
  { id: "1x", label: "1x ao dia", sublabel: "Manhã (08:00)", times: ["08:00"], icon: "☀️" },
  { id: "2x", label: "2x ao dia", sublabel: "Manhã e Noite", times: ["08:00", "20:00"], icon: "🌗" },
  { id: "3x", label: "3x ao dia", sublabel: "8h, 14h e 20h", times: ["08:00", "14:00", "20:00"], icon: "⏰" },
];

export default function SimpleAddMedication() {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const { hasFeature } = useSubscription();
  
  const [step, setStep] = useState<Step>("method");
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("1x");
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  
  const cameraRef = useRef<HTMLInputElement>(null);

  // OCR
  const handleOCR = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setProcessingOCR(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const { data, error } = await supabase.functions.invoke('extract-medication', {
          body: { image: base64 }
        });
        
        if (error) throw error;
        
        if (data?.name) {
          setName(data.name);
          if (data.dose) setDose(data.dose);
          toast.success("Dados extraídos!");
          setStep("name");
        } else {
          toast.error("Não consegui ler. Tente digitar manualmente.");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao processar");
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleMethodSelect = (method: "camera" | "manual") => {
    if (method === "camera") {
      if (!hasFeature('ocr')) {
        setShowUpgrade(true);
        return;
      }
      cameraRef.current?.click();
    } else {
      setStep("name");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Digite o nome do medicamento");
      return;
    }
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const schedule = SCHEDULE_OPTIONS.find(s => s.id === selectedSchedule)!;

      // Criar item
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id || null,
          name: name.trim(),
          dose_text: dose.trim() || null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Criar schedule
      await supabase.from("schedules").insert({
        item_id: item.id,
        freq_type: "daily",
        times: schedule.times,
      });

      setStep("done");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-5 py-4">
          <button 
            onClick={() => step === "method" ? navigate(-1) : setStep(step === "schedule" ? "name" : "method")}
            className="p-2 -ml-2 rounded-xl hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Novo Medicamento</h1>
        </div>
        
        {/* Progress bar visual */}
        <div className="flex gap-1.5 px-5 pb-3">
          {["method", "name", "schedule"].map((s, i) => {
            const steps = ["method", "name", "schedule"];
            const currentIdx = steps.indexOf(step);
            const isActive = i <= currentIdx;
            return (
              <div 
                key={s} 
                className={`flex-1 h-1.5 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-muted'}`}
              />
            );
          })}
        </div>
      </div>

      <input
        type="file"
        ref={cameraRef}
        accept="image/*"
        capture="environment"
        onChange={handleOCR}
        className="hidden"
      />

      <UpgradeModal 
        open={showUpgrade} 
        onOpenChange={setShowUpgrade}
        feature="Escanear receitas"
      />

      <div className="px-5 py-6">
        <AnimatePresence mode="wait">
          
          {/* Step: Método */}
          {step === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Como você quer adicionar?</h2>
                <p className="text-muted-foreground">Escolha a forma mais fácil para você</p>
              </div>

              {processingOCR ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Lendo a receita...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => handleMethodSelect("manual")}
                    className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <PenLine className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Digitar manualmente</h3>
                        <p className="text-muted-foreground text-sm">Preencha nome e horários</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleMethodSelect("camera")}
                    className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <Camera className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Escanear receita</h3>
                        <p className="text-muted-foreground text-sm">Tire foto e preencho automático</p>
                      </div>
                      {!hasFeature('ocr') && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                          Premium
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step: Nome */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💊</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Qual medicamento?</h2>
                <p className="text-muted-foreground">Digite o nome e a dose</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome do medicamento</label>
                  <Input
                    placeholder="Ex: Losartana, Vitamina D..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 text-lg rounded-xl"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Dose (opcional)</label>
                  <Input
                    placeholder="Ex: 1 comprimido, 5ml..."
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="h-14 text-lg rounded-xl"
                  />
                </div>
              </div>

              <Button 
                onClick={() => setStep("schedule")} 
                className="w-full h-14 text-lg rounded-xl"
                disabled={!name.trim()}
              >
                Continuar
              </Button>
            </motion.div>
          )}

          {/* Step: Horário */}
          {step === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quando você toma?</h2>
                <p className="text-muted-foreground">Escolha a frequência</p>
              </div>

              <div className="space-y-3">
                {SCHEDULE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedSchedule(option.id)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      selectedSchedule === option.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{option.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{option.label}</h3>
                        <p className="text-muted-foreground text-sm">{option.sublabel}</p>
                      </div>
                      {selectedSchedule === option.id && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full h-14 text-lg rounded-xl"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Adicionar Medicamento
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step: Sucesso */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-12 h-12 text-success" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Pronto!</h2>
              <p className="text-muted-foreground mb-8">
                {name} foi adicionado com sucesso
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/hoje")} 
                  className="w-full h-14 text-lg rounded-xl"
                >
                  Ver minhas doses
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setName("");
                    setDose("");
                    setStep("method");
                  }}
                  className="w-full h-14 text-lg rounded-xl"
                >
                  Adicionar outro
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
