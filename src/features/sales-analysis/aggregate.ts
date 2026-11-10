import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Funcionario, Pedido } from "@/types";
import { dateOf, type DateField, type DateRange } from "./dates";
import { SEGMENT_GROUPS, segmentColor, segmentOf, type SegmentGroup } from "./segments";

/* ------------------------------------------------------------------ */
/* Composição do faturamento                                          */
/* ------------------------------------------------------------------ */

export type RevenueComponent =
  | "total_produtos"
  | "taxa_entrega"
  | "taxa_servico"
  | "taxas_adicionais"
  | "taxa_maquineta"
  | "desconto";

export const REVENUE_COMPONENTS: { key: RevenueComponent; label: string; sign: "base" | "+" | "-" }[] = [
  { key: "total_produtos", label: "Total dos produtos", sign: "base" },
  { key: "taxa_entrega", label: "Taxas de entrega", sign: "+" },
  { key: "taxa_servico", label: "Taxas de serviço", sign: "+" },
  { key: "taxas_adicionais", label: "Taxas adicionais", sign: "+" },
  { key: "taxa_maquineta", label: "Taxas da maquineta", sign: "+" },
  { key: "desconto", label: "Total de descontos", sign: "-" },
];

export type ComponentToggles = Record<RevenueComponent, boolean>;

export const ALL_COMPONENTS_ON: ComponentToggles = {
  total_produtos: true,
  taxa_entrega: true,
  taxa_servico: true,
  taxas_adicionais: true,
  taxa_maquineta: true,
  desconto: true,
};

/** Faturamento = produtos + entrega + serviço + adicionais + maquineta − descontos (só itens ativos). */
export function revenueOf(p: Pedido, t: ComponentToggles): number {
  let v = 0;
  if (t.total_produtos) v += p.total_produtos;
  if (t.taxa_entrega) v += p.taxa_entrega;
  if (t.taxa_servico) v += p.taxa_servico;
  if (t.taxas_adicionais) v += p.taxas_adicionais;
  if (t.taxa_maquineta) v += p.taxa_maquineta;
  if (t.desconto) v -= p.desconto;
  return v;
}

export function componentTotals(orders: Pedido[]): Record<RevenueComponent, number> {
  const totals: Record<RevenueComponent, number> = {
    total_produtos: 0,
    taxa_entrega: 0,
    taxa_servico: 0,
    taxas_adicionais: 0,
    taxa_maquineta: 0,
    desconto: 0,
  };
  for (const p of orders) {
    for (const c of REVENUE_COMPONENTS) totals[c.key] += p[c.key];
  }
  return totals;
}

/* ------------------------------------------------------------------ */
/* KPIs                                                               */
/* ------------------------------------------------------------------ */

export type Metric = "faturamento" | "pedidos" | "ticket";

export const METRIC_LABELS: Record<Metric, string> = {
  faturamento: "Faturamento",
  pedidos: "Pedidos",
  ticket: "Ticket médio",
};

export type Kpis = Record<Metric, number>;

export function computeKpis(orders: Pedido[], t: ComponentToggles): Kpis {
  const faturamento = orders.reduce((s, p) => s + revenueOf(p, t), 0);
  const pedidos = orders.length;
  return { faturamento, pedidos, ticket: pedidos ? faturamento / pedidos : 0 };
}

/** Variação relativa; `null` quando não há base de comparação. */
export function variation(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

/* ------------------------------------------------------------------ */
/* Série temporal (gráfico de evolução)                               */
/* ------------------------------------------------------------------ */

export type GroupBy = "hora" | "dia" | "dia_semana" | "semana" | "mes";

export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "hora", label: "Agrupar por hora" },
  { value: "dia", label: "Agrupar por dia" },
  { value: "dia_semana", label: "Agrupar por dia da semana" },
  { value: "semana", label: "Agrupar por semana" },
  { value: "mes", label: "Agrupar por mês" },
];

