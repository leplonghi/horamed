import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, X, Utensils } from "lucide-react";
import { format } from "date-fns";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

interface DoseItem {
  id: string;
  due_at: string;
  status: string;
  item_id: string;
  items: {
    name: string;
    dose_text: string | null;
    with_food: boolean | null;
  };
}

interface SwipeableDoseCardProps {
  dose: DoseItem;
  onTake: () => void;
  onSkip: () => void;
  isOverdue?: boolean;
  isTaking?: boolean;
  delay?: number;
}

const SWIPE_THRESHOLD = 100;

export default function SwipeableDoseCard({ 
  dose, 
  onTake, 
  onSkip, 
  isOverdue, 
  isTaking, 
  delay = 0 
}: SwipeableDoseCardProps) {
  const time = format(new Date(dose.due_at), "HH:mm");
  const { triggerSuccess, triggerWarning, triggerLight } = useHapticFeedback();
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  
  const x = useMotionValue(0);
  
  // Transform x motion into background colors and opacity
  const rightBackground = useTransform(x, [0, SWIPE_THRESHOLD], ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.15)"]);
  const leftBackground = useTransform(x, [-SWIPE_THRESHOLD, 0], ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0)"]);
  const rightIconOpacity = useTransform(x, [0, SWIPE_THRESHOLD / 2], [0, 1]);
  const leftIconOpacity = useTransform(x, [-SWIPE_THRESHOLD / 2, 0], [1, 0]);
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.2]);
  const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.2, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offsetX = info.offset.x;
    
    if (offsetX > SWIPE_THRESHOLD) {
      // Swipe right - Take
      triggerSuccess();
      setExitDirection("right");
      setIsExiting(true);
      setTimeout(() => onTake(), 200);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      // Swipe left - Skip
      triggerWarning();
      setExitDirection("left");
      setIsExiting(true);
      setTimeout(() => onSkip(), 200);
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    // Trigger light haptic when crossing threshold
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD - 10 && Math.abs(info.offset.x) < SWIPE_THRESHOLD + 10) {
      triggerLight();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
        y: isExiting ? 0 : 0,
        x: isExiting ? (exitDirection === "right" ? 300 : -300) : 0,
        scale: isExiting ? 0.8 : 1
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: isExiting ? 0 : delay, duration: 0.3 }}
      layout
      className="group relative"
    >
      {/* Background indicators */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        {/* Right swipe (Take) indicator */}
        <motion.div 
          className="absolute inset-0 flex items-center pl-4"
          style={{ backgroundColor: rightBackground }}
        >
          <motion.div 
            style={{ opacity: rightIconOpacity, scale: rightIconScale }}
            className="flex items-center gap-2 text-success"
          >
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Tomar</span>
          </motion.div>
        </motion.div>
        
        {/* Left swipe (Skip) indicator */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-end pr-4"
          style={{ backgroundColor: leftBackground }}
        >
          <motion.div 
            style={{ opacity: leftIconOpacity, scale: leftIconScale }}
            className="flex items-center gap-2 text-destructive"
          >
            <span className="font-medium text-sm">Pular</span>
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-6 h-6" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Main card content - draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ cursor: "grabbing" }}
        className={cn(
          "relative rounded-2xl p-4 backdrop-blur-sm transition-colors duration-300",
          "shadow-[var(--shadow-sm)] touch-pan-y select-none",
          isOverdue 
            ? "bg-destructive/5 ring-1 ring-destructive/20" 
            : "bg-card"
        )}
      >
        <div className="flex items-center gap-4">
          {/* Time */}
          <div className={cn(
            "text-center min-w-[3.5rem]",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            <span className="text-2xl font-semibold tracking-tight">{time}</span>
          </div>

          {/* Divider */}
          <div className={cn("w-px h-12", isOverdue ? "bg-destructive/20" : "bg-border")} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">{dose.items.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {dose.items.dose_text && (
                <span className="text-sm text-muted-foreground">{dose.items.dose_text}</span>
              )}
              {dose.items.with_food && (
                <span className="pill-warning text-xs py-0.5">
                  <Utensils className="w-3 h-3" />
                  Com alimento
                </span>
              )}
            </div>
          </div>

          {/* Actions - PRIMARY visible buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onSkip}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"
              aria-label="Pular dose"
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTake}
              disabled={isTaking}
              className={cn(
                "flex items-center gap-2 px-4 h-12 rounded-xl",
                "font-semibold text-white transition-all duration-300",
                "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
                isOverdue ? "bg-destructive hover:bg-destructive/90" : "bg-success hover:bg-success/90",
                isTaking && "opacity-60"
              )}
              aria-label="Marcar como tomado"
            >
              {isTaking ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span className="text-sm">Tomar</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Swipe hint for first-time users */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground/50">← deslize →</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
