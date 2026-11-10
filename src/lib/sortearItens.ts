import type { ItemPedido, Produto } from "@/types";
import { precoVenda } from "./pedidos";

/**
 * Itens de um pedido de exemplo/simulado: de 1 a 4 produtos (os em destaque saem mais),
 * completando até passar do pedido mínimo.
 */
export function sortearItens(produtos: Produto[], rand: () => number, minimo: number): ItemPedido[] {
  if (!produtos.length) return [];
  const pesos = produtos.map((p) => (p.destaque ? 3 : 1));
  const soma = pesos.reduce((a, b) => a + b, 0);
  const sortear = () => {
    let r = rand() * soma;
    for (let i = 0; i < produtos.length; i++) {
      r -= pesos[i];
      if (r <= 0) return produtos[i];
    }
    return produtos[produtos.length - 1];
  };

  const itens: ItemPedido[] = [];
  const adicionar = (p: Produto, quantidade: number) => {
    const existente = itens.find((i) => i.produto_id === p.id);
    if (existente) existente.quantidade += quantidade;
    else itens.push({ produto_id: p.id, nome: p.nome, quantidade, preco_unitario: precoVenda(p) });
  };
  const total = () => itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);

  const n = 1 + Math.floor(rand() * rand() * 4); // mais pedidos pequenos do que grandes
  for (let i = 0; i < n; i++) {
    const p = sortear();
    adicionar(p, precoVenda(p) < 15 && rand() < 0.35 ? 2 : 1);
  }
  for (let guarda = 0; total() < minimo && guarda < 10; guarda++) adicionar(sortear(), 1);
  return itens;
}
