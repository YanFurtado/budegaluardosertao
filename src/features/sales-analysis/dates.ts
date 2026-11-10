import { differenceInCalendarDays } from "date-fns";
import type { Pedido } from "@/types";
import type { DateRange } from "@/lib/dateRange";

export { comparisonRange, DATE_PRESETS, sameRange, type DateRange, type PresetKey } from "@/lib/dateRange";

export type DateField = "criacao" | "fechamento" | "agendamento";

export const DATE_FIELD_OPTIONS: { value: DateField; label: string }[] = [
  { value: "criacao", label: "Filtrar por data de criação" },
  { value: "fechamento", label: "Filtrar por data de fechamento" },
  { value: "agendamento", label: "Filtrar por data de agendamento" },
];

export function dateOf(p: Pedido, field: DateField): Date | null {
  if (field === "fechamento") return p.fechado_em;
  if (field === "agendamento") return p.agendado_para;
  return p.criado_em;
}

/** Agrupamento sugerido para o tamanho do período. */
export function suggestedGroupBy(range: DateRange): "hora" | "dia" | "semana" | "mes" {
  const days = differenceInCalendarDays(range.end, range.start) + 1;
  if (days <= 1) return "hora";
  if (days <= 31) return "dia";
  if (days <= 120) return "semana";
  return "mes";
}
