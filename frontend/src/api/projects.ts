import { api } from "./client";
import type { Project, Employee, ProjectAssignmentDetail } from "../types";

export interface ProjectFilters {
  search?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export async function fetchProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  const { data } = await api.get<Project[]>("/projects/", { params: filters });
  return data;
}

export async function fetchProject(id: number): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`);
  return data;
}

export async function fetchProjectEmployees(id: number): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>(`/projects/${id}/employees`);
  return data;
}

export async function fetchProjectAssignments(id: number): Promise<ProjectAssignmentDetail[]> {
  const { data } = await api.get<ProjectAssignmentDetail[]>(`/projects/${id}/assignments`);
  return data;
}

export interface AssignmentPayload {
  employee_id: number;
  project_id: number;
  role_in_project?: string;
}

export async function createAssignment(payload: AssignmentPayload) {
  const { data } = await api.post("/assignments/", payload);
  return data;
}
