import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Armchair } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { GlassCard } from "../components/GlassCard";
import { Badge } from "../components/Badge";
import { Skeleton, TableSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { fetchProject, fetchProjectAssignments } from "../api/projects";

export function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !Number.isNaN(projectId),
  });

  const assignments = useQuery({
    queryKey: ["project-assignments", projectId],
    queryFn: () => fetchProjectAssignments(projectId),
    enabled: !Number.isNaN(projectId),
  });

  const activeCount = assignments.data?.filter((a) => !a.end_date).length ?? 0;

  return (
    <Layout>
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-violet-soft"
      >
        <ArrowLeft size={15} />
        Back to projects
      </Link>

      {project.isLoading ? (
        <Skeleton className="h-32" />
      ) : project.data ? (
        <>
          <PageHeader
            eyebrow="Project"
            title={project.data.name}
            description={project.data.description || "No description provided."}
            action={<Badge status={project.data.status} />}
          />

          <GlassCard className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/15 text-violet-soft">
              <Users size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink">{activeCount}</p>
              <p className="text-xs text-muted">employee{activeCount === 1 ? "" : "s"} currently assigned</p>
            </div>
          </GlassCard>

          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="font-display text-lg font-semibold text-ink">Assigned employees</h3>
              <p className="mt-1 text-sm text-muted">Who's on this project, their role, start date, and where they sit.</p>
            </div>

            {assignments.isLoading ? (
              <div className="px-6 pb-6">
                <TableSkeleton rows={5} />
              </div>
            ) : assignments.data && assignments.data.length > 0 ? (
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                      <th className="pb-3 pr-4 font-medium">Employee</th>
                      <th className="pb-3 pr-4 font-medium">Department</th>
                      <th className="pb-3 pr-4 font-medium">Role on project</th>
                      <th className="pb-3 pr-4 font-medium">Start date</th>
                      <th className="pb-3 pr-4 font-medium">Seat</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.data.map((a) => (
                      <tr key={a.assignment_id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/60">
                        <td className="py-3 pr-4">
                          <Link to={`/employees/${a.employee_id}`} className="block hover:text-violet-soft">
                            <span className="font-medium text-ink">{a.employee_name}</span>
                            <span className="ml-2 font-mono text-xs text-muted">{a.employee_code}</span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-muted">{a.department}</td>
                        <td className="py-3 pr-4 text-muted">{a.role_in_project || "—"}</td>
                        <td className="py-3 pr-4 text-muted">
                          {new Date(a.start_date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 pr-4">
                          {a.seat_number ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-violet-soft">
                              <Armchair size={12} />
                              {a.seat_number} (F{a.floor}-{a.zone})
                            </span>
                          ) : (
                            <span className="text-xs text-muted">No seat</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge status={a.end_date ? "completed" : "active"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <EmptyState
                  icon={<Users size={28} />}
                  title="No one assigned yet"
                  description="Assign employees to this project from the Employees page."
                />
              </div>
            )}
          </GlassCard>
        </>
      ) : (
        <GlassCard>
          <EmptyState icon={<Users size={28} />} title="Project not found" description="This project may have been removed." />
        </GlassCard>
      )}
    </Layout>
  );
}
