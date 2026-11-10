import type { Pedido } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { comparisonRange, dateOf, type DateField, type DateRange } from "@/features/sales-analysis/dates";
import { matchesFilter, type ActiveFilter } from "@/features/sales-analysis/filters";

/**
 * Ponto único de acesso aos dados da tela "Análise das vendas".
 * Lê os pedidos do store local; para ligar a uma API basta trocar o corpo
 * de `fetchSalesOrders` mantendo o mesmo contrato.
 */

export interface SalesQuery {
  range: DateRange;
  dateField: DateField;
  filters: ActiveFilter[];
}

export interface SalesOrdersResult {
  range: DateRange;
  previousRange: DateRange;
  current: Pedido[];
  previous: Pedido[];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchSalesOrders(query: SalesQuery): Promise<SalesOrdersResult> {
  // Simula latência de rede para exibir os estados de carregamento.
  await wait(300 + Math.random() * 300);

  const previousRange = comparisonRange(query.range);
  const base = useAppStore
    .getState()
    .pedidos.filter((p) => p.status !== "cancelado" && query.filters.every((f) => matchesFilter(p, f)));

  const inRange = (r: DateRange) => (p: Pedido) => {
    const d = dateOf(p, query.dateField);
    return d !== null && d >= r.start && d <= r.end;
  };

  return {
    range: query.range,
    previousRange,
    current: base.filter(inRange(query.range)),
    previous: base.filter(inRange(previousRange)),
  };
}
