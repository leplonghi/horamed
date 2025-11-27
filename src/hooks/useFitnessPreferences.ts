import { useState, useEffect } from "react";

interface FitnessPreferences {
  showFitnessWidgets: boolean;
}

const STORAGE_KEY = "horamed_fitness_preferences";

const DEFAULT_PREFERENCES: FitnessPreferences = {
  showFitnessWidgets: true,
};

export function useFitnessPreferences() {
  const [preferences, setPreferences] = useState<FitnessPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save fitness preferences:", error);
    }
  }, [preferences]);

  const toggleFitnessWidgets = () => {
    setPreferences((prev) => ({
      ...prev,
      showFitnessWidgets: !prev.showFitnessWidgets,
    }));
  };

  return {
    preferences,
    toggleFitnessWidgets,
  };
}
