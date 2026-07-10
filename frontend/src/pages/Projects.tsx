import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, ArrowUpRight } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { GlassCard } from "../components/GlassCard";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { fetchProjects } from "../api/projects";

export function Projects() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: () => fetchProjects({ search: search || undefined, limit: 100 }),
  });

  return (
    <Layout>
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description="All active and completed projects, and who's mapped to them."
      />

      <GlassCard className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects by name..."
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
        />
      </GlassCard>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <GlassCard hover className="group flex h-full flex-col cursor-pointer">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-ink group-hover:text-violet-soft">
                    {project.name}
                  </h3>
                  <Badge status={project.status} />
                </div>
                <p className="line-clamp-3 flex-1 text-sm text-muted">{project.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted group-hover:text-violet-soft">
                  View assigned employees
                  <ArrowUpRight size={13} />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <GlassCard>
          <EmptyState
            icon={<FolderKanban size={28} />}
            title="No projects found"
            description="Try a different search term."
          />
        </GlassCard>
      )}
    </Layout>
  );
}
