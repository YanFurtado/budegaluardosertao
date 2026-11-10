import type {
  ConfigEntrega,
  Cupom,
  ItemPedido,
  MomentoEntrega,
  Pedido,
  StatusPedido,
  TipoPedido,
  ZonaEntrega,
} from "@/types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Status                                                             */
/* ------------------------------------------------------------------ */

export type Tom = "gray" | "blue" | "green" | "red" | "orange" | "purple" | "teal";

export const STATUS_PEDIDO: Record<StatusPedido, { label: string; tom: Tom }> = {
  pendente: { label: "Em análise", tom: "orange" },
  em_preparo: { label: "Em preparo", tom: "blue" },
  pronto: { label: "Pronto", tom: "purple" },
  em_entrega: { label: "Saiu para entrega", tom: "teal" },
  concluido: { label: "Concluído", tom: "green" },
  cancelado: { label: "Cancelado", tom: "red" },
};

/** Status que aparecem no quadro da Gestão de pedidos. */
export const STATUS_ATIVOS: StatusPedido[] = ["pendente", "em_preparo", "pronto", "em_entrega"];

export function proximoStatus(p: Pick<Pedido, "status" | "tipo_pedido">): StatusPedido | null {
  switch (p.status) {
    case "pendente":
      return "em_preparo";
    case "em_preparo":
      return "pronto";
    case "pronto":
      return p.tipo_pedido === "delivery" ? "em_entrega" : "concluido";
    case "em_entrega":
      return "concluido";
    default:
      return null;
  }
}

/** Texto do botão que avança o pedido para o próximo status. */
export function rotuloAvancar(p: Pick<Pedido, "status" | "tipo_pedido">): string | null {
  switch (p.status) {
    case "pendente":
      return "Aceitar pedido";
    case "em_preparo":
      return "Marcar como pronto";
    case "pronto":
      return p.tipo_pedido === "delivery" ? "Saiu para entrega" : p.tipo_pedido === "retirada" ? "Cliente retirou" : "Entregue na mesa";
    case "em_entrega":
      return "Confirmar entrega";
    default:
      return null;
  }
}

export const MOTIVOS_CANCELAMENTO = [
  "Cliente desistiu",
  "Produto indisponível",
  "Endereço fora da área de entrega",
  "Pagamento não aprovado",
  "Loja sem condições de atender",
  "Pedido duplicado",
];

/* ------------------------------------------------------------------ */
/* Novo pedido e cálculo de valores                                   */
/* ------------------------------------------------------------------ */

export interface NovoPedidoInput {
  tipo_pedido: TipoPedido;
  momento_entrega?: MomentoEntrega;
  agendado_para?: Date | null;
  canal_venda?: string;
  origem?: string;
  forma_pagamento: string;
  troco_para?: number | null;
  cliente_id: string | null;
  cliente_nome?: string;
  cliente_telefone?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  itens: ItemPedido[];
  observacao?: string | null;
  cupom_codigo?: string | null;
  taxas_adicionais?: number;
  /** Status inicial (padrão: em_preparo — pedido lançado pela própria loja já está aceito). */
  status?: StatusPedido;
  funcionario_id?: string;
  /** Pedido recebido de fora (cardápio digital, WhatsApp…): não entra no registro de atividades da equipe. */
  externo?: boolean;
}

export interface ContextoPreco {
  zonas: ZonaEntrega[];
  configEntrega: ConfigEntrega;
  cupons: Cupom[];
  pedidos: Pedido[];
}

export const subtotalItens = (itens: ItemPedido[]) =>
  round2(itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0));

export function taxaEntregaPara(bairro: string | null | undefined, subtotal: number, ctx: ContextoPreco): number {
  if (!bairro) return 0;
  const zona = ctx.zonas.find((z) => z.ativa && z.bairro === bairro);
  if (!zona) return 0;
  const gratis = ctx.configEntrega.frete_gratis_acima;
  if (gratis !== null && subtotal >= gratis) return 0;
  return zona.taxa;
}

export const usosCupom = (codigo: string, pedidos: Pedido[]) =>
  pedidos.filter((p) => p.status !== "cancelado" && p.cupom_codigo?.toUpperCase() === codigo.toUpperCase()).length;

