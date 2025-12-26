import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHealthAgent } from "@/hooks/useHealthAgent";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import claraAvatar from "@/assets/clara-avatar.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickSuggestions = [
  "Como adiciono um medicamento?",
  "Qual meu progresso de hoje?",
  "Onde vejo meu estoque?",
  "Como funciona a Carteira de Saúde?",
];

export default function HealthAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Olá! Sou a Clara, sua assistente de saúde. Posso ajudar você a navegar no app, verificar seus medicamentos, conferir seu progresso ou tirar dúvidas sobre sua rotina. Como posso ajudar?"
  }]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const {
    processQuery,
    isProcessing
  } = useHealthAgent();
  const location = useLocation();

  // Listen for external open events (from QuickActionMenu)
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
        content: "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?"
      }]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <>
      {/* Floating Clara Avatar Button - positioned to avoid overlap */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            onClick={() => setIsOpen(true)} 
            className="fixed bottom-20 right-4 z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            aria-label="Clara - Assistente de Saúde"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/30 shadow-lg">
                <img 
                  src={claraAvatar} 
                  alt="Clara" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Clara Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-xl border">
              {/* Header */}
              <div className="bg-primary p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary-foreground/30">
                      <img src={claraAvatar} alt="Clara" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-foreground">Clara</h3>
                      <p className="text-xs text-primary-foreground/80">Assistente HoraMed</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)} 
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[350px] p-4">
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
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Sugestões rápidas:</p>
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
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSend()} 
                    placeholder="Digite sua mensagem..." 
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
        )}
      </AnimatePresence>
    </>
  );
}
