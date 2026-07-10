import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Building2, Briefcase, Calendar, Armchair, FolderKanban } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { GlassCard } from "../components/GlassCard";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { fetchEmployee, fetchEmployeeSeat, fetchEmployeeProjects } from "../api/employees";
import type { Seat, Project } from "../types";

export function EmployeeDetail() {
  const { id } = useParams();
  const employeeId = Number(id);

  const employee = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => fetchEmployee(employeeId),
    enabled: !Number.isNaN(employeeId),
  });

  const seat = useQuery({
    queryKey: ["employee-seat", employeeId],
    queryFn: () => fetchEmployeeSeat(employeeId) as Promise<Seat | null>,
    enabled: !Number.isNaN(employeeId),
  });

  const projects = useQuery({
    queryKey: ["employee-projects", employeeId],
    queryFn: () => fetchEmployeeProjects(employeeId) as Promise<Project[]>,
    enabled: !Number.isNaN(employeeId),
  });

  return (
    <Layout>
      <Link
        to="/employees"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-violet-soft"
      >
        <ArrowLeft size={15} />
        Back to employees
      </Link>

      {employee.isLoading ? (
        <Skeleton className="h-40" />
      ) : employee.data ? (
        <>
          <PageHeader
            eyebrow={`#${employee.data.id} · ${employee.data.employee_code}`}
            title={employee.data.name}
            description={employee.data.designation + " · " + employee.data.department}
            action={<Badge status={employee.data.status} />}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <GlassCard className="lg:col-span-1">
              <h3 className="mb-4 font-display text-lg font-semibold text-ink">Personal details</h3>
              <dl className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-violet-soft" />
                  <div>
                    <dt className="text-xs text-muted">Email</dt>
                    <dd className="text-ink">{employee.data.email}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 size={16} className="mt-0.5 text-violet-soft" />
                  <div>
                    <dt className="text-xs text-muted">Department</dt>
                    <dd className="text-ink">{employee.data.department}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase size={16} className="mt-0.5 text-violet-soft" />
                  <div>
                    <dt className="text-xs text-muted">Designation</dt>
                    <dd className="text-ink">{employee.data.designation}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="mt-0.5 text-violet-soft" />
                  <div>
                    <dt className="text-xs text-muted">Joined</dt>
                    <dd className="text-ink">
                      {new Date(employee.data.joining_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                </div>
              </dl>
            </GlassCard>

            <GlassCard className="lg:col-span-1">
              <h3 className="mb-4 font-display text-lg font-semibold text-ink">Current seat</h3>
              {seat.isLoading ? (
                <Skeleton className="h-20" />
              ) : seat.data ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet/15 text-violet-soft">
                    <Armchair size={24} />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-semibold text-ink">{seat.data.seat_number}</p>
                    <p className="text-xs text-muted">
                      Floor {seat.data.floor} · Zone {seat.data.zone}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Armchair size={24} />}
                  title="No seat allocated"
                  description="This employee doesn't have an active seat yet — treat them as a new joiner."
                />
              )}
            </GlassCard>

            <GlassCard className="lg:col-span-1">
              <h3 className="mb-4 font-display text-lg font-semibold text-ink">Active projects</h3>
              {projects.isLoading ? (
                <Skeleton className="h-20" />
              ) : projects.data && projects.data.length > 0 ? (
                <ul className="space-y-2">
                  {projects.data.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/projects/${p.id}`}
                        className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm text-ink hover:border-violet/50 hover:text-violet-soft"
                      >
                        <span className="flex items-center gap-2">
                          <FolderKanban size={14} className="text-violet-soft" />
                          {p.name}
                        </span>
                        <Badge status={p.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<FolderKanban size={24} />}
                  title="No active projects"
                  description="This employee isn't currently mapped to a project."
                />
              )}
            </GlassCard>
          </div>
        </>
      ) : (
        <GlassCard>
          <EmptyState icon={<Mail size={28} />} title="Employee not found" description="This employee may have been removed." />
        </GlassCard>
      )}
    </Layout>
  );
}
