import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHealthAgent } from "@/hooks/useHealthAgent";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HealthAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Sou seu assistente de saúde. Quer revisar sua rotina?"
    }
  ]);
  const [input, setInput] = useState("");
  const { processQuery, isProcessing } = useHealthAgent();
  const location = useLocation();

  // Hide on auth and onboarding pages
  const hiddenRoutes = ["/auth", "/onboarding"];
  const shouldHide = hiddenRoutes.some(route => location.pathname.startsWith(route));

  if (shouldHide) return null;

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await processQuery(userMessage);
      
      if (typeof response === 'string') {
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Desculpe, ocorreu um erro. Tente novamente." 
      }]);
    }
  };

  const quickActions = [
    { label: "Criar lembrete", action: "Quero criar um novo lembrete de medicamento" },
    { label: "Organizar rotina", action: "Me ajude a organizar minha rotina de medicamentos" },
    { label: "Ver estoque", action: "Mostre meu estoque de medicamentos" }
  ];

  return (
    <>
      {/* Floating AI Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-50 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-4 shadow-2xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              boxShadow: [
                "0 10px 30px -10px rgba(168, 85, 247, 0.4)",
                "0 10px 40px -10px rgba(168, 85, 247, 0.6)",
                "0 10px 30px -10px rgba(168, 85, 247, 0.4)",
              ],
            }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              scale: { duration: 0.2 },
              opacity: { duration: 0.2 },
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            aria-label="IA de Saúde"
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2 border-purple-200 dark:border-purple-800">
              {/* Header */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-white" />
                    <h3 className="font-semibold text-white">IA de Saúde</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Ações rápidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(action.action);
                          handleSend();
                        }}
                        className="text-xs"
                      >
                        {action.label}
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
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite sua mensagem..."
                    disabled={isProcessing}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    size="icon"
                    className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Respostas curtas e ações diretas
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
