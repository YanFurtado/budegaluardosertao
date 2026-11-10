import type { Pedido } from "@/types";
import {
  CANAIS_VENDA,
  FORMAS_PAGAMENTO,
  MOMENTOS_ENTREGA,
  ORIGENS,
  RESPONSAVEIS_ENTREGA,
  SEM_RESPONSAVEL,
  TIPOS_PEDIDO,
  labelMomentoEntrega,
  labelTipoPedido,
} from "@/data/catalogo";

export type SegmentGroup =
  | "forma_pagamento"
  | "tipo_pedido"
  | "momento_entrega"
  | "canal_venda"
  | "origem"
  | "responsavel_entrega";

/**
 * `segments` define a ordem fixa (e portanto a cor) de cada segmento.
 * A cor acompanha o segmento, nunca a posição no ranking.
 */
export const SEGMENT_GROUPS: { value: SegmentGroup; label: string; column: string; segments: string[] }[] = [
  { value: "forma_pagamento", label: "forma de pagamento", column: "Forma de pagamento", segments: FORMAS_PAGAMENTO },
  { value: "tipo_pedido", label: "tipo de pedido", column: "Tipo de pedido", segments: TIPOS_PEDIDO.map((t) => t.label) },
  {
    value: "momento_entrega",
    label: "momento da entrega",
    column: "Momento da entrega",
    segments: MOMENTOS_ENTREGA.map((m) => m.label),
  },
  { value: "canal_venda", label: "canal de vendas", column: "Canal de vendas", segments: CANAIS_VENDA },
  { value: "origem", label: "origem do pedido", column: "Origem do pedido", segments: ORIGENS },
  {
    value: "responsavel_entrega",
    label: "responsável pela entrega",
    column: "Responsável pela entrega",
    segments: [...RESPONSAVEIS_ENTREGA, SEM_RESPONSAVEL],
  },
];

/** Paleta categórica validada (CVD) — ordem fixa. */
export const SEGMENT_COLORS = ["#6CB2EB", "#F29A3F", "#2BA89E", "#8E5BD9", "#C9A227"];
const FALLBACK_COLOR = "#9CA3AF";

export function segmentColor(group: SegmentGroup, segment: string): string {
  const idx = SEGMENT_GROUPS.find((g) => g.value === group)!.segments.indexOf(segment);
  return idx >= 0 && idx < SEGMENT_COLORS.length ? SEGMENT_COLORS[idx] : FALLBACK_COLOR;
}

export function segmentOf(p: Pedido, group: SegmentGroup): string {
  switch (group) {
    case "tipo_pedido":
      return labelTipoPedido(p.tipo_pedido);
    case "momento_entrega":
      return labelMomentoEntrega(p.momento_entrega);
    case "responsavel_entrega":
      return p.responsavel_entrega ?? SEM_RESPONSAVEL;
    default:
      return p[group];
  }
}
