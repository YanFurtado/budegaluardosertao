import { useMemo } from "react";
import type { Categoria, ConfigEntrega, Configuracoes, Loja, Produto } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { precoVenda } from "@/lib/pedidos";

/**
 * Ponto único de acesso aos dados da página da loja (vitrine pública).
 * Hoje lê do store local; para ligar ao Supabase basta trocar o corpo de `useVitrine`
 * (buscar loja, categorias, produtos e formas de pagamento) mantendo o mesmo contrato.
 */

export interface ProdutoVitrine {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  /** Preço cobrado (o promocional, quando houver). */
  preco: number;
  /** Preço "de", riscado, quando o produto está em promoção. */
  preco_antigo: number | null;
  em_falta: boolean;
  destaque: boolean;
  imagem_url: string | null;
}

export interface SecaoVitrine {
  id: string;
  nome: string;
  produtos: ProdutoVitrine[];
}

export interface Vitrine {
  loja: Loja;
  /** "Mais Vendidos" (destaques) primeiro, depois as categorias ativas na ordem do catálogo. Sem seções vazias. */
  secoes: SecaoVitrine[];
  /** Produtos visíveis, por id (para a sacola). */
  produtos: Record<string, ProdutoVitrine>;
  /** Formas de pagamento oferecidas ao cliente (sem "Fiado", que é só para clientes liberados na loja). */
  pagamentos: string[];
  pedidoMinimo: number;
}

export const ID_SECAO_DESTAQUES = "destaques";

export function montarVitrine(d: {
  loja: Loja;
  categorias: Categoria[];
  produtos: Produto[];
  config: Configuracoes;
  configEntrega: ConfigEntrega;
}): Vitrine {
  const categorias = d.categorias.filter((c) => c.ativa).sort((a, b) => a.ordem - b.ordem);
  const ativas = new Set(categorias.map((c) => c.id));

  const produtos: Record<string, ProdutoVitrine> = {};
  const lista: ProdutoVitrine[] = [];
  for (const p of d.produtos) {
    if (!ativas.has(p.categoria_id)) continue;
    const pv: ProdutoVitrine = {
      id: p.id,
      categoria_id: p.categoria_id,
      nome: p.nome,
      descricao: p.descricao,
      preco: precoVenda(p),
      preco_antigo: p.preco_promocional !== null && p.preco_promocional < p.preco ? p.preco : null,
      em_falta: !p.ativo,
      destaque: p.destaque,
      imagem_url: p.imagem_url,
    };
    produtos[p.id] = pv;
    lista.push(pv);
  }

  const secoes: SecaoVitrine[] = [
    { id: ID_SECAO_DESTAQUES, nome: "Mais Vendidos", produtos: lista.filter((p) => p.destaque) },
    ...categorias.map((c) => ({ id: c.id, nome: c.nome, produtos: lista.filter((p) => p.categoria_id === c.id) })),
  ].filter((s) => s.produtos.length > 0);

  return {
    loja: d.loja,
    secoes,
    produtos,
    pagamentos: d.config.formas_pagamento.filter((f) => f !== "Fiado"),
    pedidoMinimo: d.configEntrega.pedido_minimo,
  };
}

export function useVitrine(): { dados: Vitrine; carregando: boolean } {
  const loja = useAppStore((s) => s.loja);
  const categorias = useAppStore((s) => s.categorias);
  const produtos = useAppStore((s) => s.produtos);
  const config = useAppStore((s) => s.config);
  const configEntrega = useAppStore((s) => s.configEntrega);
  const dados = useMemo(
    () => montarVitrine({ loja, categorias, produtos, config, configEntrega }),
    [loja, categorias, produtos, config, configEntrega],
  );
  return { dados, carregando: false };
}
