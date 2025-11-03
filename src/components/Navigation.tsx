import { Home, Calendar, User, Pill, FolderHeart, History } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/hoje", icon: Home, label: "Hoje" },
    { path: "/historico", icon: History, label: "Histórico" },
    { path: "/medicamentos", icon: Pill, label: "Medicamentos" },
    { path: "/cofre", icon: FolderHeart, label: "Cofre" },
    { path: "/mais", icon: User, label: "Mais" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-inset-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] animate-slide-up">
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ animationDelay: `${index * 50}ms` }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 relative group animate-fade-in",
                  isActive
                    ? "text-primary font-semibold scale-110"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-105"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl animate-pulse" />
                )}
                <item.icon
                  className={cn(
                    "h-6 w-6 transition-all duration-300 relative z-10",
                    isActive && "scale-110 drop-shadow-lg",
                    !isActive && "group-hover:scale-110"
                  )}
                />
                <span className={cn(
                  "text-[10px] relative z-10 transition-all duration-300",
                  isActive && "font-bold"
                )}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
