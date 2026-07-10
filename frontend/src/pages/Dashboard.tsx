import { useQuery } from "@tanstack/react-query";
import { Users, Armchair, FolderKanban, Gauge, AlertTriangle } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { GlassCard } from "../components/GlassCard";
import { Skeleton } from "../components/Skeleton";
import { SeatOccupancyGrid } from "../components/SeatOccupancyGrid";
import { DashboardHero3D } from "../components/DashboardHero3D";
import { fetchDashboardSummary, fetchFloorUtilization, fetchDepartmentUtilization } from "../api/analytics";

export function Dashboard() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: fetchDashboardSummary });
  const floors = useQuery({ queryKey: ["floor-utilization"], queryFn: fetchFloorUtilization });
  const departments = useQuery({ queryKey: ["dept-utilization"], queryFn: fetchDepartmentUtilization });

  return (
    <Layout>
      <PageHeader
        eyebrow="Overview"
        title="Seat & workforce dashboard"
        description="Live occupancy, headcount, and project load across the office."
      />

      <GlassCard className="mb-6 !p-0 overflow-hidden" glow>
        <DashboardHero3D />
      </GlassCard>

      {summary.data && summary.data.total_seats > 0 && summary.data.occupied_seats === 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Seat occupancy is showing 0% for every floor.</p>
            <p className="mt-1 text-warn/80">
              Seats and employees exist, but no seat allocations were created — this usually happens
              when the seed script was interrupted before its last step finished. Run{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">python seed.py</code>{" "}
              again from the backend folder and let it run to completion without stopping it early.
            </p>
          </div>
        </div>
      )}

      {summary.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : summary.data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total employees" value={summary.data.total_employees} icon={<Users size={18} />} accent="violet" />
          <StatCard label="Total seats" value={summary.data.total_seats} icon={<Armchair size={18} />} accent="blue" />
          <StatCard
            label="Utilization"
            value={summary.data.utilization_percent.toFixed(1)}
            suffix="%"
            icon={<Gauge size={18} />}
            accent="good"
          />
          <StatCard label="Active projects" value={summary.data.total_projects} icon={<FolderKanban size={18} />} accent="warn" />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3">
          <h3 className="font-display text-lg font-semibold text-ink">Seat occupancy by floor</h3>
          <p className="mb-6 mt-1 text-sm text-muted">
            Each square is a slice of that floor&apos;s seats — filled and glowing means occupied.
          </p>
          {floors.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6" />
              ))}
            </div>
          ) : floors.data && floors.data.length > 0 ? (
            <SeatOccupancyGrid data={floors.data} />
          ) : (
            <p className="text-sm text-muted">No seat data yet — run the seed script.</p>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-display text-lg font-semibold text-ink">Headcount by department</h3>
          <p className="mb-6 mt-1 text-sm text-muted">Where the 5,000 sit organizationally.</p>
          {departments.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-5" />
              ))}
            </div>
          ) : departments.data ? (
            <div className="space-y-3">
              {departments.data
                .sort((a, b) => b.employee_count - a.employee_count)
                .map((dept) => {
                  const max = Math.max(...departments.data!.map((d) => d.employee_count));
                  const pct = (dept.employee_count / max) * 100;
                  return (
                    <div key={dept.department}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-ink font-medium">{dept.department}</span>
                        <span className="font-mono text-muted">{dept.employee_count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-violet to-blue-glow"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : null}
        </GlassCard>
      </div>
    </Layout>
  );
}
