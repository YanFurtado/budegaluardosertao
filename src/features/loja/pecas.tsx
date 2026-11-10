import { useEffect, useState } from "react";
import { ShoppingBasket } from "lucide-react";
import type { ProdutoVitrine } from "@/services/vitrine";
import { formatCurrency } from "@/lib/format";

export function IconeWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

/** Foto do produto, com uma imagem padrão quando não há foto (ou ela não carrega). */
export function Foto({ src }: { src: string | null }) {
  const [erro, setErro] = useState(false);
  useEffect(() => setErro(false), [src]);
  if (!src || erro) {
    return (
      <span className="sem-foto" aria-hidden>
        <ShoppingBasket />
      </span>
    );
  }
  return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setErro(true)} />;
}

/** Peso/volume no nome ("600g", "1kg", "500 ML") para a etiqueta da foto. */
export const pesoDoNome = (nome: string) => /(\d+(?:[.,]\d+)?\s?(?:kg|g|ml|l))\b/i.exec(nome)?.[1] ?? "";

export function Precos({ produto }: { produto: ProdutoVitrine }) {
  return (
    <span className="precos">
      <span className="price num">{formatCurrency(produto.preco)}</span>
      {produto.preco_antigo !== null && (
        <span className="price-old num">
          <span className="sr-only">de </span>
          {formatCurrency(produto.preco_antigo)}
        </span>
      )}
    </span>
  );
}

/** Preço + botão Adicionar / contador / "Em falta". */
export function Comprar({ produto, qtd, onAlterar }: { produto: ProdutoVitrine; qtd: number; onAlterar: (delta: number) => void }) {
  return (
    <div className="buy">
      <Precos produto={produto} />
      {produto.em_falta ? (
        <span className="soldout">Em falta</span>
      ) : qtd > 0 ? (
        <span className="stepper">
          <button type="button" onClick={() => onAlterar(-1)} aria-label={`Tirar um ${produto.nome}`}>
            −
          </button>
          <span className="num" aria-live="polite">
            {qtd}
          </span>
          <button type="button" onClick={() => onAlterar(1)} aria-label={`Adicionar mais um ${produto.nome}`}>
            +
          </button>
        </span>
      ) : (
        <button type="button" className="add" onClick={() => onAlterar(1)} aria-label={`Adicionar ${produto.nome}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Adicionar</span>
        </button>
      )}
    </div>
  );
}

export function ProdutoCard({
  produto,
  qtd,
  onAlterar,
  onAbrir,
}: {
  produto: ProdutoVitrine;
  qtd: number;
  onAlterar: (delta: number) => void;
  onAbrir: () => void;
}) {
  const peso = pesoDoNome(produto.nome);
  return (
    <article className={produto.em_falta ? "v-card is-out" : "v-card"}>
      <button type="button" className="ph" onClick={onAbrir} aria-label={`Ver detalhes de ${produto.nome}`}>
        <Foto src={produto.imagem_url} />
        {peso && <span className="tag num">{peso}</span>}
        {produto.em_falta && <span className="flag">Em falta</span>}
      </button>
      <div className="body">
        <h3>{produto.nome}</h3>
        {produto.descricao && <p>{produto.descricao}</p>}
        <Comprar produto={produto} qtd={qtd} onAlterar={onAlterar} />
      </div>
    </article>
  );
}
