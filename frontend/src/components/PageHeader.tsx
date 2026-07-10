import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-violet-soft">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold bg-gradient-to-r from-ink to-violet-soft bg-clip-text text-transparent md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
