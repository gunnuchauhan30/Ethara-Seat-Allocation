import { motion } from "framer-motion";
import type { FloorUtilization } from "../types";

/**
 * The signature visual for this app: each floor is rendered as a strip of
 * small seat-glyphs. Filled + glowing = occupied, hollow = vacant. This
 * mirrors how an office floor plan actually reads, instead of a generic bar
 * chart, and scales down 5000+ seats into something scannable at a glance.
 */
export function SeatOccupancyGrid({ data }: { data: FloorUtilization[] }) {
  const DOTS_PER_FLOOR = 40;

  return (
    <div className="space-y-4">
      {data.map((floor, floorIdx) => {
        const filledDots = Math.round((floor.utilization_percent / 100) * DOTS_PER_FLOOR);
        return (
          <div key={floor.floor} className="flex items-center gap-4">
            <div className="w-16 shrink-0 font-mono text-xs text-muted">
              F{floor.floor}
            </div>
            <div className="flex flex-1 flex-wrap gap-1">
              {Array.from({ length: DOTS_PER_FLOOR }).map((_, i) => {
                const isFilled = i < filledDots;
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: floorIdx * 0.04 + i * 0.004, duration: 0.25 }}
                    className={`h-2.5 w-2.5 rounded-sm ${
                      isFilled
                        ? "bg-violet shadow-[0_0_6px_rgba(168,85,247,0.8)]"
                        : "bg-surface-2 border border-line"
                    }`}
                  />
                );
              })}
            </div>
            <div className="w-14 shrink-0 text-right font-mono text-xs text-violet-soft">
              {floor.utilization_percent.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
