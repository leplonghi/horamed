import { Home, CalendarDays, Calendar, User, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Casa" },
    { path: "/rotina", icon: CalendarDays, label: "Rotina" },
    { path: "/calendario", icon: Calendar, label: "Calendário" },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-all",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "scale-110"
                  )}
                />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/adicionar"
            className="flex flex-col items-center justify-center gap-1 px-6 py-2"
          >
            <div className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs text-muted-foreground">Adicionar</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