export type ResultadoCupom = { ok: true; cupom: Cupom; desconto: number } | { ok: false; erro: string };

export function validarCupom(
  codigo: string,
  dados: { subtotal: number; taxaEntrega: number; clienteId: string | null; tipo: TipoPedido },
  ctx: ContextoPreco,
  agora = new Date(),
): ResultadoCupom {
  const cupom = ctx.cupons.find((c) => c.codigo.toUpperCase() === codigo.trim().toUpperCase());
  if (!cupom) return { ok: false, erro: "Cupom não encontrado" };
  if (!cupom.ativo) return { ok: false, erro: "Cupom desativado" };
  if (cupom.inicio > agora) return { ok: false, erro: "Cupom ainda não está valendo" };
  if (cupom.fim && cupom.fim < agora) return { ok: false, erro: "Cupom expirado" };
  if (cupom.limite_usos !== null && usosCupom(cupom.codigo, ctx.pedidos) >= cupom.limite_usos)
    return { ok: false, erro: "Limite de usos atingido" };
  if (dados.subtotal < cupom.pedido_minimo)
    return { ok: false, erro: `Pedido mínimo de R$ ${cupom.pedido_minimo.toFixed(2).replace(".", ",")}` };
  if (cupom.primeira_compra) {
    if (!dados.clienteId) return { ok: false, erro: "Válido só para a primeira compra de um cliente identificado" };
    const jaComprou = ctx.pedidos.some((p) => p.cliente_id === dados.clienteId && p.status !== "cancelado");
    if (jaComprou) return { ok: false, erro: "Válido só na primeira compra" };
  }
  if (cupom.tipo === "frete_gratis") {
    if (dados.tipo !== "delivery") return { ok: false, erro: "Frete grátis vale só para delivery" };
    return { ok: true, cupom, desconto: dados.taxaEntrega };
  }
  const desconto =
    cupom.tipo === "percentual" ? round2((dados.subtotal * cupom.valor) / 100) : Math.min(cupom.valor, dados.subtotal);
  return { ok: true, cupom, desconto };
}

export interface TotaisPedido {
  total_produtos: number;
  taxa_entrega: number;
  taxa_servico: number;
  taxas_adicionais: number;
  taxa_maquineta: number;
  desconto: number;
  total: number;
  /** Preenchido quando o cupom informado é inválido (o desconto fica 0). */
  erroCupom: string | null;
}

/** Mesmo cálculo usado pelo store ao criar o pedido — use para mostrar a prévia na tela. */
export function calcularTotaisPedido(input: NovoPedidoInput, ctx: ContextoPreco, agora = new Date()): TotaisPedido {
  const total_produtos = subtotalItens(input.itens);
  const taxa_entrega = input.tipo_pedido === "delivery" ? taxaEntregaPara(input.bairro, total_produtos, ctx) : 0;
  const taxa_servico = input.tipo_pedido === "no_local" ? round2(total_produtos * 0.1) : 0;
  const taxas_adicionais = round2(input.taxas_adicionais ?? 0);
  const taxa_maquineta = 0;

  let desconto = 0;
  let erroCupom: string | null = null;
  if (input.cupom_codigo?.trim()) {
    const r = validarCupom(
      input.cupom_codigo,
      { subtotal: total_produtos, taxaEntrega: taxa_entrega, clienteId: input.cliente_id, tipo: input.tipo_pedido },
      ctx,
      agora,
    );
    if (r.ok) desconto = r.desconto;
    else erroCupom = r.erro;
  }

  const total = round2(total_produtos + taxa_entrega + taxa_servico + taxas_adicionais + taxa_maquineta - desconto);
  return { total_produtos, taxa_entrega, taxa_servico, taxas_adicionais, taxa_maquineta, desconto, total, erroCupom };
}

/** Preço efetivo do produto (promocional quando houver). */
export const precoVenda = (p: { preco: number; preco_promocional: number | null }) => p.preco_promocional ?? p.preco;

/** Resumo curto dos itens: "2x Baião de dois, 1x Suco de cajá". */
export const resumoItens = (itens: ItemPedido[]) => itens.map((i) => `${i.quantidade}x ${i.nome}`).join(", ");
