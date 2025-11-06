import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import SubscriptionBadge from "./SubscriptionBadge";
import { ThemeToggle } from "./ThemeToggle";
import ProfileSelector from "./ProfileSelector";
import logo from "@/assets/horamed-logo.png";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string | null>(null);
  const { profiles, activeProfile } = useUserProfiles();

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
    <header className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-b border-border z-50 shadow-sm animate-slide-up">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <img src={logo} alt="HoraMed" className="h-10 w-auto hover:scale-105 transition-transform duration-300" />
            <SubscriptionBadge />
          </div>

          <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <ProfileSelector />
            
            {/* Active Profile Indicator */}
            {activeProfile && profiles.length > 1 && (
              <Badge 
                variant="outline" 
                className="hidden sm:flex items-center gap-1.5 bg-primary/10 border-primary/30 text-primary px-3 py-1 animate-fade-in"
              >
                <UserCircle2 className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{activeProfile.name}</span>
              </Badge>
            )}
            
            <ThemeToggle />
            
            <Link to="/perfil" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {profiles.length > 1 ? getInitials(userName || userEmail) : (userName || "Usuário")}
                </span>
                {profiles.length <= 1 && (
                  <span className="text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                )}
              </div>
              
              <Avatar className="h-8 w-8 md:h-10 md:w-10 ring-2 ring-transparent group-hover:ring-primary transition-all duration-300">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userEmail ? getInitials(userEmail) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
