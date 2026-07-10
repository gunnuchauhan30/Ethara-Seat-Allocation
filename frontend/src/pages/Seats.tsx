import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Armchair, ExternalLink } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { GlassCard } from "../components/GlassCard";
import { Badge } from "../components/Badge";
import { TableSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { fetchSeats, allocateSeat, releaseSeat, fetchSeatOccupant } from "../api/seats";

const FLOORS = Array.from({ length: 10 }, (_, i) => i + 1);
const ZONES = ["A", "B", "C", "D"];

export function Seats() {
  const [floor, setFloor] = useState<string>("");
  const [zone, setZone] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [allocatingSeatId, setAllocatingSeatId] = useState<number | null>(null);
  const [employeeIdInput, setEmployeeIdInput] = useState("");

  const { push } = useToast();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.canManage());
  const navigate = useNavigate();
  const [resolvingSeatId, setResolvingSeatId] = useState<number | null>(null);

  const openOccupant = async (seatId: number) => {
    setResolvingSeatId(seatId);
    try {
      const occupant = await fetchSeatOccupant(seatId);
      if (occupant) {
        navigate(`/employees/${occupant.id}`);
      } else {
        push("This seat has no current occupant on record", "error");
      }
    } catch (err) {
      push((err as Error).message, "error");
    } finally {
      setResolvingSeatId(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["seats", floor, zone, status],
    queryFn: () =>
      fetchSeats({
        floor: floor ? Number(floor) : undefined,
        zone: zone || undefined,
        status: status || undefined,
        limit: 100,
      }),
  });

  const allocateMutation = useMutation({
    mutationFn: ({ seatId, employeeId }: { seatId: number; employeeId: number }) =>
      allocateSeat(seatId, employeeId),
    onSuccess: () => {
      push("Seat allocated successfully");
      setAllocatingSeatId(null);
      setEmployeeIdInput("");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  const releaseMutation = useMutation({
    mutationFn: (seatId: number) => releaseSeat(seatId),
    onSuccess: () => {
      push("Seat released");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  return (
    <Layout>
      <PageHeader
        eyebrow="Floor plan"
        title="Seats"
        description="View, allocate, and release seats across every floor and zone."
      />

      <GlassCard className="mb-6">
        <div className="flex flex-wrap gap-3">
          <select value={floor} onChange={(e) => setFloor(e.target.value)} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none">
            <option value="">All floors</option>
            {FLOORS.map((f) => <option key={f} value={f}>Floor {f}</option>)}
          </select>
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none">
            <option value="">All zones</option>
            {ZONES.map((z) => <option key={z} value={z}>Zone {z}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none">
            <option value="">All statuses</option>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-4 font-medium">Seat</th>
                  <th className="pb-3 pr-4 font-medium">Floor</th>
                  <th className="pb-3 pr-4 font-medium">Zone</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((seat) => (
                  <tr key={seat.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/60">
                    <td className="py-3 pr-4 font-mono text-xs text-violet-soft">
                      {seat.status === "occupied" ? (
                        <button
                          onClick={() => openOccupant(seat.id)}
                          disabled={resolvingSeatId === seat.id}
                          className="flex items-center gap-1.5 hover:underline disabled:opacity-50"
                          title="View who's sitting here"
                        >
                          {seat.seat_number}
                          <ExternalLink size={11} />
                        </button>
                      ) : (
                        seat.seat_number
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted">F{seat.floor}</td>
                    <td className="py-3 pr-4 text-muted">Zone {seat.zone}</td>
                    <td className="py-3 pr-4"><Badge status={seat.status} /></td>
                    <td className="py-3">
                      {!canManage ? (
                        <span className="text-xs text-muted">View only</span>
                      ) : seat.status === "vacant" ? (
                        allocatingSeatId === seat.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="number"
                              placeholder="Employee ID"
                              value={employeeIdInput}
                              onChange={(e) => setEmployeeIdInput(e.target.value)}
                              className="w-28 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs text-ink focus:border-violet focus:outline-none"
                            />
                            <button
                              onClick={() =>
                                employeeIdInput &&
                                allocateMutation.mutate({ seatId: seat.id, employeeId: Number(employeeIdInput) })
                              }
                              className="rounded-lg bg-violet px-2.5 py-1 text-xs font-medium text-white hover:bg-violet/80"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setAllocatingSeatId(null)}
                              className="text-xs text-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAllocatingSeatId(seat.id)}
                            className="rounded-lg border border-violet/40 px-2.5 py-1 text-xs font-medium text-violet-soft hover:bg-violet/10"
                          >
                            Allocate
                          </button>
                        )
                      ) : seat.status === "occupied" ? (
                        <button
                          onClick={() => releaseMutation.mutate(seat.id)}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-ink hover:border-muted"
                        >
                          Release
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Armchair size={28} />}
            title="No seats match these filters"
            description="Try clearing a filter to see more results."
          />
        )}
      </GlassCard>
    </Layout>
  );
}
