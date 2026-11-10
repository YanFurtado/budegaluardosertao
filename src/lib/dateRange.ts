import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";

export interface DateRange {
  start: Date;
  end: Date;
}

/** Período de comparação: mesmo tamanho, imediatamente anterior. */
export function comparisonRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - duration);
  return { start, end };
}

export type PresetKey = "hoje" | "ontem" | "7d" | "30d" | "este_mes" | "mes_passado";

export const DATE_PRESETS: { key: PresetKey; label: string; get: (now: Date) => DateRange }[] = [
  { key: "hoje", label: "Hoje", get: (n) => ({ start: startOfDay(n), end: endOfDay(n) }) },
  {
    key: "ontem",
    label: "Ontem",
    get: (n) => ({ start: startOfDay(subDays(n, 1)), end: endOfDay(subDays(n, 1)) }),
  },
  { key: "7d", label: "Últimos 7 dias", get: (n) => ({ start: startOfDay(subDays(n, 6)), end: endOfDay(n) }) },
  { key: "30d", label: "Últimos 30 dias", get: (n) => ({ start: startOfDay(subDays(n, 29)), end: endOfDay(n) }) },
  { key: "este_mes", label: "Este mês", get: (n) => ({ start: startOfMonth(n), end: endOfDay(n) }) },
  {
    key: "mes_passado",
    label: "Mês passado",
    get: (n) => ({ start: startOfMonth(subMonths(n, 1)), end: endOfMonth(subMonths(n, 1)) }),
  },
];

export function sameRange(a: DateRange, b: DateRange) {
  return a.start.getTime() === b.start.getTime() && a.end.getTime() === b.end.getTime();
}

export const inRange = (d: Date | null | undefined, r: DateRange) => !!d && d >= r.start && d <= r.end;
