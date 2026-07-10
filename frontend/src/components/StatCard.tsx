import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";

export function StatCard({
  label,
  value,
  icon,
  accent = "violet",
  suffix = "",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: "violet" | "blue" | "good" | "warn";
  suffix?: string;
}) {
  const accentColor =
    accent === "blue"
      ? "text-blue-glow"
      : accent === "good"
      ? "text-good"
      : accent === "warn"
      ? "text-warn"
      : "text-violet-soft";

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted font-medium">{label}</p>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 font-display text-3xl font-semibold text-ink"
          >
            {value}
            {suffix}
          </motion.p>
        </div>
        <div className={`rounded-xl bg-surface-2 p-2.5 ${accentColor}`}>{icon}</div>
      </div>
    </GlassCard>
  );
}
