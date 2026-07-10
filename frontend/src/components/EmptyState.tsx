import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-2xl bg-surface-2 p-4 text-muted">{icon}</div>
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
