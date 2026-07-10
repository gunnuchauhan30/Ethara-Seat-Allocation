import { api } from "./client";
import type { DashboardSummary, FloorUtilization, DepartmentUtilization } from "../types";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/analytics/summary");
  return data;
}

export async function fetchFloorUtilization(): Promise<FloorUtilization[]> {
  const { data } = await api.get<FloorUtilization[]>("/analytics/by-floor");
  return data;
}

export async function fetchDepartmentUtilization(): Promise<DepartmentUtilization[]> {
  const { data } = await api.get<DepartmentUtilization[]>("/analytics/by-department");
  return data;
}

export async function fetchProjectUtilization(): Promise<{ project: string; employee_count: number }[]> {
  const { data } = await api.get("/analytics/by-project");
  return data;
}

export async function askAI(question: string): Promise<{ question: string; answer: string; generated_sql?: string }> {
  const { data } = await api.post("/ai/query", { question });
  return data;
}
