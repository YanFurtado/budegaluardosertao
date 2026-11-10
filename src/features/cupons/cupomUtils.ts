import { format } from "date-fns";
import type { Cupom, TipoCupom } from "@/types";
import type { Tom } from "@/lib/pedidos";
import { formatCurrency } from "@/lib/format";

export type StatusCupom = "ativo" | "agendado" | "expirado" | "esgotado" | "desativado";

export const STATUS_CUPOM: Record<StatusCupom, { label: string; tom: Tom }> = {
  ativo: { label: "Ativo", tom: "green" },
  agendado: { label: "Agendado", tom: "blue" },
  expirado: { label: "Expirado", tom: "red" },
  esgotado: { label: "Esgotado", tom: "orange" },
  desativado: { label: "Desativado", tom: "gray" },
};

export function statusCupom(c: Cupom, usos: number, agora = new Date()): StatusCupom {
  if (!c.ativo) return "desativado";
  if (c.fim && c.fim < agora) return "expirado";
  if (c.limite_usos !== null && usos >= c.limite_usos) return "esgotado";
  if (c.inicio > agora) return "agendado";
  return "ativo";
}

const fmtPercent = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** "10%", "R$ 8,00", "Frete grátis". */
export function beneficio(tipo: TipoCupom, valor: number) {
  if (tipo === "frete_gratis") return "Frete grátis";
  if (tipo === "percentual") return fmtPercent(valor);
  return formatCurrency(valor);
}

export function validade(c: Pick<Cupom, "inicio" | "fim">, agora = new Date()) {
  const ini = c.inicio > agora ? `A partir de ${format(c.inicio, "dd/MM/yyyy")}` : null;
  const fim = c.fim ? `até ${format(c.fim, "dd/MM/yyyy")}` : "sem data de fim";
  return ini ? `${ini}, ${fim}` : fim.charAt(0).toUpperCase() + fim.slice(1);
}

/** Frase de prévia: "10% de desconto em pedidos a partir de R$ 40,00, válido até 30/11/2026." */
export function frasePrevia(d: {
  tipo: TipoCupom;
  valor: number | null;
  pedido_minimo: number;
  inicio: Date | null;
  fim: Date | null;
  limite_usos: number | null;
  primeira_compra: boolean;
}) {
  const v = d.valor ?? 0;
  const base =
    d.tipo === "frete_gratis"
      ? "Entrega grátis"
      : d.tipo === "percentual"
        ? `${fmtPercent(v)} de desconto`
        : `${formatCurrency(v)} de desconto`;
  const minimo = d.pedido_minimo > 0 ? ` em pedidos a partir de ${formatCurrency(d.pedido_minimo)}` : " em qualquer pedido";
  const delivery = d.tipo === "frete_gratis" ? " de delivery" : "";
  const primeira = d.primeira_compra ? ", só na primeira compra do cliente" : "";
  const agora = new Date();
  const inicio = d.inicio && d.inicio > agora ? `, a partir de ${format(d.inicio, "dd/MM/yyyy")}` : "";
  const fim = d.fim ? `, válido até ${format(d.fim, "dd/MM/yyyy")}` : ", sem data para acabar";
  const limite = d.limite_usos ? ` Limite de ${d.limite_usos} ${d.limite_usos === 1 ? "uso" : "usos"}.` : "";
  return `${base}${minimo}${delivery}${primeira}${inicio}${fim}.${limite}`;
}

export async function copiarCodigo(codigo: string) {
  await navigator.clipboard.writeText(codigo);
}
