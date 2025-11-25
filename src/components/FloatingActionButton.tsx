import { Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import QuickActionMenu from "./QuickActionMenu";

export default function FloatingActionButton() {
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  
  // Hide FAB on auth and onboarding pages
  const hiddenRoutes = ["/auth", "/onboarding"];
  const shouldHide = hiddenRoutes.some(route => location.pathname.startsWith(route));

  if (shouldHide) return null;

  return (
    <>
      <AnimatePresence>
        <motion.button
          onClick={() => setShowMenu(true)}
          className="fixed bottom-24 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            boxShadow: [
              "0 10px 30px -10px hsl(var(--primary) / 0.3)",
              "0 10px 40px -10px hsl(var(--primary) / 0.5)",
              "0 10px 30px -10px hsl(var(--primary) / 0.3)",
            ],
          }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{
            scale: { duration: 0.2 },
            opacity: { duration: 0.2 },
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          aria-label="Adicionar"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </AnimatePresence>
      <QuickActionMenu open={showMenu} onOpenChange={setShowMenu} />
    </>
  );
}
