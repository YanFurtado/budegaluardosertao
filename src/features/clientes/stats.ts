import type { Pedido } from "@/types";
import { round2 } from "@/lib/pedidos";

export interface ClienteStats {
  pedidos: number;
  total: number;
  ticket: number;
  primeiroPedido: Date | null;
  ultimoPedido: Date | null;
}

export const STATS_VAZIO: ClienteStats = { pedidos: 0, total: 0, ticket: 0, primeiroPedido: null, ultimoPedido: null };

/** Estatísticas por cliente (sem pedidos cancelados). */
export function statsPorCliente(pedidos: Pedido[]): Map<string, ClienteStats> {
  const m = new Map<string, ClienteStats>();
  for (const p of pedidos) {
    if (!p.cliente_id || p.status === "cancelado") continue;
    const s = m.get(p.cliente_id) ?? { ...STATS_VAZIO };
    s.pedidos += 1;
    s.total = round2(s.total + p.total);
    if (!s.primeiroPedido || p.criado_em < s.primeiroPedido) s.primeiroPedido = p.criado_em;
    if (!s.ultimoPedido || p.criado_em > s.ultimoPedido) s.ultimoPedido = p.criado_em;
    m.set(p.cliente_id, s);
  }
  for (const s of m.values()) s.ticket = s.pedidos ? round2(s.total / s.pedidos) : 0;
  return m;
}
