import { useEffect, useRef, useState } from "react";
import type { Loja } from "@/types";
import { formatCurrency } from "@/lib/format";
import { linkWhatsApp } from "@/features/clientes/telefone";
import { Foto, IconeWhatsApp } from "./pecas";
import { mensagemPedido, problemaPedido, totalSacola, type DadosPedido, type LinhaSacola } from "./mensagemWhatsApp";

export function SacolaDrawer({
  loja,
  numeroWhats,
  linhas,
  pedidoMinimo,
  pagamentos,
  dados,
  onDados,
  onAlterar,
  onFechar,
}: {
  loja: Loja;
  numeroWhats: string;
  linhas: LinhaSacola[];
  pedidoMinimo: number;
  pagamentos: string[];
  dados: DadosPedido;
  onDados: (d: Partial<DadosPedido>) => void;
  onAlterar: (produtoId: string, delta: number) => void;
  onFechar: () => void;
}) {
  const voltarRef = useRef<HTMLButtonElement>(null);
  const [erro, setErro] = useState("");
  useEffect(() => voltarRef.current?.focus(), []);

  const total = totalSacola(linhas);
  const falta = pedidoMinimo - total;
  const problema = problemaPedido({ loja, linhas, pedidoMinimo, dados, temWhatsApp: !!numeroWhats });
  const link = problema ? undefined : linkWhatsApp(numeroWhats, mensagemPedido(loja, linhas, dados));

  const set = (d: Partial<DadosPedido>) => {
    setErro("");
    onDados(d);
  };

  return (
    <aside className="drawer" aria-label="Sua sacola" role="dialog" aria-modal="true">
      <div className="d-head">
        <button type="button" className="back" onClick={onFechar} aria-label="Fechar sacola" ref={voltarRef}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Voltar
        </button>
        <h2>Sua sacola</h2>
      </div>

      <div className="d-body">
        <div className="lines">
          {linhas.length ? (
            linhas.map(({ produto, qtd }) => (
              <div className="line" key={produto.id}>
                <Foto src={produto.imagem_url} />
                <div>
                  <b>{produto.nome}</b>
                  <small className="num">{formatCurrency(produto.preco)} cada</small>
                </div>
                <span className="stepper">
                  <button type="button" onClick={() => onAlterar(produto.id, -1)} aria-label={`Tirar um ${produto.nome}`}>
                    −
                  </button>
                  <span className="num">{qtd}</span>
                  <button type="button" onClick={() => onAlterar(produto.id, 1)} aria-label={`Adicionar mais um ${produto.nome}`}>
                    +
                  </button>
                </span>
              </div>
            ))
          ) : (
            <p className="empty">Sua sacola está vazia.</p>
          )}
        </div>

        <form className="form" noValidate onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="v-nome">
            Seu nome
            <input id="v-nome" autoComplete="name" required value={dados.nome} onChange={(e) => set({ nome: e.target.value })} />
          </label>
          <div className="seg" role="group" aria-label="Como receber">
            <button type="button" aria-pressed={dados.modo === "entrega"} onClick={() => set({ modo: "entrega" })}>
              Entrega
            </button>
            <button type="button" aria-pressed={dados.modo === "retirada"} onClick={() => set({ modo: "retirada" })}>
              Retirar na loja
            </button>
          </div>
          {dados.modo === "entrega" && (
            <>
              <label htmlFor="v-end">
                Endereço com número
                <input
                  id="v-end"
                  autoComplete="street-address"
                  placeholder="Rua, número"
                  value={dados.endereco}
                  onChange={(e) => set({ endereco: e.target.value })}
                />
              </label>
              <label htmlFor="v-bairro">
                Bairro e ponto de referência
                <input
                  id="v-bairro"
                  placeholder="Ex.: Centro, perto da praça"
                  value={dados.bairro}
                  onChange={(e) => set({ bairro: e.target.value })}
                />
              </label>
            </>
          )}
          {pagamentos.length > 0 && (
            <label htmlFor="v-pag">
              Pagamento
              <select id="v-pag" value={dados.pagamento} onChange={(e) => set({ pagamento: e.target.value })}>
                {pagamentos.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          )}
          {dados.pagamento === "Dinheiro" && (
            <label htmlFor="v-troco">
              Troco para quanto?
              <input id="v-troco" inputMode="decimal" placeholder="Ex.: 100" value={dados.troco} onChange={(e) => set({ troco: e.target.value })} />
            </label>
          )}
          <label htmlFor="v-obs">
            Observações
            <textarea
              id="v-obs"
              rows={2}
              placeholder="Ex.: queijo bem curado, cortar em fatias"
              value={dados.obs}
              onChange={(e) => set({ obs: e.target.value })}
            />
          </label>
          {erro && (
            <p className="err" role="alert">
              {erro}
            </p>
          )}
        </form>
      </div>

      <div className="d-foot">
        <div className="tot">
          <span>Subtotal</span>
          <span className="num">{formatCurrency(total)}</span>
        </div>
        <p className="note">
          {loja.pausada
            ? "A loja está pausada no momento. Tente de novo mais tarde."
            : falta > 0
              ? `Faltam ${formatCurrency(falta)} para o pedido mínimo de ${formatCurrency(pedidoMinimo)}.`
              : "Taxa de entrega confirmada no WhatsApp, conforme o bairro."}
        </p>
        <a
          className="send"
          href={link ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!linhas.length || loja.pausada ? "true" : "false"}
          onClick={(e) => {
            if (problema) {
              e.preventDefault();
              setErro(problema);
            }
          }}
        >
          <IconeWhatsApp />
          Enviar pedido no WhatsApp
        </a>
        <button type="button" className="keep" onClick={onFechar}>
          Continuar comprando
        </button>
      </div>
    </aside>
  );
}
