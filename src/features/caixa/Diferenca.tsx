import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

/** Diferença de caixa colorida: verde (sobra/batendo), vermelho (falta). */
export function Diferenca({ valor, descritivo, className }: { valor: number | null; descritivo?: boolean; className?: string }) {
  if (valor === null) return <span className={cn("text-ink-muted", className)}>—</span>;
  const v = Math.abs(valor) < 0.005 ? 0 : valor;
  if (descritivo) {
    return (
      <span className={cn("font-semibold", v < 0 ? "text-negative" : "text-[#1F8A4C]", className)}>
        {v === 0 ? "Caixa batendo" : v > 0 ? `Sobra de ${formatCurrency(v)}` : `Falta de ${formatCurrency(-v)}`}
      </span>
    );
  }
  return (
    <span className={cn("font-semibold tabular-nums", v < 0 ? "text-negative" : v > 0 ? "text-[#1F8A4C]" : "text-ink-muted", className)}>
      {v > 0 ? "+" : ""}
      {formatCurrency(v)}
    </span>
  );
}
