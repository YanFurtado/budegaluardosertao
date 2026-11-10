import type { MomentoEntrega, TipoPedido } from "@/types";

/** Listas fixas usadas pelos dados de exemplo e pelos filtros/segmentos da análise de vendas. */

export const TIPOS_PEDIDO: { value: TipoPedido; label: string }[] = [
  { value: "delivery", label: "Delivery" },
  { value: "retirada", label: "Retirada" },
  { value: "no_local", label: "No local" },
];

export const MOMENTOS_ENTREGA: { value: MomentoEntrega; label: string }[] = [
  { value: "imediato", label: "Imediato" },
  { value: "agendado", label: "Agendado" },
];

export const FORMAS_PAGAMENTO = ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Fiado"];

export const CANAIS_VENDA = ["Cardápio digital", "WhatsApp", "Telefone", "Balcão"];

export const ORIGENS = ["Link da loja", "Instagram", "Google", "QR Code", "PDV"];

export const RESPONSAVEIS_ENTREGA = ["João Pedro", "Rafael Santos", "Entrega parceira"];

/** Rótulo usado quando o pedido não tem entregador (retirada / no local). */
export const SEM_RESPONSAVEL = "Não se aplica";

/** Nome exibido quando o pedido não tem cliente identificado. */
export const CONSUMIDOR_FINAL = "Consumidor final";

export const labelTipoPedido = (v: TipoPedido) => TIPOS_PEDIDO.find((t) => t.value === v)?.label ?? v;
export const labelMomentoEntrega = (v: MomentoEntrega) => MOMENTOS_ENTREGA.find((m) => m.value === v)?.label ?? v;
