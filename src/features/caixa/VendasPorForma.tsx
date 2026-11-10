import { formatCurrency, formatInteger } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import type { VendaPorForma } from "./resumo";

/** Barras horizontais com o total vendido por forma de pagamento. */
export function VendasPorForma({ itens }: { itens: VendaPorForma[] }) {
  if (!itens.length) return <EmptyState message="Nenhuma venda neste turno" />;
  const max = Math.max(...itens.map((i) => i.total), 1);
  return (
    <ul className="flex flex-col gap-3">
      {itens.map((i) => (
        <li key={i.forma}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="font-semibold">{i.forma}</span>
            <span className="tabular-nums">
              {formatCurrency(i.total)}{" "}
              <span className="text-[12px] text-ink-muted">
                · {formatInteger(i.pedidos)} {i.pedidos === 1 ? "pedido" : "pedidos"}
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-chart-primary" style={{ width: `${(i.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
