import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
