import { useEffect, useState } from 'react';
import { X, Download, Share, Plus, Smartphone, ChevronUp } from 'lucide-react';
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
    isAndroid,
    isStandalone,
    showPrompt,
    triggerInstall,
    requestShowPrompt,
    dismissPrompt,
    hidePrompt,
  } = usePWAInstall();

  const [iosStep, setIosStep] = useState(1);

  // Auto-show prompt after short delay for first-time visitors
  useEffect(() => {
    // Don't show if already installed or in standalone mode
    if (isInstalled || isStandalone) return;

    const timer = setTimeout(() => {
      if (isIOS || canInstall) {
        requestShowPrompt();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, isStandalone, requestShowPrompt]);

  // Retry after longer delay if beforeinstallprompt fires late
  useEffect(() => {
    if (isInstalled || isStandalone) return;
    
    const timer = setTimeout(() => {
      if ((canInstall || isIOS) && !showPrompt) {
        requestShowPrompt();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, isStandalone, showPrompt, requestShowPrompt]);

  // Don't render if installed, standalone mode, or shouldn't show
  if (isInstalled || isStandalone || !showPrompt) {
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

  const nextIosStep = () => {
    if (iosStep < 3) {
      setIosStep(prev => prev + 1);
    } else {
      hidePrompt();
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={hidePrompt}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-4 md:w-[420px] z-[100] md:rounded-2xl overflow-hidden"
          >
            <div className="bg-card border-t md:border border-border rounded-t-3xl md:rounded-2xl shadow-2xl">
              {/* Handle bar for mobile */}
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header with close button */}
              <div className="relative px-6 pt-2 md:pt-4">
                <button
                  onClick={hidePrompt}
                  className="absolute top-2 right-4 md:top-3 md:right-4 p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label={t('common.close')}
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-8 pt-2 text-center">
                {/* App Icon */}
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-[28px] flex items-center justify-center mb-5 shadow-xl shadow-primary/30 ring-4 ring-primary/20">
                  <img 
                    src="/favicon.png" 
                    alt="HoraMed" 
                    className="w-14 h-14"
                  />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t('pwa.installTitle')}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-base mb-5">
                  {t('pwa.installDesc')}
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-1 gap-3 mb-6 text-left">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Funciona como app</p>
                      <p className="text-xs text-muted-foreground">Abre fora do navegador</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-500 text-lg">🔔</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Lembretes direto no celular</p>
                      <p className="text-xs text-muted-foreground">Nunca esqueça seus medicamentos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 text-lg">⚡</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Acesso rápido</p>
                      <p className="text-xs text-muted-foreground">Ícone na tela inicial</p>
                    </div>
                  </div>
                </div>

                {/* iOS Instructions - Step by Step */}
                {isIOS ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl p-5 mb-6 text-left border border-blue-200/50 dark:border-blue-800/50">
                    <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {iosStep}
                      </span>
                      {iosStep === 1 && 'Toque no botão Compartilhar'}
                      {iosStep === 2 && 'Role a lista e encontre'}
                      {iosStep === 3 && 'Confirme a instalação'}
                    </p>
                    
                    <div className="space-y-4">
                      {iosStep === 1 && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-center gap-4"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                            <Share className="h-7 w-7 text-blue-500" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-foreground font-medium">
                              Botão na barra do Safari
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Quadrado com seta para cima
                            </p>
                          </div>
                        </motion.div>
                      )}
                      
                      {iosStep === 2 && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-center gap-4"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                            <Plus className="h-7 w-7 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-foreground font-medium">
                              "Adicionar à Tela de Início"
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Role para baixo na lista
                            </p>
                          </div>
                        </motion.div>
                      )}
                      
                      {iosStep === 3 && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-center gap-4"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg flex items-center justify-center">
                            <img src="/favicon.png" alt="" className="w-8 h-8" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-foreground font-medium">
                              Toque em "Adicionar"
                            </p>
                            <p className="text-xs text-muted-foreground">
                              No canto superior direito
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-4">
                      {[1, 2, 3].map(step => (
                        <button
                          key={step}
                          onClick={() => setIosStep(step)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            step === iosStep 
                              ? 'bg-primary w-6' 
                              : step < iosStep 
                                ? 'bg-primary/60' 
                                : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  {isIOS ? (
                    <Button
                      onClick={nextIosStep}
                      className="w-full h-14 text-lg font-semibold rounded-xl"
                      size="lg"
                    >
                      {iosStep < 3 ? (
                        <>
                          Próximo passo
                          <ChevronUp className="h-5 w-5 ml-2 rotate-90" />
                        </>
                      ) : (
                        'Entendi!'
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleInstall}
                      className="w-full h-14 text-lg font-semibold rounded-xl"
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Instalar App
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground h-12"
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