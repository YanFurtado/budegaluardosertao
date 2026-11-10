import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/features/loja/vitrine.css";
import { useAppStore } from "@/store/useAppStore";
import { ID_SECAO_DESTAQUES, useVitrine } from "@/services/vitrine";
import { formatCurrency } from "@/lib/format";
import { linkWhatsApp, soDigitos } from "@/features/clientes/telefone";
import { Hero } from "@/features/loja/Hero";
import { Prateleira } from "@/features/loja/Prateleira";
import { InfoLoja } from "@/features/loja/InfoLoja";
import { ProdutoCard } from "@/features/loja/pecas";
import { ProdutoModal } from "@/features/loja/ProdutoModal";
import { SacolaDrawer } from "@/features/loja/SacolaDrawer";
import { useSacola } from "@/features/loja/useSacola";
import { totalSacola, type DadosPedido, type LinhaSacola } from "@/features/loja/mensagemWhatsApp";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Aberto = { tipo: "sacola" } | { tipo: "produto"; id: string } | null;

/** Página principal: vitrine da loja para o cliente montar o pedido e enviar pelo WhatsApp. */
export default function LojaPage() {
  const { dados, carregando } = useVitrine();
  const { loja, secoes, produtos, pagamentos, pedidoMinimo } = dados;
  const logado = useAppStore((s) => !!s.usuarioLogadoId);

  const itens = useSacola((s) => s.itens);
  const alterar = useSacola((s) => s.alterar);
  const remover = useSacola((s) => s.remover);

  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<Aberto>(null);
  const [pedido, setPedido] = useState<DadosPedido>({
    nome: "",
    modo: "entrega",
    endereco: "",
    bairro: "",
    pagamento: "",
    troco: "",
    obs: "",
  });
  const focoAntes = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.title = `${loja.nome} · Frios, queijos e doces`;
  }, [loja.nome]);

  // Itens que saíram do catálogo ou ficaram em falta não continuam na sacola
  const linhas: LinhaSacola[] = useMemo(
    () =>
      Object.entries(itens).flatMap(([id, qtd]) => {
        const produto = produtos[id];
        return produto && !produto.em_falta && qtd > 0 ? [{ produto, qtd }] : [];
      }),
    [itens, produtos],
  );
  useEffect(() => {
    if (carregando) return;
    const invalidos = Object.keys(itens).filter((id) => !produtos[id] || produtos[id].em_falta);
    if (invalidos.length) remover(invalidos);
  }, [carregando, itens, produtos, remover]);

  const numeroWhats = soDigitos(loja.whatsapp).length >= 10 ? loja.whatsapp : soDigitos(loja.telefone).length >= 10 ? loja.telefone : "";
  const linkWhats = numeroWhats ? linkWhatsApp(numeroWhats, `Olá! Vim pelo site da ${loja.nome}.`) : null;
  const pagamentoEscolhido = pagamentos.includes(pedido.pagamento) ? pedido.pagamento : (pagamentos[0] ?? "");

  // Busca: sem a seção de destaques, para não repetir produtos
  const q = norm(busca.trim());
  const secoesNaTela = useMemo(
    () =>
      q
        ? secoes
            .filter((s) => s.id !== ID_SECAO_DESTAQUES)
            .map((s) => ({ ...s, produtos: s.produtos.filter((p) => norm(`${p.nome} ${p.descricao}`).includes(q)) }))
            .filter((s) => s.produtos.length > 0)
        : secoes,
    [q, secoes],
  );

  const abrir = (a: Exclude<Aberto, null>) => {
    focoAntes.current = document.activeElement as HTMLElement | null;
    setAberto(a);
  };
  const fechar = useCallback(() => {
    setAberto(null);
    const el = focoAntes.current;
    window.setTimeout(() => el?.isConnected && el.focus(), 0);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto, fechar]);

  const produtoAberto = aberto?.tipo === "produto" ? produtos[aberto.id] : undefined;
  useEffect(() => {
    if (aberto?.tipo === "produto" && !produtoAberto) setAberto(null);
  }, [aberto, produtoAberto]);

  const qtdTotal = linhas.reduce((s, l) => s + l.qtd, 0);

  return (
    <div className="vitrine">
      <Hero loja={loja} pedidoMinimo={pedidoMinimo} linkWhats={linkWhats} logado={logado} />

      <Prateleira
        secoes={secoes}
        busca={busca}
        onBusca={setBusca}
        versao={`${q}|${secoesNaTela.map((s) => s.id).join(",")}`}
      />

      <main id="cardapio" className="wrap">
        {loja.pausada && (
          <p className="aviso-pausa" role="status">
            A loja está pausada no momento e não está recebendo pedidos. Você pode olhar os produtos e voltar mais tarde.
          </p>
        )}
        {secoesNaTela.length ? (
          secoesNaTela.map((s) => (
            <section className="cat" id={`secao-${s.id}`} data-secao={s.id} key={s.id} aria-labelledby={`titulo-${s.id}`}>
              <div className="cat-head">
                <h2 id={`titulo-${s.id}`}>{s.nome}</h2>
                <small className="num">
                  {s.produtos.length} {s.produtos.length > 1 ? "itens" : "item"}
                </small>
              </div>
              <div className="v-grid">
                {s.produtos.map((p) => (
                  <ProdutoCard
                    key={p.id}
                    produto={p}
                    qtd={itens[p.id] ?? 0}
                    onAlterar={(d) => alterar(p.id, d)}
                    onAbrir={() => abrir({ tipo: "produto", id: p.id })}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className="empty">
            {q
              ? `Nada encontrado para “${busca.trim()}”. Tente “queijo”, “doce” ou chame no WhatsApp que a gente procura.`
              : "Nenhum produto disponível no momento."}
          </p>
        )}
      </main>

      <InfoLoja loja={loja} pagamentos={pagamentos} />
      <footer>
        <div className="wrap">
          <span>
            © {loja.nome}
            {loja.cnpj ? ` · CNPJ ${loja.cnpj}` : ""}
          </span>
          {loja.cidade && (
            <span>
              {loja.cidade}
              {loja.uf ? ` · ${loja.uf}` : ""}
            </span>
          )}
        </div>
      </footer>

      {qtdTotal > 0 && !aberto && (
        <button type="button" className="fab" onClick={() => abrir({ tipo: "sacola" })}>
          <span>
            <span className="count num">{qtdTotal}</span>Ver sacola
          </span>
          <span className="num">{formatCurrency(totalSacola(linhas))}</span>
        </button>
      )}

      {aberto && <div className="scrim" onClick={fechar} aria-hidden />}
      {aberto?.tipo === "sacola" && (
        <SacolaDrawer
          loja={loja}
          numeroWhats={numeroWhats}
          linhas={linhas}
          pedidoMinimo={pedidoMinimo}
          pagamentos={pagamentos}
          dados={{ ...pedido, pagamento: pagamentoEscolhido }}
          onDados={(d) => setPedido((p) => ({ ...p, ...d }))}
          onAlterar={alterar}
          onFechar={fechar}
        />
      )}
      {produtoAberto && (
        <ProdutoModal
          produto={produtoAberto}
          nomeLoja={loja.nome}
          qtd={itens[produtoAberto.id] ?? 0}
          onAlterar={(d) => alterar(produtoAberto.id, d)}
          onFechar={fechar}
        />
      )}
    </div>
  );
}
