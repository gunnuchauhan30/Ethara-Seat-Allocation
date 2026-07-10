import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "employee" | "hr" | "admin";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  canManage: () => boolean; // hr/admin can allocate seats, add employees, etc.
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      canManage: () => {
        const role = get().user?.role;
        return role === "hr" || role === "admin";
      },
    }),
    { name: "ethara-auth" }
  )
);
