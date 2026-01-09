import { useState, useEffect, useMemo } from "react";
import { X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHealthAgent } from "@/hooks/useHealthAgent";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import FloatingActionHub from "./FloatingActionHub";

const claraAvatarUrl = new URL('@/assets/clara-avatar.png', import.meta.url).href;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HealthAIButton() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [hasUnreadSuggestion, setHasUnreadSuggestion] = useState(false);
  const {
    processQuery,
    isProcessing
  } = useHealthAgent();
  const location = useLocation();

  // Initialize welcome message with translation
  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: t('clara.welcomeMessage')
    }]);
  }, [t]);

  // Dynamic quick suggestions based on time of day
  const quickSuggestions = useMemo(() => {
    const hour = new Date().getHours();
    const baseSuggestions = [
      t('clara.addMed'),
      t('clara.myProgress'),
      t('clara.whereStock'),
      t('clara.howWallet'),
    ];
    
    const contextual: string[] = [];
    if (hour < 10) {
      contextual.push(language === 'pt' ? "O que devo tomar pela manhã?" : "What should I take in the morning?");
    } else if (hour >= 12 && hour < 14) {
      contextual.push(language === 'pt' ? "Quais remédios tomo com comida?" : "Which meds do I take with food?");
    } else if (hour >= 20) {
      contextual.push(language === 'pt' ? "Posso tomar todos os da noite juntos?" : "Can I take all my night meds together?");
    }
    
    return [...contextual, ...baseSuggestions].slice(0, 4);
  }, [t, language]);

  // Listen for external open events
  useEffect(() => {
    const handleOpenClara = () => setIsOpen(true);
    window.addEventListener('openClara', handleOpenClara);
    return () => window.removeEventListener('openClara', handleOpenClara);
  }, []);

  // Hide on auth and onboarding pages
  const hiddenRoutes = ["/auth", "/onboarding", "/"];
  const shouldHide = hiddenRoutes.some(route => 
    route === "/" ? location.pathname === "/" : location.pathname.startsWith(route)
  );
  if (shouldHide) return null;

  const handleSend = async (message?: string) => {
    const userMessage = (message || input).trim();
    if (!userMessage || isProcessing) return;
    
    setInput("");
    setShowSuggestions(false);
    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage
    }]);
    
    try {
      const response = await processQuery(userMessage);
      if (typeof response === 'string') {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: response
        }]);
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: t('clara.errorMessage')
      }]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleOpenAssistant = () => {
    setIsOpen(true);
    setHasUnreadSuggestion(false);
  };

  return (
    <>
      {/* Floating Action Hub - unifies Clara + Voice */}
      <FloatingActionHub
        onOpenAssistant={handleOpenAssistant}
        isAssistantOpen={isOpen}
        hasUnreadSuggestion={hasUnreadSuggestion}
      />

      {/* Clara Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:bottom-24 md:right-6 z-50 md:w-[380px] md:max-w-[calc(100vw-3rem)]"
            >
              <Card className="shadow-xl border h-full md:h-auto flex flex-col">
                {/* Header */}
                <div className="bg-primary p-4 rounded-t-lg shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary-foreground/30">
                        <img src={claraAvatarUrl} alt="Clara" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary-foreground">Clara</h3>
                        <p className="text-xs text-primary-foreground/80">{t('clara.assistant')}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsOpen(false)} 
                      className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 md:h-[350px] p-4">
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-foreground'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-2.5">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick Suggestions */}
                {showSuggestions && messages.length <= 1 && (
                  <div className="px-4 pb-3 space-y-2 shrink-0">
                    <p className="text-xs text-muted-foreground font-medium">{t('clara.quickSuggestions')}</p>
                    <div className="flex flex-col gap-1.5">
                      {quickSuggestions.map((suggestion, idx) => (
                        <Button 
                          key={idx} 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs justify-start h-auto py-2 px-3 text-left hover:bg-primary/10 border border-border/50"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t shrink-0">
                  <div className="flex gap-2">
                    <Input 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSend()} 
                      placeholder={t('clara.typeMessage')} 
                      disabled={isProcessing} 
                      className="flex-1" 
                    />
                    <Button 
                      onClick={() => handleSend()} 
                      disabled={!input.trim() || isProcessing} 
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
