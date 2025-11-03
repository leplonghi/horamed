import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { X, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TutorialHintProps {
  id: string;
  title: string;
  message: string;
  placement?: "top" | "bottom";
}

export default function TutorialHint({ 
  id, 
  title, 
  message, 
  placement = "top" 
}: TutorialHintProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkTutorialStatus();
  }, [id]);

  const checkTutorialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      if (profile && profile.tutorial_flags) {
        const flags = profile.tutorial_flags as Record<string, boolean>;
        if (!flags[id]) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error checking tutorial status:", error);
    }
  };

  const handleDismiss = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const currentFlags = (profile?.tutorial_flags as Record<string, boolean>) || {};
      const newFlags = { ...currentFlags, [id]: true };

      await supabase
        .from("profiles")
        .update({ tutorial_flags: newFlags })
        .eq("user_id", user.id);

      setIsVisible(false);
    } catch (error) {
      console.error("Error dismissing tutorial:", error);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={`border-2 border-primary/30 bg-primary/5 ${
      placement === "bottom" ? "mt-4" : "mb-4"
    }`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm">{title}</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
            <Button
              size="sm"
              onClick={handleDismiss}
              className="mt-2"
            >
              Entendi
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
