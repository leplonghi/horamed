import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

const flagLabels = {
  badges: "Badges e Conquistas",
  emergency: "Orientações de Emergência",
  prices: "Comparação de Preços",
  advancedDash: "Dashboard Avançado",
  interactions: "Análise de Interações",
  aiStreaming: "IA com Streaming",
  caregiverHandshake: "Handshake Cuidador",
  consultationQR: "Cartão de Consulta QR",
  affiliate: "Links Afiliados",
  interactionsLite: "IA Educativa Lite"
};

export default function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('key, enabled');

      if (error) throw error;

      const flagsMap = data?.reduce((acc, flag) => {
        acc[flag.key] = flag.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      setFlags(flagsMap || {});
    } catch (error) {
      console.error('Error loading flags:', error);
      toast({
        title: 'Erro ao carregar flags',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (key: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      setFlags(prev => ({ ...prev, [key]: enabled }));
      
      toast({
        title: enabled ? 'Feature ativada' : 'Feature desativada',
        description: `${flagLabels[key as keyof typeof flagLabels]} foi ${enabled ? 'ativada' : 'desativada'}`
      });
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast({
        title: 'Erro ao atualizar flag',
        description: 'Não foi possível atualizar a configuração',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Carregando configurações...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Feature Flags</h3>
      </div>

      <div className="space-y-4">
        {Object.entries(flagLabels).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor={key} className="cursor-pointer">
              {label}
            </Label>
            <Switch
              id={key}
              checked={flags[key] || false}
              onCheckedChange={(checked) => toggleFlag(key, checked)}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
