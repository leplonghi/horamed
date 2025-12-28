import { Home, Pill, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export default function SimpleNavigation() {
  const location = useLocation();
  const { triggerLight } = useHapticFeedback();

  const navItems = [
    { path: "/hoje", icon: Home, label: "Hoje" },
    { path: "/medicamentos", icon: Pill, label: "Rotina" },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-[60] safe-area-inset-bottom">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => triggerLight()}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-3 px-6 rounded-2xl transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    className="absolute -top-1 w-12 h-1 bg-primary rounded-full"
                    layoutId="nav-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-6 w-6 transition-transform",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-xs font-medium",
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
