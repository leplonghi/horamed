import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Heart, Send, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAILimits } from "@/hooks/useAILimits";
import PaywallDialog from "./PaywallDialog";
import { Alert, AlertDescription } from "./ui/alert";
import { AffiliateCard } from "./fitness/AffiliateCard";
import { getRecommendations, dismissRecommendation } from "@/lib/affiliateEngine";
import { Badge } from "./ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HealthAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá, sou a Clara. Estou aqui para ajudar você a organizar sua rotina de saúde. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiLimits = useAILimits();
  const [affiliateProduct, setAffiliateProduct] = useState<any>(null);
  const [showAffiliate, setShowAffiliate] = useState(false);

  const quickChips = [
    "Organizar rotina",
    "Ver estoque",
    "Dúvida sobre dose",
    "Ajustar horários"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Limite de requisições atingido. Tente novamente em alguns instantes.");
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast.error("Créditos insuficientes. Por favor, adicione créditos à sua conta.");
          setIsLoading(false);
          return;
        }
        throw new Error("Erro ao processar resposta");
      }

      const data = await response.json();
      const assistantContent = data.response || "Desculpe, não consegui processar sua pergunta.";
      
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);

      // Record successful AI usage
      await aiLimits.recordAIUsage({
        message_length: userMessage.length,
        response_length: assistantContent.length,
      });

      // Check for fitness-related queries and show affiliate recommendation
      const fitnessKeywords = ["treino", "academia", "performance", "energia", "sono", "glp-1", "ozempic", "mounjaro", "bariátrica"];
      const isFitnessQuery = fitnessKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
      
      if (isFitnessQuery) {
        const product = getRecommendations({ type: "AI_QUERY", text: userMessage });
        if (product) {
          setAffiliateProduct(product);
          setShowAffiliate(true);
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erro ao processar mensagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check AI limits for Free users
    if (!aiLimits.canUseAI) {
      setShowPaywall(true);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    await streamChat(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 animate-scale-in"
          size="icon"
        >
          <Heart className="h-6 w-6" />
        </Button>
        <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} feature="ai_agent" />
      </>
    );
  }

  return (
    <>
      <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Clara</h3>
              <p className="text-xs opacity-80">Assistente HoraMed</p>
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

        {/* AI Limit Warning (Free users) */}
        {!aiLimits.isPremium && !aiLimits.isLoading && (
          <Alert className="m-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs">
              {aiLimits.canUseAI ? (
                <span>
                  Você tem <strong>{aiLimits.remainingToday}</strong> de {aiLimits.dailyLimit} consultas restantes hoje
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  Limite diário atingido. Assine Premium para consultas ilimitadas.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {/* Affiliate Recommendation */}
            {showAffiliate && affiliateProduct && (
              <div className="px-4">
                <AffiliateCard 
                  product={affiliateProduct}
                  context="AI_QUERY"
                  onDismiss={() => {
                    dismissRecommendation("AI_QUERY");
                    setShowAffiliate(false);
                  }}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Chips */}
        <div className="px-4 py-2 border-t">
          <div className="flex gap-2 flex-wrap">
            {quickChips.map((chip, idx) => (
              <Badge 
                key={idx}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                onClick={() => setInput(chip)}
              >
                {chip}
              </Badge>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={aiLimits.canUseAI ? "Digite sua mensagem..." : "Limite diário atingido"}
              disabled={isLoading || !aiLimits.canUseAI}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !aiLimits.canUseAI}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} feature="ai_agent" />
    </>
  );
}
