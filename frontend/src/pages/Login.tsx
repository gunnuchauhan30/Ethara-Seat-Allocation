import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Armchair, LogIn } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { login as loginRequest } from "../api/auth";
import { useAuthStore } from "../store/authStore";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@ethara.ai", password: "admin123" },
  { label: "HR", email: "hr@ethara.ai", password: "hr123" },
  { label: "Employee", email: "employee@ethara.ai", password: "emp123" },
];

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => loginRequest(email, password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user);
      navigate("/");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-blue-glow shadow-[0_0_24px_rgba(168,85,247,0.5)]">
            <Armchair size={22} className="text-void" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">Ethara</h1>
          <p className="text-sm text-muted">Seat &amp; Project Ops</p>
        </div>

        <GlassCard glow>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ethara.ai"
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
              />
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-400">{(mutation.error as Error).message}</p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-blue-glow px-4 py-3 text-sm font-semibold text-void hover:opacity-90 disabled:opacity-50"
            >
              <LogIn size={16} />
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs text-muted">Quick demo login:</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:border-violet/50 hover:text-violet-soft"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
