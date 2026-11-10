import { Equal, Minus, Plus, RotateCcw, ShoppingBag, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { REVENUE_COMPONENTS, type ComponentToggles, type RevenueComponent } from "../aggregate";
import { CardHeader } from "@/components/shared/CardHeader";

const SIGN_STYLE: Record<"base" | "+" | "-" | "=", { icon: LucideIcon; bg: string }> = {
  base: { icon: ShoppingBag, bg: "bg-chart-primary" },
  "+": { icon: Plus, bg: "bg-accent" },
  "-": { icon: Minus, bg: "bg-negative" },
  "=": { icon: Equal, bg: "bg-positive" },
};

interface RevenueDetailsCardProps {
  loading: boolean;
  totals: Record<RevenueComponent, number>;
  toggles: ComponentToggles;
  onToggle: (key: RevenueComponent) => void;
  onReset: () => void;
  faturamento: number;
}

export function RevenueDetailsCard({ loading, totals, toggles, onToggle, onReset, faturamento }: RevenueDetailsCardProps) {
  const allOn = Object.values(toggles).every(Boolean);

  return (
    <section className="card p-4 sm:p-5">
      <CardHeader
        title="Detalhes do faturamento"
        subtitle="Clique no valor para adicioná-lo ou removê-lo do cálculo do faturamento"
        actions={
          !allOn && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
            >
              <RotateCcw className="size-3.5" /> Restaurar cálculo
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
        {REVENUE_COMPONENTS.map((c) => {
          const on = toggles[c.key];
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c.key)}
              title={on ? "Clique para remover do cálculo" : "Clique para adicionar ao cálculo"}
              className={cn(
                "group -m-2 flex min-w-0 items-center gap-3 rounded-md p-2 text-left transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40",
                !on && "opacity-40",
              )}
            >
              <DetailContent
                sign={c.sign}
                label={c.label}
                value={loading ? null : c.sign === "-" ? -totals[c.key] || 0 : totals[c.key]}
                strike={!on}
              />
            </button>
          );
        })}

        <div className="flex min-w-0 items-center gap-3 p-0">
          <DetailContent sign="=" label="Faturamento" value={loading ? null : faturamento} bold />
        </div>
      </div>
    </section>
  );
}

function DetailContent({
  sign,
  label,
  value,
  bold,
  strike,
}: {
  sign: "base" | "+" | "-" | "=";
  label: string;
  value: number | null;
  bold?: boolean;
  strike?: boolean;
}) {
  const { icon: Icon, bg } = SIGN_STYLE[sign];
  return (
    <>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-white", bg)} aria-hidden>
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-[13px] leading-4 text-ink-muted", bold && "font-semibold text-ink")}>{label}</span>
        {value === null ? (
          <Skeleton className="mt-1 h-4 w-20" />
        ) : (
          <span
            className={cn(
              "truncate tabular-nums text-ink",
              bold ? "text-[16px] font-bold" : "text-[15px] font-semibold",
              strike && "line-through",
            )}
          >
            {formatCurrency(value)}
          </span>
        )}
      </span>
    </>
  );
}
