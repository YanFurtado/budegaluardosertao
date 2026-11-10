import type { Cliente, LancamentoFiado } from "@/types";
import { round2 } from "@/lib/pedidos";

export interface ContaFiado {
  cliente: Cliente;
  saldo: number;
  limite: number;
  /** saldo / limite (null quando não há limite). */
  uso: number | null;
  ultimaCompra: Date | null;
  ultimoPagamento: Date | null;
  lancamentos: LancamentoFiado[];
}

/** Clientes com fiado liberado ou com saldo em aberto. */
export function contasFiado(clientes: Cliente[], fiado: LancamentoFiado[]): ContaFiado[] {
  const porCliente = new Map<string, LancamentoFiado[]>();
  for (const l of fiado) {
    const lista = porCliente.get(l.cliente_id) ?? [];
    lista.push(l);
    porCliente.set(l.cliente_id, lista);
  }

  const contas: ContaFiado[] = [];
  for (const cliente of clientes) {
    const lancamentos = (porCliente.get(cliente.id) ?? []).sort((a, b) => a.em.getTime() - b.em.getTime());
    const saldo = round2(lancamentos.reduce((s, l) => s + (l.tipo === "compra" ? l.valor : -l.valor), 0));
    if (cliente.limite_fiado <= 0 && Math.abs(saldo) < 0.005) continue;
    const ultima = (tipo: LancamentoFiado["tipo"]) => {
      for (let i = lancamentos.length - 1; i >= 0; i--) if (lancamentos[i].tipo === tipo) return lancamentos[i].em;
      return null;
    };
    contas.push({
      cliente,
      saldo,
      limite: cliente.limite_fiado,
      uso: cliente.limite_fiado > 0 ? Math.max(0, saldo) / cliente.limite_fiado : null,
      ultimaCompra: ultima("compra"),
      ultimoPagamento: ultima("pagamento"),
      lancamentos,
    });
  }
  return contas;
}

export interface LinhaExtrato {
  lancamento: LancamentoFiado;
  saldo: number;
}

/** Lançamentos em ordem cronológica com o saldo acumulado após cada um. */
export function extrato(lancamentos: LancamentoFiado[]): LinhaExtrato[] {
  let saldo = 0;
  return [...lancamentos]
    .sort((a, b) => a.em.getTime() - b.em.getTime())
    .map((l) => {
      saldo = round2(saldo + (l.tipo === "compra" ? l.valor : -l.valor));
      return { lancamento: l, saldo };
    });
}
