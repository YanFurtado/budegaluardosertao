import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONS = {
  blue: "bg-chart-primary",
  orange: "bg-accent",
  green: "bg-positive",
  red: "bg-negative",
  gray: "bg-gray-400",
} as const;

/** Bloco de número de destaque (KPI pequeno). */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tom = "blue",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tom?: keyof typeof TONS;
  className?: string;
}) {
  return (
    <div className={cn("card flex items-center gap-3 p-4", className)}>
      {Icon && (
        <span
          className={cn("hidden size-10 shrink-0 items-center justify-center rounded-full text-white min-[420px]:flex", TONS[tom])}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[12px] text-ink-muted">{label}</p>
        <p className="break-words text-[16px] font-bold leading-tight tabular-nums text-ink sm:text-[18px]">{value}</p>
        {hint && <p className="text-[12px] text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}
