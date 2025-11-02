import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, TrendingUp, Stethoscope, History } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SubscriptionBadge from "./SubscriptionBadge";
import { ThemeToggle } from "./ThemeToggle";
import ProfileSelector from "./ProfileSelector";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/horamend-logo.png";

export default function Header() {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");

      // Try to get Google avatar first
      const googleAvatar = user.user_metadata?.avatar_url;
      
      // Load profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        // Prefer custom avatar, fallback to Google avatar
        setAvatarUrl(profile.avatar_url || googleAvatar || null);
        setUserName(profile.nickname || profile.full_name || null);
      } else if (googleAvatar) {
        setAvatarUrl(googleAvatar);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-b border-border z-40 shadow-sm animate-slide-up">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <img src={logo} alt="HoraMed" className="h-8 w-auto hover:scale-105 transition-transform duration-300" />
            <SubscriptionBadge />
          </div>

          <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:scale-105 transition-transform">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Histórico</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 animate-fade-in-scale bg-background/95 backdrop-blur-lg border-2">
                <DropdownMenuLabel>Histórico Médico</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/timeline")} className="gap-2 cursor-pointer hover:bg-accent transition-colors">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Linha do Tempo</div>
                    <div className="text-xs text-muted-foreground">Histórico cronológico</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/evolucao")} className="gap-2 cursor-pointer hover:bg-accent transition-colors">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">Evolução</div>
                    <div className="text-xs text-muted-foreground">Gráficos e análises</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/agenda")} className="gap-2 cursor-pointer hover:bg-accent transition-colors">
                  <Stethoscope className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">Agenda Médica</div>
                    <div className="text-xs text-muted-foreground">Consultas agendadas</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ProfileSelector />
            <ThemeToggle />
            
            <Link to="/perfil" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {userName || "Usuário"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {userEmail}
                </span>
              </div>
              
              <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary transition-all duration-300">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userEmail ? getInitials(userEmail) : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
