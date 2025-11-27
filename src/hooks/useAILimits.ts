import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "./useSubscription";
import { startOfDay, endOfDay } from "date-fns";

interface AIUsageStats {
  usedToday: number;
  dailyLimit: number;
  canUseAI: boolean;
  isPremium: boolean;
}

/**
 * Hook to manage AI Assistant usage limits
 * 
 * FREE users: 2 AI requests per day (resets at midnight)
 * PREMIUM users: Unlimited AI requests
 * 
 * Tracks usage in app_metrics table with event_name='ai_assistant_query'
 */
export function useAILimits() {
  const { subscription, loading: subLoading } = useSubscription();
  const [stats, setStats] = useState<AIUsageStats>({
    usedToday: 0,
    dailyLimit: 2,
    canUseAI: false,
    isPremium: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAIUsage();
  }, [subscription]);

  const loadAIUsage = async () => {
    if (subLoading) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const planType = subscription?.plan_type || 'free';
      const status = subscription?.status || 'active';
      const isPremium = planType === 'premium' && status === 'active';

      // Premium users have unlimited AI
      if (isPremium) {
        setStats({
          usedToday: 0,
          dailyLimit: Infinity,
          canUseAI: true,
          isPremium: true,
        });
        setIsLoading(false);
        return;
      }

      // Free users: count today's AI requests
      const today = new Date();
      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      const { count, error } = await supabase
        .from('app_metrics')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_name', 'ai_assistant_query')
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      if (error) throw error;

      const usedToday = count || 0;
      const dailyLimit = 2;

      setStats({
        usedToday,
        dailyLimit,
        canUseAI: usedToday < dailyLimit,
        isPremium: false,
      });
    } catch (error) {
      console.error('Error loading AI usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Record an AI usage event
   * Should be called AFTER the AI request is made successfully
   */
  const recordAIUsage = async (metadata?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Don't record for premium users (they have unlimited)
      if (stats.isPremium) return;

      await supabase
        .from('app_metrics')
        .insert({
          user_id: user.id,
          event_name: 'ai_assistant_query',
          event_data: metadata || {},
        });

      // Reload usage stats
      await loadAIUsage();
    } catch (error) {
      console.error('Error recording AI usage:', error);
    }
  };

  /**
   * Refresh usage stats manually
   */
  const refresh = loadAIUsage;

  return {
    ...stats,
    isLoading,
    recordAIUsage,
    refresh,
    remainingToday: stats.isPremium ? Infinity : Math.max(0, stats.dailyLimit - stats.usedToday),
  };
}
