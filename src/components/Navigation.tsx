import { Home, Calendar, User, Pill, FolderHeart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/doses", icon: Pill, label: "Doses" },
    { path: "/cofre", icon: FolderHeart, label: "Cofre" },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-inset-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "text-primary font-semibold scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl animate-pulse" />
                )}
                <item.icon
                  className={cn(
                    "h-6 w-6 transition-all duration-200 relative z-10",
                    isActive && "scale-110"
                  )}
                />
                <span className={cn(
                  "text-[10px] relative z-10 transition-all duration-200",
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
