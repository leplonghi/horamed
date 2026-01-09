import { motion } from "framer-motion";
import { Pill, Users, FileText, Crown, Calendar, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

export default function ProfileStatsGrid() {
  const { profiles } = useUserProfiles();
  const { isPremium, daysLeft } = useSubscription();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch items count
  const { data: itemsCount = 0 } = useQuery({
    queryKey: ["profile-items-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { count } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);
      
      return count || 0;
    }
  });

  // Fetch documents count
  const { data: docsCount = 0 } = useQuery({
    queryKey: ["profile-docs-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { count } = await supabase
        .from("documentos_saude")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      return count || 0;
    }
  });

  // Fetch streak
  const { data: currentStreak = 0 } = useQuery({
    queryKey: ["profile-streak"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      // Simplified streak calculation - count consecutive days with taken doses
      const { data: doses } = await supabase
        .from("dose_instances")
        .select("due_at, status")
        .eq("status", "taken")
        .order("due_at", { ascending: false })
        .limit(30);
      
      if (!doses?.length) return 0;
      
      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);
      
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasDose = doses.some(d => d.due_at?.startsWith(dateStr));
        if (hasDose) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (i > 0) {
          break;
        }
      }
      
      return streak;
    }
  });

  const stats: StatItem[] = [
    {
      label: t('profile.activeMeds'),
      value: itemsCount,
      icon: <Pill className="h-5 w-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      onClick: () => navigate('/medicamentos')
    },
    {
      label: t('profile.profiles'),
      value: profiles.length,
      icon: <Users className="h-5 w-5" />,
      color: "text-info",
      bgColor: "bg-info/10",
      onClick: () => {}
    },
    {
      label: t('profile.documents'),
      value: docsCount,
      icon: <FileText className="h-5 w-5" />,
      color: "text-success",
      bgColor: "bg-success/10",
      onClick: () => navigate('/cofre')
    },
    {
      label: isPremium ? "Premium" : t('profile.daysLeft'),
      value: isPremium ? "✓" : (daysLeft || 0),
      icon: isPremium ? <Crown className="h-5 w-5" /> : <Calendar className="h-5 w-5" />,
      color: isPremium ? "text-warning" : "text-muted-foreground",
      bgColor: isPremium ? "bg-warning/10" : "bg-muted",
      onClick: () => navigate('/planos')
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-4 gap-2"
    >
      {stats.map((stat, index) => (
        <motion.button
          key={index}
          variants={itemVariants}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={stat.onClick}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 rounded-2xl",
            "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm",
            "border border-border/30 hover:border-border/50",
            "shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)]",
            "transition-all duration-200"
          )}
        >
          <div className={cn("p-2 rounded-xl", stat.bgColor)}>
            <div className={stat.color}>{stat.icon}</div>
          </div>
          <span className={cn("text-lg font-bold", stat.color)}>{stat.value}</span>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">
            {stat.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
