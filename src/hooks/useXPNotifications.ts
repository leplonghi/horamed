import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface XPNotificationConfig {
  showToast?: boolean;
  onLevelUp?: (newLevel: number, xpEarned: number) => void;
}

// XP values for different actions
const XP_VALUES = {
  DOSE_TAKEN: 10,
  DOSE_ON_TIME: 5, // bonus
  PERFECT_DAY: 50,
  STREAK_BONUS: 20,
} as const;

// Level thresholds
const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450
];

export function useXPNotifications(config: XPNotificationConfig = {}) {
  const { language } = useLanguage();
  const { showToast = true, onLevelUp } = config;
  const [currentXP, setCurrentXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const previousLevelRef = useRef(1);

  const t = {
    xpEarned: language === 'pt' ? 'XP ganhos!' : 'XP earned!',
    bonusOnTime: language === 'pt' ? 'Bônus: no horário!' : 'Bonus: on time!',
    perfectDay: language === 'pt' ? 'Dia perfeito!' : 'Perfect day!',
    streakBonus: language === 'pt' ? 'Bônus de sequência!' : 'Streak bonus!',
  };

  const calculateLevel = useCallback((xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }, []);

  const awardXP = useCallback((amount: number, reason?: string) => {
    setCurrentXP(prev => {
      const newXP = prev + amount;
      const newLevel = calculateLevel(newXP);
      
      if (newLevel > previousLevelRef.current) {
        previousLevelRef.current = newLevel;
        setCurrentLevel(newLevel);
        onLevelUp?.(newLevel, amount);
      }
      
      return newXP;
    });

    if (showToast) {
      const message = reason ? `+${amount} ${t.xpEarned} ${reason}` : `+${amount} ${t.xpEarned}`;
      toast.success(message, {
        icon: '⚡',
        duration: 2000,
      });
    }
  }, [showToast, calculateLevel, onLevelUp, t.xpEarned]);

  const awardDoseXP = useCallback((isOnTime: boolean = false) => {
    let totalXP = XP_VALUES.DOSE_TAKEN;
    let reason = '';
    
    if (isOnTime) {
      totalXP += XP_VALUES.DOSE_ON_TIME;
      reason = t.bonusOnTime;
    }
    
    awardXP(totalXP, reason);
  }, [awardXP, t.bonusOnTime]);

  const awardPerfectDayXP = useCallback(() => {
    awardXP(XP_VALUES.PERFECT_DAY, t.perfectDay);
  }, [awardXP, t.perfectDay]);

  const awardStreakBonusXP = useCallback(() => {
    awardXP(XP_VALUES.STREAK_BONUS, t.streakBonus);
  }, [awardXP, t.streakBonus]);

  return {
    currentXP,
    currentLevel,
    awardXP,
    awardDoseXP,
    awardPerfectDayXP,
    awardStreakBonusXP,
    XP_VALUES,
  };
}