export const GROUP_BY_SHORT: Record<GroupBy, string> = {
  hora: "por hora",
  dia: "por dia",
  dia_semana: "por dia da semana",
  semana: "por semana",
  mes: "por mês",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Bucketer {
  count: number;
  indexOf: (d: Date) => number;
  label: (i: number) => string;
}

function makeBucketer(groupBy: GroupBy, range: DateRange): Bucketer {
  const { start, end } = range;
  switch (groupBy) {
    case "hora":
      return { count: 24, indexOf: (d) => d.getHours(), label: (i) => `${String(i).padStart(2, "0")}h` };
    case "dia_semana":
      return { count: 7, indexOf: (d) => d.getDay(), label: (i) => WEEKDAYS[i] };
    case "dia":
      return {
        count: differenceInCalendarDays(end, start) + 1,
        indexOf: (d) => differenceInCalendarDays(d, start),
        label: (i) => format(addDays(start, i), "dd/MM"),
      };
    case "semana":
      return {
        count: Math.floor(differenceInCalendarDays(end, start) / 7) + 1,
        indexOf: (d) => Math.floor(differenceInCalendarDays(d, start) / 7),
        label: (i) => format(addDays(start, i * 7), "dd/MM"),
      };
    case "mes":
      return {
        count: differenceInCalendarMonths(end, start) + 1,
        indexOf: (d) => differenceInCalendarMonths(d, start),
        label: (i) => format(addMonths(start, i), "MMM/yy", { locale: ptBR }),
      };
  }
}

export interface SeriesPoint {
  label: string;
  currentLabel: string;
  previousLabel: string;
  /** `null` = ticket médio sem pedidos no intervalo (lacuna, não zero). */
  current: number | null;
  previous: number | null;
}

export function buildSeries(args: {
  current: Pedido[];
  previous: Pedido[];
  range: DateRange;
  previousRange: DateRange;
  groupBy: GroupBy;
  dateField: DateField;
  metric: Metric;
  toggles: ComponentToggles;
}): SeriesPoint[] {
  const { current, previous, range, previousRange, groupBy, dateField, metric, toggles } = args;
  const curB = makeBucketer(groupBy, range);
  const prevB = makeBucketer(groupBy, previousRange);
  const n = curB.count;

  const accumulate = (orders: Pedido[], b: Bucketer) => {
    const revenue = new Array<number>(n).fill(0);
    const count = new Array<number>(n).fill(0);
    for (const p of orders) {
      const d = dateOf(p, dateField);
      if (!d) continue;
      const i = b.indexOf(d);
      if (i < 0 || i >= n) continue;
      revenue[i] += revenueOf(p, toggles);
      count[i] += 1;
    }
    return revenue.map((r, i): number | null => {
      if (metric === "faturamento") return r;
      if (metric === "pedidos") return count[i];
      return count[i] ? r / count[i] : null;
    });
  };

  const cur = accumulate(current, curB);
  const prev = accumulate(previous, prevB);

  return cur.map((value, i) => ({
    label: curB.label(i),
    currentLabel: curB.label(i),
    previousLabel: prevB.label(i),
    current: value,
    previous: prev[i],
  }));
}

/* ------------------------------------------------------------------ */
/* Segmentação, funcionários e bairros                                */
/* ------------------------------------------------------------------ */

export interface SegmentRow {
  segment: string;
  color: string;
  faturamento: number;
  pedidos: number;
  ticket: number;
  share: number;
}

export function segmentBreakdown(orders: Pedido[], group: SegmentGroup, t: ComponentToggles): SegmentRow[] {
  const map = new Map<string, { faturamento: number; pedidos: number }>();
  for (const p of orders) {
    const key = segmentOf(p, group);
    const row = map.get(key) ?? { faturamento: 0, pedidos: 0 };
    row.faturamento += revenueOf(p, t);
    row.pedidos += 1;
    map.set(key, row);
  }
  const total = [...map.values()].reduce((s, r) => s + Math.max(r.faturamento, 0), 0);
  const order = SEGMENT_GROUPS.find((g) => g.value === group)!.segments;

  return [...map.entries()]
    .map(([segment, r]) => ({
      segment,
      color: segmentColor(group, segment),
      faturamento: r.faturamento,
      pedidos: r.pedidos,
      ticket: r.pedidos ? r.faturamento / r.pedidos : 0,
      share: total > 0 ? Math.max(r.faturamento, 0) / total : 0,
    }))
    .sort((a, b) => order.indexOf(a.segment) - order.indexOf(b.segment));
}

export interface EmployeeRow {
  id: string;
  nome: string;
  faturamento: number;
  pedidos: number;
}

/** Usa o total do pedido (inclui todas as taxas e descontos). */
export function byEmployee(orders: Pedido[], funcionarios: Funcionario[]): EmployeeRow[] {
  const map = new Map<string, EmployeeRow>();
  for (const p of orders) {
    const row = map.get(p.funcionario_id) ?? {
      id: p.funcionario_id,
      nome: funcionarios.find((f) => f.id === p.funcionario_id)?.nome ?? "Sem funcionário",
      faturamento: 0,
      pedidos: 0,
    };
    row.faturamento += p.total;
    row.pedidos += 1;
    map.set(p.funcionario_id, row);
  }
  const order = funcionarios.map((f) => f.id);
  return [...map.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

export interface NeighborhoodRow {
  bairro: string;
  faturamento: number;
  pedidos: number;
  ticket: number;
  totalTaxas: number;
  taxaMedia: number;
}

/** Só pedidos de delivery; usa o total do pedido. */
export function byNeighborhood(orders: Pedido[]): NeighborhoodRow[] {
  const map = new Map<string, { faturamento: number; pedidos: number; taxas: number }>();
  for (const p of orders) {
    if (p.tipo_pedido !== "delivery") continue;
    const key = p.bairro ?? "Sem bairro";
    const row = map.get(key) ?? { faturamento: 0, pedidos: 0, taxas: 0 };
    row.faturamento += p.total;
    row.pedidos += 1;
    row.taxas += p.taxa_entrega;
    map.set(key, row);
  }
  return [...map.entries()].map(([bairro, r]) => ({
    bairro,
    faturamento: r.faturamento,
    pedidos: r.pedidos,
    ticket: r.faturamento / r.pedidos,
    totalTaxas: r.taxas,
    taxaMedia: r.taxas / r.pedidos,
  }));
}
