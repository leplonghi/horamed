import { motion } from "framer-motion";

interface OceanBackgroundProps {
  variant?: "page" | "subtle" | "card";
  className?: string;
}

/**
 * OceanBackground - Subtle animated ocean gradient for app pages
 * 
 * Variants:
 * - page: Default subtle background for app pages
 * - subtle: Very minimal for already busy pages
 * - card: For use inside cards/sections
 */
export function OceanBackground({ variant = "page", className = "" }: OceanBackgroundProps) {
  const config = {
    page: {
      baseOpacity: 0.06,
      blobOpacity: 0.1,
    },
    subtle: {
      baseOpacity: 0.03,
      blobOpacity: 0.05,
    },
    card: {
      baseOpacity: 0.08,
      blobOpacity: 0.12,
    },
  };

  const { baseOpacity, blobOpacity } = config[variant];

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}>
      {/* Base gradient wash */}
      <div 
        className="absolute inset-0 bg-gradient-fluid-subtle"
        style={{ opacity: baseOpacity * 10 }}
      />
      
      {/* Animated blob - top right */}
      <motion.div
        className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-blob-1 blur-[100px]"
        style={{ opacity: blobOpacity }}
        animate={{
          x: [0, 20, 0],
          y: [0, 15, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Animated blob - bottom left */}
      <motion.div
        className="absolute -bottom-[15%] -left-[15%] w-[55%] h-[55%] rounded-full bg-gradient-blob-2 blur-[120px]"
        style={{ opacity: blobOpacity * 0.8 }}
        animate={{
          x: [0, -25, 0],
          y: [0, -20, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Accent blob - center */}
      <motion.div
        className="absolute top-[40%] left-[30%] w-[35%] h-[35%] rounded-full bg-gradient-blob-3 blur-[80px]"
        style={{ opacity: blobOpacity * 0.5 }}
        animate={{
          x: [0, 15, -10, 0],
          y: [0, -10, 10, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export default OceanBackground;
