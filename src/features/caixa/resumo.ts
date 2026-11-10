import { differenceInMinutes } from "date-fns";
import type { Pedido, SessaoCaixa } from "@/types";
import { FORMAS_PAGAMENTO } from "@/data/catalogo";
import { round2 } from "@/lib/pedidos";

export interface VendaPorForma {
  forma: string;
  total: number;
  pedidos: number;
}

export interface ResumoSessao {
  inicio: Date;
  fim: Date;
  aberta: boolean;
  pedidos: Pedido[];
  qtdPedidos: number;
  vendas: number;
  porForma: VendaPorForma[];
  vendasDinheiro: number;
  suprimentos: number;
  sangrias: number;
  /** inicial + vendas em dinheiro + suprimentos − sangrias */
  dinheiroEsperado: number;
  contado: number | null;
  /** contado − esperado (só quando a sessão está fechada) */
  diferenca: number | null;
}

/** Vendas do turno: pedidos criados entre a abertura e o fechamento (ou agora), sem cancelados. */
export function resumoSessao(sessao: SessaoCaixa, pedidos: Pedido[], agora = new Date()): ResumoSessao {
  const inicio = sessao.aberto_em;
  const fim = sessao.fechado_em ?? agora;
  const doTurno = pedidos.filter((p) => p.status !== "cancelado" && p.criado_em >= inicio && p.criado_em <= fim);

  const mapa = new Map<string, VendaPorForma>();
  for (const p of doTurno) {
    const v = mapa.get(p.forma_pagamento) ?? { forma: p.forma_pagamento, total: 0, pedidos: 0 };
    v.total = round2(v.total + p.total);
    v.pedidos += 1;
    mapa.set(p.forma_pagamento, v);
  }
  const ordem = (f: string) => {
    const i = FORMAS_PAGAMENTO.indexOf(f);
    return i < 0 ? 99 : i;
  };
  const porForma = [...mapa.values()].sort((a, b) => b.total - a.total || ordem(a.forma) - ordem(b.forma));

  const vendas = round2(doTurno.reduce((s, p) => s + p.total, 0));
  const vendasDinheiro = mapa.get("Dinheiro")?.total ?? 0;
  const suprimentos = round2(sessao.movimentos.filter((m) => m.tipo === "suprimento").reduce((s, m) => s + m.valor, 0));
  const sangrias = round2(sessao.movimentos.filter((m) => m.tipo === "sangria").reduce((s, m) => s + m.valor, 0));
  const dinheiroEsperado = round2(sessao.valor_inicial + vendasDinheiro + suprimentos - sangrias);
  const contado = sessao.fechado_em ? sessao.valor_contado : null;

  return {
    inicio,
    fim,
    aberta: !sessao.fechado_em,
    pedidos: doTurno,
    qtdPedidos: doTurno.length,
    vendas,
    porForma,
    vendasDinheiro,
    suprimentos,
    sangrias,
    dinheiroEsperado,
    contado,
    diferenca: contado === null ? null : round2(contado - dinheiroEsperado),
  };
}

/** "5h 32min", "48min" */
export function duracao(inicio: Date, fim: Date) {
  const min = Math.max(0, differenceInMinutes(fim, inicio));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min`;
}
