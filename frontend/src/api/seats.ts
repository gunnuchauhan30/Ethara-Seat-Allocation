import { api } from "./client";
import type { Seat, SeatAllocation, Employee } from "../types";

export interface SeatFilters {
  floor?: number;
  zone?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export async function fetchSeats(filters: SeatFilters = {}): Promise<Seat[]> {
  const { data } = await api.get<Seat[]>("/seats/", { params: filters });
  return data;
}

export async function fetchAvailableSeats(filters: { floor?: number; zone?: string } = {}): Promise<Seat[]> {
  const { data } = await api.get<Seat[]>("/seats/available", { params: filters });
  return data;
}

export async function allocateSeat(seatId: number, employeeId: number): Promise<SeatAllocation> {
  const { data } = await api.post<SeatAllocation>(`/seats/${seatId}/allocate`, null, {
    params: { employee_id: employeeId },
  });
  return data;
}

export async function fetchSeatOccupant(seatId: number): Promise<Employee | null> {
  const { data } = await api.get<Employee | null>(`/seats/${seatId}/occupant`);
  return data;
}

export async function releaseSeat(seatId: number) {
  const { data } = await api.post(`/seats/${seatId}/release`);
  return data;
}

export async function newJoinerAllocate(payload: {
  employee_id: number;
  floor?: number;
  zone?: string;
}): Promise<SeatAllocation> {
  const { data } = await api.post<SeatAllocation>("/seats/new-joiner-allocate", payload);
  return data;
}
