import CORRECOES from "./correcoesCatalogo.json";

interface Correcao {
  tipo: string;
  id: string;
  campo: "nome" | "descricao";
  de: string;
  para: string;
}

/**
 * Versão 3 → 4: corrige erros de português do catálogo original nos dados já salvos no navegador.
 * Só troca o texto quando ele ainda é igual ao original (o que a loja editou não é mexido).
 */
export function corrigirTextosV3<T extends Record<string, unknown>>(salvo: T): T {
  const lista = (CORRECOES as Correcao[]).filter((c) => c.tipo === "produto");
  const porId = new Map<string, Correcao[]>();
  for (const c of lista) porId.set(c.id, [...(porId.get(c.id) ?? []), c]);

  const out: Record<string, unknown> = { ...salvo };

  const produtos = salvo.produtos as { id: string; nome: string; descricao: string }[] | undefined;
  if (Array.isArray(produtos)) {
    out.produtos = produtos.map((p) => {
      let novo = p;
      for (const c of porId.get(p.id) ?? []) if (novo[c.campo] === c.de) novo = { ...novo, [c.campo]: c.para };
      return novo;
    });
  }

  // Os pedidos guardam uma cópia do nome do produto no momento da venda.
  const pedidos = salvo.pedidos as { itens?: { produto_id: string; nome: string }[] }[] | undefined;
  if (Array.isArray(pedidos)) {
    out.pedidos = pedidos.map((ped) => {
      if (!Array.isArray(ped.itens)) return ped;
      let mudou = false;
      const itens = ped.itens.map((it) => {
        const c = (porId.get(it.produto_id) ?? []).find((x) => x.campo === "nome" && x.de === it.nome);
        if (!c) return it;
        mudou = true;
        return { ...it, nome: c.para };
      });
      return mudou ? { ...ped, itens } : ped;
    });
  }

  // Frases de exemplo que também tinham erro.
  const nomeNovo = new Map(lista.filter((c) => c.campo === "nome").map((c) => [c.de, c.para]));
  const atividades = salvo.atividades as { descricao: string }[] | undefined;
  if (Array.isArray(atividades)) {
    out.atividades = atividades.map((a) => {
      const m = /^Pausou o produto (.+)$/.exec(a.descricao);
      const novo = m && nomeNovo.get(m[1]);
      return novo ? { ...a, descricao: `Pausou o produto ${novo}` } : a;
    });
  }
  const avaliacoes = salvo.avaliacoes as { resposta: string | null }[] | undefined;
  if (Array.isArray(avaliacoes)) {
    out.avaliacoes = avaliacoes.map((a) =>
      a.resposta?.includes("felizes que gostou") ? { ...a, resposta: a.resposta.replace("felizes que gostou", "felizes que tenha gostado") } : a,
    );
  }
  return out as T;
}
