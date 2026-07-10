import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle2, ShieldAlert } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { GlassCard } from "../components/GlassCard";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { newJoinerAllocate } from "../api/seats";
import type { SeatAllocation } from "../types";

const FLOORS = Array.from({ length: 10 }, (_, i) => i + 1);
const ZONES = ["A", "B", "C", "D"];

export function NewJoiner() {
  const [employeeId, setEmployeeId] = useState("");
  const [floor, setFloor] = useState("");
  const [zone, setZone] = useState("");
  const [result, setResult] = useState<SeatAllocation | null>(null);
  const { push } = useToast();
  const canManage = useAuthStore((s) => s.canManage());

  const mutation = useMutation({
    mutationFn: () =>
      newJoinerAllocate({
        employee_id: Number(employeeId),
        floor: floor ? Number(floor) : undefined,
        zone: zone || undefined,
      }),
    onSuccess: (data) => {
      setResult(data);
      push("Seat allocated to new joiner!");
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  if (!canManage) {
    return (
      <Layout>
        <PageHeader eyebrow="Onboarding" title="New joiner allocation" />
        <GlassCard>
          <div className="flex flex-col items-center py-10 text-center">
            <ShieldAlert size={28} className="mb-3 text-warn" />
            <p className="text-sm text-muted">
              This action is restricted to HR and Admin roles.
            </p>
          </div>
        </GlassCard>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Onboarding"
        title="New joiner allocation"
        description="Automatically assign the first available seat matching a floor or zone preference."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard glow>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setResult(null);
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Employee ID</label>
              <input
                required
                type="number"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. 4821"
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">Find this on the Employees page.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Preferred floor</label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none"
                >
                  <option value="">Any floor</option>
                  {FLOORS.map((f) => <option key={f} value={f}>Floor {f}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Preferred zone</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none"
                >
                  <option value="">Any zone</option>
                  {ZONES.map((z) => <option key={z} value={z}>Zone {z}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-blue-glow px-4 py-3 text-sm font-semibold text-void transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <UserPlus size={16} />
              {mutation.isPending ? "Allocating..." : "Allocate seat"}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="flex items-center justify-center">
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-good/15 text-good">
                <CheckCircle2 size={28} />
              </div>
              <p className="font-display text-lg font-semibold text-ink">Seat allocated</p>
              <p className="mt-1 font-mono text-sm text-violet-soft">Seat ID #{result.seat_id}</p>
              <p className="mt-1 text-xs text-muted">Employee #{result.employee_id}</p>
            </motion.div>
          ) : (
            <p className="text-sm text-muted">Submit the form to see the allocation result here.</p>
          )}
        </GlassCard>
      </div>
    </Layout>
  );
}
