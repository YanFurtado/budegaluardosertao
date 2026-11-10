import type { Pedido } from "@/types";
import {
  CANAIS_VENDA,
  MOMENTOS_ENTREGA,
  ORIGENS,
  RESPONSAVEIS_ENTREGA,
  SEM_RESPONSAVEL,
  TIPOS_PEDIDO,
} from "@/data/catalogo";
import { formatCurrency } from "@/lib/format";

export type CategoricalFilterKey =
  | "tipo_pedido"
  | "momento_entrega"
  | "canal_venda"
  | "origem"
  | "responsavel_entrega";
export type MoneyFilterKey = "valor_pedido" | "taxa_entrega";
export type TimeFilterKey = "horario_criacao";
export type FilterKey = CategoricalFilterKey | MoneyFilterKey | TimeFilterKey;

export type ActiveFilter =
  | { key: CategoricalFilterKey; values: string[] }
  | { key: MoneyFilterKey; min: number | null; max: number | null }
  | { key: TimeFilterKey; from: string; to: string };

type Option = { value: string; label: string };

type FilterDef =
  | { kind: "categorical"; label: string; options: Option[] }
  | { kind: "money"; label: string }
  | { kind: "time"; label: string };

const asOptions = (list: string[]): Option[] => list.map((v) => ({ value: v, label: v }));

export const FILTER_DEFS: Record<FilterKey, FilterDef> = {
  tipo_pedido: { kind: "categorical", label: "Tipo de pedido", options: TIPOS_PEDIDO },
  momento_entrega: { kind: "categorical", label: "Momento da entrega", options: MOMENTOS_ENTREGA },
  canal_venda: { kind: "categorical", label: "Canal de venda", options: asOptions(CANAIS_VENDA) },
  origem: { kind: "categorical", label: "Origem do pedido", options: asOptions(ORIGENS) },
  responsavel_entrega: {
    kind: "categorical",
    label: "Responsável pela entrega",
    options: asOptions([...RESPONSAVEIS_ENTREGA, SEM_RESPONSAVEL]),
  },
  valor_pedido: { kind: "money", label: "Valor do pedido" },
  taxa_entrega: { kind: "money", label: "Taxa de entrega" },
  horario_criacao: { kind: "time", label: "Horário de criação" },
};

export const FILTER_ORDER: FilterKey[] = [
  "tipo_pedido",
  "momento_entrega",
  "canal_venda",
  "origem",
  "responsavel_entrega",
  "valor_pedido",
  "taxa_entrega",
  "horario_criacao",
];

export function createEmptyFilter(key: FilterKey): ActiveFilter {
  const def = FILTER_DEFS[key];
  if (def.kind === "categorical") return { key: key as CategoricalFilterKey, values: [] };
  if (def.kind === "money") return { key: key as MoneyFilterKey, min: null, max: null };
  return { key: "horario_criacao", from: "", to: "" };
}

export function isFilterEmpty(f: ActiveFilter): boolean {
  if ("values" in f) return f.values.length === 0;
  if ("min" in f) return f.min === null && f.max === null;
  return !f.from && !f.to;
}

/** Texto curto mostrado no chip ("Delivery, Retirada", "R$ 20,00 a R$ 80,00"…). */
export function describeFilter(f: ActiveFilter): string {
  if (isFilterEmpty(f)) return "Todos";
  if ("values" in f) {
    const def = FILTER_DEFS[f.key] as Extract<FilterDef, { kind: "categorical" }>;
    const labels = f.values.map((v) => def.options.find((o) => o.value === v)?.label ?? v);
    return labels.length > 2 ? `${labels.slice(0, 2).join(", ")} +${labels.length - 2}` : labels.join(", ");
  }
  if ("min" in f) {
    if (f.min !== null && f.max !== null) return `${formatCurrency(f.min)} a ${formatCurrency(f.max)}`;
    if (f.min !== null) return `a partir de ${formatCurrency(f.min)}`;
    return `até ${formatCurrency(f.max!)}`;
  }
  if (f.from && f.to) return `${f.from} às ${f.to}`;
  if (f.from) return `a partir das ${f.from}`;
  return `até ${f.to}`;
}

const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
const parseHHmm = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

export function matchesFilter(p: Pedido, f: ActiveFilter): boolean {
  if (isFilterEmpty(f)) return true;

  if ("values" in f) {
    const value = f.key === "responsavel_entrega" ? (p.responsavel_entrega ?? SEM_RESPONSAVEL) : p[f.key];
    return f.values.includes(value);
  }

  if ("min" in f) {
    const value = f.key === "valor_pedido" ? p.total : p.taxa_entrega;
    if (f.min !== null && value < f.min) return false;
    if (f.max !== null && value > f.max) return false;
    return true;
  }

  const m = minutesOfDay(p.criado_em);
  const from = f.from ? parseHHmm(f.from) : 0;
  const to = f.to ? parseHHmm(f.to) : 24 * 60 - 1;
  // Faixa que atravessa a meia-noite (ex.: 22:00 às 02:00)
  return from <= to ? m >= from && m <= to : m >= from || m <= to;
}
