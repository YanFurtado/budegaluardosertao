import type { ReactNode } from "react";

export function CardHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="card-title">{title}</h2>
        {subtitle && <p className="card-subtitle mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
