import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Armchair,
  FolderKanban,
  UserPlus,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/seats", label: "Seats", icon: Armchair },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/new-joiner", label: "New Joiner", icon: UserPlus },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line/60 bg-surface/80 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-blue-glow shadow-[0_0_20px_rgba(168,85,247,0.5)]">
          <Armchair size={18} className="text-void" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight text-ink">Ethara</p>
          <p className="text-[11px] text-muted leading-tight">Seat &amp; Project Ops</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-ink"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-xl bg-surface-2 glow-border"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 p-4">
        {user && (
          <div className="glass flex items-center justify-between rounded-xl p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="text-[11px] capitalize text-violet-soft">{user.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <div className="glass rounded-xl p-3 text-xs text-muted">
          Backend status:{" "}
          <span className="text-good font-medium">connected</span>
        </div>
      </div>
    </aside>
  );
}
