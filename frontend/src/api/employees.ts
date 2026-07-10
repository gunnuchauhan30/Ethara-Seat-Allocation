import { api } from "./client";
import type { Employee, EmployeeListResponse } from "../types";

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export async function fetchEmployees(filters: EmployeeFilters = {}): Promise<EmployeeListResponse> {
  const { data } = await api.get<EmployeeListResponse>("/employees/", { params: filters });
  return data;
}

export async function fetchEmployee(id: number): Promise<Employee> {
  const { data } = await api.get<Employee>(`/employees/${id}`);
  return data;
}

export async function fetchEmployeeSeat(id: number) {
  const { data } = await api.get(`/employees/${id}/seat`);
  return data;
}

export async function fetchEmployeeProjects(id: number) {
  const { data } = await api.get(`/employees/${id}/projects`);
  return data;
}

export interface NewEmployeePayload {
  employee_code: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

export async function createEmployee(payload: NewEmployeePayload): Promise<Employee> {
  const { data } = await api.post<Employee>("/employees/", payload);
  return data;
}
