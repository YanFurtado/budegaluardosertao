import type { Loja } from "@/types";
import type { ProdutoVitrine } from "@/services/vitrine";
import { formatCurrency } from "@/lib/format";

export type ModoRecebimento = "entrega" | "retirada";

export interface DadosPedido {
  nome: string;
  modo: ModoRecebimento;
  endereco: string;
  bairro: string;
  pagamento: string;
  troco: string;
  obs: string;
}

export interface LinhaSacola {
  produto: ProdutoVitrine;
  qtd: number;
}

export const totalSacola = (linhas: LinhaSacola[]) => linhas.reduce((s, l) => s + l.produto.preco * l.qtd, 0);

/** O que impede o envio do pedido (ou "" quando está tudo certo). */
export function problemaPedido(p: { loja: Loja; linhas: LinhaSacola[]; pedidoMinimo: number; dados: DadosPedido; temWhatsApp: boolean }) {
  if (p.loja.pausada) return "A loja está pausada e não está recebendo pedidos agora.";
  if (!p.temWhatsApp) return "A loja ainda não cadastrou o WhatsApp para pedidos.";
  if (!p.linhas.length) return "Adicione pelo menos um produto.";
  if (totalSacola(p.linhas) < p.pedidoMinimo) return `O pedido mínimo é ${formatCurrency(p.pedidoMinimo)}.`;
  if (!p.dados.nome.trim()) return "Informe seu nome.";
  if (p.dados.modo === "entrega" && !p.dados.endereco.trim()) return "Informe o endereço de entrega ou escolha retirar na loja.";
  return "";
}

/** Texto do pedido enviado para o WhatsApp da loja. */
export function mensagemPedido(loja: Loja, linhas: LinhaSacola[], d: DadosPedido) {
  const L = [`*Pedido pelo site · ${loja.nome}*`, ""];
  for (const { produto, qtd } of linhas) L.push(`${qtd}x ${produto.nome} — ${formatCurrency(produto.preco * qtd)}`);
  L.push("", `*Subtotal:* ${formatCurrency(totalSacola(linhas))}`, "");
  L.push(`*Nome:* ${d.nome.trim()}`);
  if (d.modo === "entrega") {
    L.push(`*Entrega:* ${d.endereco.trim()}`);
    if (d.bairro.trim()) L.push(`*Bairro/referência:* ${d.bairro.trim()}`);
  } else {
    L.push(`*Retirada na loja*${loja.endereco ? ` (${loja.endereco})` : ""}`);
  }
  if (d.pagamento) L.push(`*Pagamento:* ${d.pagamento}${d.pagamento === "Dinheiro" && d.troco.trim() ? ` (troco para R$ ${d.troco.trim()})` : ""}`);
  if (d.obs.trim()) L.push(`*Obs.:* ${d.obs.trim()}`);
  return L.join("\n");
}
