import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import OceanBackground from "@/components/ui/OceanBackground";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Droplet, 
  Scale, 
  Wind,
  Plus,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VitalSign {
  id: string;
  data_medicao: string;
  pressao_sistolica: number | null;
  pressao_diastolica: number | null;
  frequencia_cardiaca: number | null;
  temperatura: number | null;
  glicemia: number | null;
  saturacao_oxigenio: number | null;
  peso_kg: number | null;
  observacoes: string | null;
}

interface VitalCardProps {
  title: string;
  icon: React.ReactNode;
  currentValue: string | null;
  unit: string;
  lastDate: string | null;
  trend?: 'up' | 'down' | 'stable' | null;
  colorClass: string;
  inputName: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
}

function VitalCard({ 
  title, 
  icon, 
  currentValue, 
  unit, 
  lastDate, 
  trend,
  colorClass,
  inputName,
  inputValue,
  onInputChange,
  placeholder,
  type = "number",
  step,
  min,
  max
}: VitalCardProps) {
  const { language } = useLanguage();
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  return (
    <Card className={cn(
      "border-2 transition-all hover:border-primary/30",
      "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={cn("p-2 rounded-lg", colorClass)}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Value */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'pt' ? 'Último registro' : 'Last reading'}
            </p>
            {currentValue ? (
              <p className="text-2xl font-bold text-primary">
                {currentValue} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {language === 'pt' ? 'Não registrado' : 'Not recorded'}
              </p>
            )}
          </div>
          {trend && currentValue && (
            <TrendIcon className={cn(
              "h-5 w-5",
              trend === 'up' ? "text-red-500" : 
              trend === 'down' ? "text-green-500" : 
              "text-muted-foreground"
            )} />
          )}
        </div>
        
        {lastDate && (
          <p className="text-xs text-muted-foreground">
            {lastDate}
          </p>
        )}
        
        {/* Input for new value */}
        <div className="pt-2 border-t">
          <Label htmlFor={inputName} className="text-xs text-muted-foreground">
            {language === 'pt' ? 'Novo registro' : 'New reading'}
          </Label>
          <Input
            id={inputName}
            type={type}
            step={step}
            min={min}
            max={max}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="mt-1 h-10"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SinaisVitais() {
  const { user } = useAuth();
  const { activeProfile } = useUserProfiles();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  
  const [formData, setFormData] = useState({
    pressao_sistolica: "",
    pressao_diastolica: "",
    frequencia_cardiaca: "",
    temperatura: "",
    glicemia: "",
    saturacao_oxigenio: "",
    peso_kg: "",
    observacoes: ""
  });

  // Fetch latest vital signs
  const { data: latestVitals, isLoading } = useQuery({
    queryKey: ["latest-vitals", user?.id, activeProfile?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      let query = supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .order("data_medicao", { ascending: false })
        .limit(1);
      
      if (activeProfile?.id) {
        query = query.eq("profile_id", activeProfile.id);
      }
      
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as VitalSign | null;
    },
    enabled: !!user?.id,
  });

  // Fetch previous vitals for trend comparison
  const { data: previousVitals } = useQuery({
    queryKey: ["previous-vitals", user?.id, activeProfile?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      let query = supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .order("data_medicao", { ascending: false })
        .range(1, 1);
      
      if (activeProfile?.id) {
        query = query.eq("profile_id", activeProfile.id);
      }
      
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as VitalSign | null;
    },
    enabled: !!user?.id,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const hasAnyValue = Object.entries(formData).some(([key, value]) => {
        if (key === 'observacoes') return false;
        return value !== "";
      });
      
      if (!hasAnyValue) {
        throw new Error(language === 'pt' 
          ? "Preencha pelo menos um campo" 
          : "Fill at least one field");
      }
      
      const insertData: any = {
        user_id: user.id,
        profile_id: activeProfile?.id || null,
        data_medicao: new Date().toISOString(),
      };
      
      if (formData.pressao_sistolica) insertData.pressao_sistolica = parseInt(formData.pressao_sistolica);
      if (formData.pressao_diastolica) insertData.pressao_diastolica = parseInt(formData.pressao_diastolica);
      if (formData.frequencia_cardiaca) insertData.frequencia_cardiaca = parseInt(formData.frequencia_cardiaca);
      if (formData.temperatura) insertData.temperatura = parseFloat(formData.temperatura);
      if (formData.glicemia) insertData.glicemia = parseInt(formData.glicemia);
      if (formData.saturacao_oxigenio) insertData.saturacao_oxigenio = parseInt(formData.saturacao_oxigenio);
      if (formData.peso_kg) insertData.peso_kg = parseFloat(formData.peso_kg);
      if (formData.observacoes) insertData.observacoes = formData.observacoes;
      
      const { error } = await supabase.from("sinais_vitais").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === 'pt' ? "Sinais vitais salvos!" : "Vital signs saved!");
      setFormData({
        pressao_sistolica: "",
        pressao_diastolica: "",
        frequencia_cardiaca: "",
        temperatura: "",
        glicemia: "",
        saturacao_oxigenio: "",
        peso_kg: "",
        observacoes: ""
      });
      queryClient.invalidateQueries({ queryKey: ["latest-vitals"] });
      queryClient.invalidateQueries({ queryKey: ["previous-vitals"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const getTrend = (current: number | null, previous: number | null): 'up' | 'down' | 'stable' | null => {
    if (!current || !previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), language === 'pt' ? "dd/MM/yyyy 'às' HH:mm" : "MM/dd/yyyy 'at' HH:mm", { locale: dateLocale });
  };

  const updateField = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 page-container relative z-10">
        <PageHeroHeader
          icon={<Activity className="h-6 w-6 text-primary" />}
          title={language === 'pt' ? "Sinais Vitais" : "Vital Signs"}
          subtitle={language === 'pt' 
            ? "Acompanhe sua pressão, peso, glicemia e outros indicadores de saúde" 
            : "Track your blood pressure, weight, blood sugar, and other health indicators"}
        />

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard-saude')}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {language === 'pt' ? 'Ver Histórico' : 'View History'}
          </Button>
        </div>

        {/* Vital Signs Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Blood Pressure */}
          <Card className="border-2 transition-all hover:border-primary/30 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                {language === 'pt' ? 'Pressão Arterial' : 'Blood Pressure'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'pt' ? 'Último registro' : 'Last reading'}
                </p>
                {latestVitals?.pressao_sistolica && latestVitals?.pressao_diastolica ? (
                  <p className="text-2xl font-bold text-primary">
                    {latestVitals.pressao_sistolica}/{latestVitals.pressao_diastolica} 
                    <span className="text-sm font-normal text-muted-foreground"> mmHg</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {language === 'pt' ? 'Não registrado' : 'Not recorded'}
                  </p>
                )}
              </div>
              
              <div className="pt-2 border-t grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pressao_sistolica" className="text-xs text-muted-foreground">
                    {language === 'pt' ? 'Sistólica' : 'Systolic'}
                  </Label>
                  <Input
                    id="pressao_sistolica"
                    type="number"
                    placeholder="120"
                    value={formData.pressao_sistolica}
                    onChange={(e) => updateField('pressao_sistolica')(e.target.value)}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="pressao_diastolica" className="text-xs text-muted-foreground">
                    {language === 'pt' ? 'Diastólica' : 'Diastolic'}
                  </Label>
                  <Input
                    id="pressao_diastolica"
                    type="number"
                    placeholder="80"
                    value={formData.pressao_diastolica}
                    onChange={(e) => updateField('pressao_diastolica')(e.target.value)}
                    className="mt-1 h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight */}
          <VitalCard
            title={language === 'pt' ? 'Peso' : 'Weight'}
            icon={<Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            currentValue={latestVitals?.peso_kg?.toString() || null}
            unit="kg"
            lastDate={formatDate(latestVitals?.data_medicao || null)}
            trend={getTrend(latestVitals?.peso_kg || null, previousVitals?.peso_kg || null)}
            colorClass="bg-blue-100 dark:bg-blue-900/30"
            inputName="peso_kg"
            inputValue={formData.peso_kg}
            onInputChange={updateField('peso_kg')}
            placeholder="75.5"
            step="0.1"
            min="20"
            max="300"
          />

          {/* Heart Rate */}
          <VitalCard
            title={language === 'pt' ? 'Frequência Cardíaca' : 'Heart Rate'}
            icon={<Activity className="h-4 w-4 text-pink-600 dark:text-pink-400" />}
            currentValue={latestVitals?.frequencia_cardiaca?.toString() || null}
            unit="bpm"
            lastDate={formatDate(latestVitals?.data_medicao || null)}
            trend={getTrend(latestVitals?.frequencia_cardiaca || null, previousVitals?.frequencia_cardiaca || null)}
            colorClass="bg-pink-100 dark:bg-pink-900/30"
            inputName="frequencia_cardiaca"
            inputValue={formData.frequencia_cardiaca}
            onInputChange={updateField('frequencia_cardiaca')}
            placeholder="72"
            min="30"
            max="200"
          />

          {/* Blood Sugar */}
          <VitalCard
            title={language === 'pt' ? 'Glicemia' : 'Blood Sugar'}
            icon={<Droplet className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            currentValue={latestVitals?.glicemia?.toString() || null}
            unit="mg/dL"
            lastDate={formatDate(latestVitals?.data_medicao || null)}
            trend={getTrend(latestVitals?.glicemia || null, previousVitals?.glicemia || null)}
            colorClass="bg-purple-100 dark:bg-purple-900/30"
            inputName="glicemia"
            inputValue={formData.glicemia}
            onInputChange={updateField('glicemia')}
            placeholder="100"
            min="20"
            max="600"
          />

          {/* Temperature */}
          <VitalCard
            title={language === 'pt' ? 'Temperatura' : 'Temperature'}
            icon={<Thermometer className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
            currentValue={latestVitals?.temperatura?.toString() || null}
            unit="°C"
            lastDate={formatDate(latestVitals?.data_medicao || null)}
            trend={getTrend(latestVitals?.temperatura || null, previousVitals?.temperatura || null)}
            colorClass="bg-orange-100 dark:bg-orange-900/30"
            inputName="temperatura"
            inputValue={formData.temperatura}
            onInputChange={updateField('temperatura')}
            placeholder="36.5"
            step="0.1"
            min="30"
            max="45"
          />

          {/* Oxygen Saturation */}
          <VitalCard
            title={language === 'pt' ? 'Saturação O₂' : 'Oxygen Saturation'}
            icon={<Wind className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
            currentValue={latestVitals?.saturacao_oxigenio?.toString() || null}
            unit="%"
            lastDate={formatDate(latestVitals?.data_medicao || null)}
            trend={null}
            colorClass="bg-cyan-100 dark:bg-cyan-900/30"
            inputName="saturacao_oxigenio"
            inputValue={formData.saturacao_oxigenio}
            onInputChange={updateField('saturacao_oxigenio')}
            placeholder="98"
            min="70"
            max="100"
          />
        </motion.div>

        {/* Observations */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {language === 'pt' ? 'Observações' : 'Observations'}
            </CardTitle>
            <CardDescription>
              {language === 'pt' 
                ? 'Anotações sobre como você está se sentindo' 
                : 'Notes about how you are feeling'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={language === 'pt' 
                ? 'Ex: Medição após acordar, em jejum...' 
                : 'E.g.: Measurement after waking up, fasting...'}
              value={formData.observacoes}
              onChange={(e) => updateField('observacoes')(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full h-14 text-lg gap-2"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {language === 'pt' ? 'Salvar Sinais Vitais' : 'Save Vital Signs'}
        </Button>

        {/* Tip */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {language === 'pt' 
            ? '💡 Dica: Meça sua pressão sempre no mesmo horário e posição para resultados mais consistentes.' 
            : '💡 Tip: Measure your blood pressure at the same time and position for more consistent results.'}
        </p>
      </main>

      <Navigation />
    </div>
  );
}
