import { api } from "./client";
import type { AuthUser } from "../store/authStore";

export async function login(email: string, password: string): Promise<{ access_token: string; user: AuthUser }> {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}
