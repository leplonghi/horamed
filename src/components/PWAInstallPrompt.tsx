import { useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const { t } = useLanguage();
  const {
    canInstall,
    isInstalled,
    isIOS,
    showPrompt,
    triggerInstall,
    requestShowPrompt,
    dismissPrompt,
    hidePrompt,
  } = usePWAInstall();

  // Auto-show prompt immediately on first visit
  useEffect(() => {
    // Show immediately when ready
    const timer = setTimeout(() => {
      if (!isInstalled) {
        // For iOS, always try to show
        // For others, wait for canInstall
        if (isIOS || canInstall) {
          requestShowPrompt();
        }
      }
    }, 800); // Show after 0.8 seconds

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, requestShowPrompt]);

  // Also try again after a longer delay in case beforeinstallprompt fires late
  useEffect(() => {
    if (isInstalled) return;
    
    const timer = setTimeout(() => {
      if ((canInstall || isIOS) && !showPrompt) {
        requestShowPrompt();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, showPrompt, requestShowPrompt]);

  // Don't render if installed or shouldn't show
  if (isInstalled || !showPrompt) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support automatic install, just hide the prompt
      hidePrompt();
    } else {
      await triggerInstall();
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={hidePrompt}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with close button */}
              <div className="relative p-4 pb-0">
                <button
                  onClick={hidePrompt}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 pt-2 text-center">
                {/* App Icon */}
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl flex items-center justify-center mb-4 shadow-xl ring-4 ring-primary/20">
                  <img 
                    src="/favicon.png" 
                    alt="HoraMed" 
                    className="w-12 h-12"
                  />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {t('pwa.installTitle')}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4">
                  {t('pwa.installDesc')}
                </p>

                {/* Benefits */}
                <div className="flex justify-center gap-4 mb-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="text-primary">✓</span>
                    <span>{t('pwa.benefitFast')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-primary">✓</span>
                    <span>{t('pwa.benefitOffline')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-primary">✓</span>
                    <span>{t('pwa.benefitNotify')}</span>
                  </div>
                </div>

                {/* iOS Instructions */}
                {isIOS ? (
                  <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm font-medium text-foreground mb-3">
                      {t('pwa.iosInstructions')}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Share className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('pwa.iosTapShare')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('pwa.iosAddHome')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  {!isIOS && (
                    <Button
                      onClick={handleInstall}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {t('pwa.install')}
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    {t('pwa.notNow')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
