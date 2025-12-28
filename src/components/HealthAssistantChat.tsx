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
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface HealthAssistantChatProps {
  onClose?: () => void;
}

export default function HealthAssistantChat({ onClose }: HealthAssistantChatProps = {}) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiLimits = useAILimits();
  const [affiliateProduct, setAffiliateProduct] = useState<any>(null);
  const [showAffiliate, setShowAffiliate] = useState(false);

  // Initialize greeting message with translation
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: t('chat.greeting'),
      }]);
    }
  }, [t]);

  const quickChips = [
    t('chat.organizeRoutine'),
    t('chat.viewStock'),
    t('chat.doseQuestion'),
    t('chat.adjustSchedules')
  ];

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
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
          toast.error(t('chat.rateLimitError'));
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast.error(t('chat.creditsError'));
          setIsLoading(false);
          return;
        }
        throw new Error(t('chat.processingError'));
      }

      const data = await response.json();
      const assistantContent = data.response || t('chat.fallbackResponse');
      
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);

      await aiLimits.recordAIUsage({
        message_length: userMessage.length,
        response_length: assistantContent.length,
      });

      const fitnessKeywords = ["treino", "academia", "performance", "energia", "sono", "glp-1", "ozempic", "mounjaro", "bariátrica", "workout", "gym", "energy", "sleep"];
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
      toast.error(t('chat.messageError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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

  const handleClose = () => {
    onClose?.();
  };

  return (
    <>
      <Card className="fixed inset-4 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:h-[500px] h-[calc(100vh-2rem)] shadow-xl z-50 flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-primary text-primary-foreground rounded-t-lg shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Clara</h3>
              <p className="text-xs opacity-80">{t('chat.assistant')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* AI Limit Warning (Free users) */}
        {!aiLimits.isPremium && !aiLimits.isLoading && (
          <Alert className="mx-2 mt-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 shrink-0">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs">
              {aiLimits.canUseAI ? (
                <span>
                  {t('chat.youHave')} <strong>{aiLimits.remainingToday}</strong> {t('chat.of')} {aiLimits.dailyLimit} {t('chat.queriesRemaining')}
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  {t('chat.dailyLimitReached')}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 sm:p-4 min-h-0" ref={scrollRef}>
          <div className="space-y-3 sm:space-y-4">
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
                    "max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm leading-relaxed",
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
              <div className="px-2 sm:px-4">
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
        <div className="px-3 sm:px-4 py-2 border-t shrink-0">
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {quickChips.map((chip, idx) => (
              <Badge 
                key={idx}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors text-xs px-2 py-0.5"
                onClick={() => setInput(chip)}
              >
                {chip}
              </Badge>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={aiLimits.canUseAI ? t('chat.placeholder') : t('chat.limitReached')}
              disabled={isLoading || !aiLimits.canUseAI}
              className="flex-1 text-base sm:text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !aiLimits.canUseAI}
              size="icon"
              className="shrink-0"
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