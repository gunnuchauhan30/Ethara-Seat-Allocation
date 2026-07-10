import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function GlassCard({
  children,
  className = "",
  glow = false,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={`glass ${glow ? "glow-border" : ""} rounded-2xl p-6 transition-shadow ${
        hover ? "hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
