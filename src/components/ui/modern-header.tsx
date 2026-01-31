import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Search, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import ProfileSelector from "@/components/ProfileSelector";
import SpotlightSearch from "@/components/SpotlightSearch";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

function ModernHeader() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [spotlightOpen, setSpotlightOpen] = useState(false);

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
      const googleAvatar = user.user_metadata?.avatar_url;

      supabase
        .from("profiles")
        .select("avatar_url, nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setAvatarUrl(data?.avatar_url || googleAvatar || null);
          setUserName(data?.nickname || data?.full_name || "");
        });
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === "pt" ? "Bom dia" : "Good morning";
    if (hour < 18) return language === "pt" ? "Boa tarde" : "Good afternoon";
    return language === "pt" ? "Boa noite" : "Good evening";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      {/* Gradient Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-transparent backdrop-blur-2xl" />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative max-w-4xl mx-auto py-3 px-4"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Greeting + Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/perfil" className="shrink-0">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                  <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-sm font-semibold">
                    {getInitials(userName || user?.email || "")}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </Link>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{getGreeting()}</p>
              <p className="text-base font-semibold text-foreground truncate">
                {userName || (language === "pt" ? "Visitante" : "Guest")}
              </p>
            </div>

            <SubscriptionBadge />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSpotlightOpen(true)}
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Search className="h-5 w-5" />
            </Button>

            <ProfileSelector />

            <ThemeToggle />
          </div>
        </div>
      </motion.div>

      <SpotlightSearch open={spotlightOpen} onOpenChange={setSpotlightOpen} />
    </header>
  );
}

export default memo(ModernHeader);
