import { useState, useEffect } from "react";
import { useStreakCalculator } from "./useStreakCalculator";

export type MilestoneType = 7 | 30 | 90;

interface MilestoneState {
  milestone: MilestoneType | null;
  isNew: boolean;
}

const MILESTONE_KEY = "horamed_last_milestone";

export function useMilestoneDetector() {
  const { currentStreak } = useStreakCalculator();
  const [milestoneState, setMilestoneState] = useState<MilestoneState>({
    milestone: null,
    isNew: false,
  });

  useEffect(() => {
    checkForNewMilestone();
  }, [currentStreak]);

  const checkForNewMilestone = () => {
    const lastMilestone = parseInt(localStorage.getItem(MILESTONE_KEY) || "0");
    
    // Check for 90-day milestone
    if (currentStreak >= 90 && lastMilestone < 90) {
      setMilestoneState({ milestone: 90, isNew: true });
      return;
    }
    
    // Check for 30-day milestone
    if (currentStreak >= 30 && lastMilestone < 30) {
      setMilestoneState({ milestone: 30, isNew: true });
      return;
    }
    
    // Check for 7-day milestone
    if (currentStreak >= 7 && lastMilestone < 7) {
      setMilestoneState({ milestone: 7, isNew: true });
      return;
    }
  };

  const markMilestoneAsSeen = () => {
    if (milestoneState.milestone) {
      localStorage.setItem(MILESTONE_KEY, milestoneState.milestone.toString());
      setMilestoneState({ milestone: null, isNew: false });
    }
  };

  const resetMilestone = () => {
    setMilestoneState({ milestone: null, isNew: false });
  };

  return {
    milestone: milestoneState.milestone,
    isNewMilestone: milestoneState.isNew,
    markAsSeen: markMilestoneAsSeen,
    reset: resetMilestone,
  };
}
