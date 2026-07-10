export type EmployeeStatus = "active" | "inactive";
export type SeatStatus = "vacant" | "occupied" | "reserved";
export type ProjectStatus = "active" | "completed" | "on_hold";

export interface Employee {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  joining_date: string;
}

export interface Seat {
  id: number;
  seat_number: string;
  floor: number;
  zone: string;
  status: SeatStatus;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
}

export interface DashboardSummary {
  total_employees: number;
  total_seats: number;
  occupied_seats: number;
  vacant_seats: number;
  utilization_percent: number;
  total_projects: number;
}

export interface FloorUtilization {
  floor: number;
  total_seats: number;
  occupied: number;
  vacant: number;
  utilization_percent: number;
}

export interface DepartmentUtilization {
  department: string;
  employee_count: number;
}

export interface SeatAllocation {
  id: number;
  employee_id: number;
  seat_id: number;
  allocated_date: string;
  released_date: string | null;
}

export interface EmployeeListResponse {
  total: number;
  items: Employee[];
}

export interface ProjectAssignmentDetail {
  assignment_id: number;
  employee_id: number;
  employee_code: string;
  employee_name: string;
  employee_email: string;
  department: string;
  designation: string;
  role_in_project: string | null;
  start_date: string;
  end_date: string | null;
  seat_number: string | null;
  floor: number | null;
  zone: string | null;
}
