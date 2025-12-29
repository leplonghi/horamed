import { useCallback } from 'react';

export type NotificationType = 'gentle' | 'normal' | 'urgent' | 'critical';

interface NotificationConfig {
  type: NotificationType;
  title: string;
  icon: string;
  sound: string;
  color: string;
  priority: 'low' | 'default' | 'high' | 'max';
  vibrationPattern: number[];
  repeatInterval?: number; // minutes to repeat if not acknowledged
}

const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  gentle: {
    type: 'gentle',
    title: '💊 Lembrete de medicamento',
    icon: 'pill',
    sound: 'gentle',
    color: '#10B981',
    priority: 'default',
    vibrationPattern: [0, 200],
  },
  normal: {
    type: 'normal',
    title: '💊 Hora do remédio',
    icon: 'pill',
    sound: 'default',
    color: '#7C3AED',
    priority: 'high',
    vibrationPattern: [0, 300, 100, 300],
  },
  urgent: {
    type: 'urgent',
    title: '⏰ Atenção: Hora do remédio!',
    icon: 'alert',
    sound: 'urgent',
    color: '#F59E0B',
    priority: 'high',
    vibrationPattern: [0, 400, 100, 400, 100, 400],
    repeatInterval: 5,
  },
  critical: {
    type: 'critical',
    title: '🚨 URGENTE: Medicamento importante!',
    icon: 'critical',
    sound: 'alarm',
    color: '#EF4444',
    priority: 'max',
    vibrationPattern: [0, 500, 100, 500, 100, 500, 100, 500],
    repeatInterval: 3,
  },
};

// Time-based notification type determination
const getTimeBasedNotificationType = (hour: number): NotificationType => {
  // Early morning (5-7): Gentle wake-up
  if (hour >= 5 && hour < 7) return 'gentle';
  
  // Morning (7-12): Normal
  if (hour >= 7 && hour < 12) return 'normal';
  
  // Afternoon (12-18): Normal
  if (hour >= 12 && hour < 18) return 'normal';
  
  // Evening (18-21): Normal
  if (hour >= 18 && hour < 21) return 'normal';
  
  // Night (21-23): Gentle
  if (hour >= 21 && hour < 23) return 'gentle';
  
  // Late night/early morning (23-5): Very gentle or skip
  return 'gentle';
};

// Medication importance-based adjustments
const getMedicationImportanceType = (
  category: string | null,
  notes: string | null
): NotificationType | null => {
  const importantCategories = ['antibiotic', 'antibiotico', 'controlled', 'controlado', 'essential', 'essencial'];
  const urgentKeywords = ['crítico', 'critical', 'urgente', 'urgent', 'importante', 'important'];
  
  const categoryLower = category?.toLowerCase() || '';
  const notesLower = notes?.toLowerCase() || '';
  
  // Check for critical keywords
  if (urgentKeywords.some(k => notesLower.includes(k))) {
    return 'critical';
  }
  
  // Check for important categories
  if (importantCategories.some(c => categoryLower.includes(c))) {
    return 'urgent';
  }
  
  return null;
};

export const useNotificationTypes = () => {
  // Determine notification type based on time and medication
  const getNotificationType = useCallback((
    scheduledTime: Date,
    medication?: {
      category?: string | null;
      notes?: string | null;
      notification_type?: string | null;
    }
  ): NotificationConfig => {
    // If medication has explicit notification type, use it
    if (medication?.notification_type && medication.notification_type in NOTIFICATION_CONFIGS) {
      return NOTIFICATION_CONFIGS[medication.notification_type as NotificationType];
    }
    
    // Check medication importance
    const importanceType = getMedicationImportanceType(
      medication?.category || null,
      medication?.notes || null
    );
    
    if (importanceType) {
      return NOTIFICATION_CONFIGS[importanceType];
    }
    
    // Default to time-based
    const hour = scheduledTime.getHours();
    const timeBasedType = getTimeBasedNotificationType(hour);
    
    return NOTIFICATION_CONFIGS[timeBasedType];
  }, []);

  // Get all notification configs for UI selection
  const getAllNotificationTypes = useCallback(() => {
    return Object.values(NOTIFICATION_CONFIGS).map(config => ({
      value: config.type,
      label: getNotificationTypeLabel(config.type),
      description: getNotificationTypeDescription(config.type),
      color: config.color,
    }));
  }, []);

  return {
    getNotificationType,
    getAllNotificationTypes,
    NOTIFICATION_CONFIGS,
  };
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    gentle: 'Suave',
    normal: 'Normal',
    urgent: 'Urgente',
    critical: 'Crítico',
  };
  return labels[type];
};

export const getNotificationTypeDescription = (type: NotificationType): string => {
  const descriptions: Record<NotificationType, string> = {
    gentle: 'Notificação discreta, ideal para horários tranquilos',
    normal: 'Notificação padrão com som e vibração',
    urgent: 'Notificação com mais ênfase, repete a cada 5 min',
    critical: 'Alarme persistente, repete até confirmação',
  };
  return descriptions[type];
};

export { NOTIFICATION_CONFIGS };
