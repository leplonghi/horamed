import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { X, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, useAnimation, PanInfo } from "framer-motion";

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
  const controls = useAnimation();

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

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      await controls.start({ 
        x: info.offset.x > 0 ? 300 : -300, 
        opacity: 0,
        transition: { duration: 0.2 }
      });
      handleDismiss();
    } else {
      controls.start({ x: 0, opacity: 1 });
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileDrag={{ opacity: 0.8, scale: 0.98 }}
      className={placement === "bottom" ? "mt-4" : "mb-4"}
    >
      <Card className="border-2 border-primary/30 bg-primary/5 overflow-hidden">
        {/* Indicador de swipe */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2" />
        
        <CardContent className="p-4 pt-2">
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/60">
                  Arraste para dispensar
                </span>
                <Button
                  size="sm"
                  onClick={handleDismiss}
                >
                  Entendi
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
