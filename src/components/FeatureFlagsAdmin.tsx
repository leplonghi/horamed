import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  const flagLabels: Record<string, string> = {
    badges: t('featureFlags.badges'),
    emergency: t('featureFlags.emergency'),
    prices: t('featureFlags.prices'),
    advancedDash: t('featureFlags.advancedDash'),
    interactions: t('featureFlags.interactions'),
    aiStreaming: t('featureFlags.aiStreaming'),
    caregiverHandshake: t('featureFlags.caregiverHandshake'),
    consultationQR: t('featureFlags.consultationQR'),
    affiliate: t('featureFlags.affiliate'),
    interactionsLite: t('featureFlags.interactionsLite')
  };

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
        title: t('featureFlags.loadError'),
        description: t('featureFlags.loadErrorDesc'),
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
        title: enabled ? t('featureFlags.activated') : t('featureFlags.deactivated'),
        description: `${flagLabels[key]} ${enabled ? t('featureFlags.wasActivated') : t('featureFlags.wasDeactivated')}`
      });
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast({
        title: t('featureFlags.updateError'),
        description: t('featureFlags.updateErrorDesc'),
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">{t('featureFlags.loading')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('featureFlags.title')}</h3>
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