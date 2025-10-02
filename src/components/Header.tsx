import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import SubscriptionBadge from "./SubscriptionBadge";
import { ThemeToggle } from "./ThemeToggle";
import logo from "@/assets/horamend-logo.png";

export default function Header() {
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
    <header className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="HoraMed" className="h-8 w-auto" />
            <SubscriptionBadge />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Link to="/perfil" className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground">
                  {userName || "Usuário"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {userEmail}
                </span>
              </div>
              
              <Avatar className="h-10 w-10">
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
