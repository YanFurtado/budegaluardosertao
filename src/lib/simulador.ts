import type { TipoPedido } from "@/types";
import type { AppState } from "@/store/useAppStore";
import type { NovoPedidoInput } from "./pedidos";
import { sortearItens } from "./sortearItens";

/**
 * Modo demonstração: monta um pedido "recebido pelo cardápio digital" com
 * dados do próprio store (produtos ativos, clientes, zonas de entrega).
 */
export function gerarPedidoSimulado(s: AppState): NovoPedidoInput | null {
  const categoriasAtivas = new Set(s.categorias.filter((c) => c.ativa).map((c) => c.id));
  const produtos = s.produtos.filter((p) => p.ativo && categoriasAtivas.has(p.categoria_id));
  if (!produtos.length) return null;

  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  const bairrosAtivos = new Set(s.zonas.filter((z) => z.ativa).map((z) => z.bairro));
  const clientesDelivery = s.clientes.filter((c) => c.bairro && bairrosAtivos.has(c.bairro));

  const r = Math.random();
  let tipo: TipoPedido = r < 0.6 ? "delivery" : r < 0.85 ? "retirada" : "no_local";
  if (tipo === "delivery" && !clientesDelivery.length) tipo = "retirada";

  const cliente =
    tipo === "delivery" ? pick(clientesDelivery) : tipo === "retirada" && s.clientes.length ? pick(s.clientes) : null;

  const itens = sortearItens(produtos, Math.random, s.configEntrega.pedido_minimo);

  const formas = s.config.formas_pagamento.filter((f) => f !== "Fiado");
  return {
    tipo_pedido: tipo,
    cliente_id: cliente?.id ?? null,
    endereco: cliente?.endereco ?? null,
    bairro: tipo === "delivery" ? cliente!.bairro : null,
    itens,
    forma_pagamento: formas.length ? pick(formas) : "Pix",
    canal_venda: tipo === "no_local" ? "Cardápio digital" : Math.random() < 0.65 ? "Cardápio digital" : "WhatsApp",
    origem: tipo === "no_local" ? "QR Code" : pick(["Link da loja", "Instagram", "Google"]),
    status: s.config.aceitar_automaticamente ? "em_preparo" : "pendente",
    externo: true,
  };
}
