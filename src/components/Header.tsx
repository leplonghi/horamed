import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SubscriptionBadge from "./SubscriptionBadge";
import { ThemeToggle } from "./ThemeToggle";
import ProfileSelector from "./ProfileSelector";
import SpotlightSearch from "./SpotlightSearch";

import logo from "@/assets/horamed-logo-transparent.png";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const {
    user
  } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const {
    profiles,
    activeProfile
  } = useUserProfiles();

  // Keyboard shortcut for Spotlight (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  const loadUserData = async () => {
    try {
      if (!user) return;
      setUserEmail(user.email || "");

      // Try to get Google avatar first
      const googleAvatar = user.user_metadata?.avatar_url;

      // Load profile data
      const {
        data: profile
      } = await supabase.from("profiles").select("avatar_url, nickname, full_name").eq("user_id", user.id).maybeSingle();
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
    <header className="fixed top-0 left-0 right-0 z-50 animate-slide-up pt-[env(safe-area-inset-top)]">
      <div className="absolute inset-0 bg-gradient-to-b from-card/95 via-card/90 to-card/85 backdrop-blur-xl border-b border-border/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/[0.02]" />
      <div className="relative max-w-4xl mx-auto py-2 px-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Logo + badges */}
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src={logo}
              alt="HoraMed"
              width={44}
              height={40}
              className="h-10 w-auto shrink-0"
              loading="eager"
            />
            <SubscriptionBadge />
            
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSpotlightOpen(true)}
              className="h-8 w-8 text-muted-foreground"
            >
              <Search className="h-4 w-4" />
            </Button>

            <ProfileSelector />
            <ThemeToggle />

            <Link to="/perfil" className="shrink-0">
              <Avatar className="h-8 w-8 ring-1 ring-border">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userEmail ? getInitials(userEmail) : <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      <SpotlightSearch open={spotlightOpen} onOpenChange={setSpotlightOpen} />
    </header>
  );
}