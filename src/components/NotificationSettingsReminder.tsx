import { useState, useEffect } from 'react';
import { Bell, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const REMINDER_INTERVAL_DAYS = 7; // Show reminder every 7 days
const STORAGE_KEY = 'notification_settings_reminder';

interface ReminderState {
  lastDismissed: string | null;
  configured: boolean;
}

export function NotificationSettingsReminder() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const t = {
    title: language === 'pt' ? 'Configure seus alarmes' : 'Set up your alarms',
    description: language === 'pt' 
      ? 'Ajuste suas notificações para nunca perder um medicamento'
      : 'Adjust your notifications to never miss a medication',
    configure: language === 'pt' ? 'Configurar' : 'Configure',
    later: language === 'pt' ? 'Depois' : 'Later',
  };

  useEffect(() => {
    checkShouldShow();
  }, []);

  const checkShouldShow = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // First time - show after 1 day of use
        const firstUse = localStorage.getItem('app_first_use');
        if (!firstUse) {
          localStorage.setItem('app_first_use', new Date().toISOString());
          return;
        }
        const daysSinceFirst = (Date.now() - new Date(firstUse).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceFirst >= 1) {
          setShow(true);
        }
        return;
      }

      const state: ReminderState = JSON.parse(stored);
      
      // If user marked as configured, don't show
      if (state.configured) return;

      // Check if enough time has passed since last dismissal
      if (state.lastDismissed) {
        const daysSinceDismissed = (Date.now() - new Date(state.lastDismissed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed >= REMINDER_INTERVAL_DAYS) {
          setShow(true);
        }
      }
    } catch {
      // If error, don't show
    }
  };

  const handleDismiss = () => {
    const state: ReminderState = {
      lastDismissed: new Date().toISOString(),
      configured: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setShow(false);
  };

  const handleConfigure = () => {
    const state: ReminderState = {
      lastDismissed: new Date().toISOString(),
      configured: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setShow(false);
    navigate('/configuracoes/alarmes');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  {t.title}
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t.description}
                </p>
                
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleConfigure}>
                    {t.configure}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    {t.later}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
