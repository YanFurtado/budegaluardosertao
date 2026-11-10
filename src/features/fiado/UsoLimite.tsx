import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";

/** Barrinha de uso do limite de fiado (vermelha a partir de 90%). */
export function UsoLimite({ uso, className }: { uso: number | null; className?: string }) {
  if (uso === null) return <span className="text-ink-muted">Sem limite</span>;
  const alto = uso >= 0.9;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100" aria-hidden>
        <span
          className={cn("block h-full rounded-full", alto ? "bg-negative" : "bg-chart-primary")}
          style={{ width: `${Math.min(100, uso * 100)}%` }}
        />
      </span>
      <span className={cn("tabular-nums text-[12px]", alto ? "font-semibold text-negative" : "text-ink-muted")}>
        {formatPercent(uso)}
      </span>
    </span>
  );
}
