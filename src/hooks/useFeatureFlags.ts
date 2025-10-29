import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface FeatureFlags {
  badges: boolean;
  emergency: boolean;
  prices: boolean;
  advancedDash: boolean;
  interactions: boolean;
  aiStreaming: boolean;
  caregiverHandshake: boolean;
  consultationQR: boolean;
  affiliate: boolean;
  interactionsLite: boolean;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>({
    badges: false,
    emergency: false,
    prices: false,
    advancedDash: false,
    interactions: false,
    aiStreaming: false,
    caregiverHandshake: false,
    consultationQR: false,
    affiliate: false,
    interactionsLite: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("key, enabled, config");

      if (error) throw error;

      if (data) {
        const flagsMap = data.reduce((acc, flag: FeatureFlag) => {
          acc[flag.key as keyof FeatureFlags] = flag.enabled;
          return acc;
        }, {} as FeatureFlags);

        setFlags(flagsMap);
      }
    } catch (error) {
      console.error("Error loading feature flags:", error);
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (feature: keyof FeatureFlags): boolean => {
    return flags[feature] || false;
  };

  return {
    flags,
    loading,
    isEnabled,
    refresh: loadFeatureFlags,
  };
}
