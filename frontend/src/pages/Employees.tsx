import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users, UserPlus, Copy, FolderPlus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { GlassCard } from "../components/GlassCard";
import { Badge } from "../components/Badge";
import { TableSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { fetchEmployees, createEmployee } from "../api/employees";
import { fetchProjects, createAssignment } from "../api/projects";
import type { Employee } from "../types";

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Sales", "Marketing",
  "HR", "Finance", "Operations", "Customer Support", "Legal",
];

const emptyForm = {
  employee_code: "",
  name: "",
  email: "",
  department: DEPARTMENTS[0],
  designation: "",
};

export function Employees() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [assignTarget, setAssignTarget] = useState<Employee | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [roleInProject, setRoleInProject] = useState("Contributor");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { push } = useToast();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.canManage());

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };
  const updateDepartment = (value: string) => {
    setDepartment(value);
    setPage(0);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["employees", search, department, page],
    queryFn: () =>
      fetchEmployees({
        search: search || undefined,
        department: department || undefined,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
  });

  // Fetched once, unfiltered, purely so the header can say "search across
  // all N employees" without that number collapsing to 0 whenever a search
  // or filter happens to match nothing.
  const { data: grandTotalData } = useQuery({
    queryKey: ["employees-grand-total"],
    queryFn: () => fetchEmployees({ limit: 1 }),
    staleTime: 5 * 60 * 1000,
  });
  const grandTotal = grandTotalData?.total ?? 0;

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: projects } = useQuery({
    queryKey: ["projects-for-assign"],
    queryFn: () => fetchProjects({ limit: 100 }),
    enabled: !!assignTarget,
  });

  const addMutation = useMutation({
    mutationFn: () => createEmployee(form),
    onSuccess: (newEmployee) => {
      push(`${newEmployee.name} added — their Employee ID is ${newEmployee.id}`);
      setShowAddModal(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      createAssignment({
        employee_id: assignTarget!.id,
        project_id: Number(selectedProjectId),
        role_in_project: roleInProject,
      }),
    onSuccess: () => {
      push(`${assignTarget!.name} assigned to project`);
      setAssignTarget(null);
      setSelectedProjectId("");
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  const copyId = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    push(`Employee ID ${id} copied`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="Directory"
        title="Employees"
        description={`Search across all ${grandTotal.toLocaleString()} employees by name, email, or code. Click a row to see full details, or click an ID to copy it.`}
        action={
          canManage ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-blue-glow px-4 py-2.5 text-sm font-semibold text-void hover:opacity-90"
            >
              <UserPlus size={16} />
              Add employee
            </button>
          ) : undefined
        }
      />

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add new employee">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Employee code</label>
            <input
              required
              value={form.employee_code}
              onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
              placeholder="ETH05001"
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane.doe@ethara.ai"
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none"
              >
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Designation</label>
              <input
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="Associate"
                className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet to-blue-glow px-4 py-3 text-sm font-semibold text-void hover:opacity-90 disabled:opacity-50"
          >
            {addMutation.isPending ? "Adding..." : "Add employee"}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={assignTarget ? `Assign ${assignTarget.name} to a project` : ""}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedProjectId) assignMutation.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Project</label>
            <select
              required
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none"
            >
              <option value="">Select a project...</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Role on project</label>
            <select
              value={roleInProject}
              onChange={(e) => setRoleInProject(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none"
            >
              <option value="Contributor">Contributor</option>
              <option value="Lead">Lead</option>
              <option value="Reviewer">Reviewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={assignMutation.isPending || !selectedProjectId}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet to-blue-glow px-4 py-3 text-sm font-semibold text-void hover:opacity-90 disabled:opacity-50"
          >
            {assignMutation.isPending ? "Assigning..." : "Assign to project"}
          </button>
        </form>
      </Modal>

      <GlassCard className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search by name, email, or employee code..."
              className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
            />
          </div>
          <select
            value={department}
            onChange={(e) => updateDepartment(e.target.value)}
            className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-violet focus:outline-none"
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="overflow-x-auto p-6 pb-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="pb-3 pr-4 font-medium">ID</th>
                    <th className="pb-3 pr-4 font-medium">Code</th>
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Department</th>
                    <th className="pb-3 pr-4 font-medium">Designation</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    {canManage && <th className="pb-3 font-medium">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((emp) => (
                    <tr
                      key={emp.id}
                      className="cursor-pointer border-b border-line/50 last:border-0 hover:bg-surface-2/60"
                    >
                      <td className="py-3 pr-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyId(emp.id);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 font-mono text-xs text-ink hover:border-violet/50 hover:text-violet-soft"
                          title="Click to copy Employee ID"
                        >
                          {copiedId === emp.id ? <Check size={12} className="text-good" /> : <Copy size={12} />}
                          #{emp.id}
                        </button>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-violet-soft">
                        <Link to={`/employees/${emp.id}`} className="hover:underline">
                          {emp.employee_code}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-ink font-medium">
                        <Link to={`/employees/${emp.id}`} className="hover:text-violet-soft hover:underline">
                          {emp.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted">{emp.department}</td>
                      <td className="py-3 pr-4 text-muted">{emp.designation}</td>
                      <td className="py-3 pr-4"><Badge status={emp.status} /></td>
                      {canManage && (
                        <td className="py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignTarget(emp);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-violet/40 px-2.5 py-1 text-xs font-medium text-violet-soft hover:bg-violet/10"
                          >
                            <FolderPlus size={12} />
                            Assign
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 p-6 pt-4">
              <p className="text-xs text-muted">
                Showing <span className="text-ink font-medium">{rangeStart}-{rangeEnd}</span> of{" "}
                <span className="text-ink font-medium">{total.toLocaleString()}</span> employees
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:border-violet/50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <span className="font-mono text-xs text-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => (rangeEnd < total ? p + 1 : p))}
                  disabled={rangeEnd >= total}
                  className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:border-violet/50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={<Users size={28} />}
              title="No employees found"
              description="Try a different search term or clear the department filter."
            />
          </div>
        )}
      </GlassCard>
    </Layout>
  );
}
