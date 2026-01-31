import { Home, User, FileText, Pill, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";
import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";

const NavItem = memo(function NavItem({
  path,
  icon: Icon,
  label,
  badge,
  isActive,
  onTap,
}: {
  path: string;
  icon: typeof Home;
  label: string;
  badge?: number;
  isActive: boolean;
  onTap: () => void;
}) {
  return (
    <Link
      to={path}
      onClick={onTap}
      className="relative flex flex-col items-center justify-center p-2 transition-all duration-200"
    >
      <motion.div
        animate={{
          scale: isActive ? 1.15 : 1,
          y: isActive ? -4 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={cn(
          "relative p-2.5 rounded-2xl transition-colors duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Icon className="h-5 w-5" />
        {badge && badge > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
          >
            {badge}
          </Badge>
        )}
      </motion.div>
      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-[10px] font-medium text-primary mt-1"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
});

// Center FAB Button
const CenterFAB = memo(function CenterFAB({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative -mt-6 p-4 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/40 ring-4 ring-background"
    >
      <Plus className="h-6 w-6" />
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.button>
  );
});

function DockNavigation() {
  const location = useLocation();
  const { triggerLight } = useHapticFeedback();
  const { t } = useTranslation();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: expiringCount = 0 } = useQuery({
    queryKey: ["expiring-docs-count"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { count } = await supabase
        .from("documentos_saude")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("expires_at", thirtyDaysFromNow.toISOString())
        .gte("expires_at", new Date().toISOString());

      return count || 0;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const leftItems = useMemo(
    () => [
      { path: "/hoje", icon: Home, labelKey: "nav.today" },
      { path: "/medicamentos", icon: Pill, labelKey: "nav.routine" },
    ],
    []
  );

  const rightItems = useMemo(
    () => [
      {
        path: "/carteira",
        icon: FileText,
        labelKey: "nav.wallet",
        badge: expiringCount > 0 ? expiringCount : undefined,
      },
      { path: "/perfil", icon: User, labelKey: "nav.profile" },
    ],
    [expiringCount]
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)]">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-2xl border-t border-white/10" />

        {/* Dock Container */}
        <div className="relative max-w-md mx-auto px-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            className="flex items-end justify-around py-2"
          >
            {/* Left Items */}
            {leftItems.map((item) => (
              <NavItem
                key={item.path}
                path={item.path}
                icon={item.icon}
                label={t(item.labelKey)}
                isActive={location.pathname === item.path}
                onTap={triggerLight}
              />
            ))}

            {/* Center FAB */}
            <CenterFAB onClick={() => setWizardOpen(true)} />

            {/* Right Items */}
            {rightItems.map((item) => (
              <NavItem
                key={item.path}
                path={item.path}
                icon={item.icon}
                label={t(item.labelKey)}
                badge={item.badge}
                isActive={location.pathname === item.path}
                onTap={triggerLight}
              />
            ))}
          </motion.div>
        </div>
      </nav>

      <MedicationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}

export default memo(DockNavigation);
