import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const currencyShort = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("pt-BR");

/** R$ 1.234,56 */
export const formatCurrency = (value: number) => currency.format(value);

/** R$ 1.235 (para eixos de gráfico) */
export const formatCurrencyShort = (value: number) => currencyShort.format(value);

/** 1.234 */
export const formatInteger = (value: number) => integer.format(value);

/** 43% */
export const formatPercent = (value: number, digits = 0) =>
  `${(value * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })}%`;

/** 04/11/2026 00:00 */
export const formatDateTime = (date: Date) => format(date, "dd/MM/yyyy HH:mm");

/** 04/11 */
export const formatDayMonth = (date: Date) => format(date, "dd/MM");

/** 20h30 */
export const formatHourLabel = (hhmm: string) => hhmm.replace(":", "h");

export const formatPt = (date: Date, pattern: string) => format(date, pattern, { locale: ptBR });
