import { useEffect, useRef } from "react";
import type { ProdutoVitrine } from "@/services/vitrine";
import { Comprar, Foto } from "./pecas";

export function ProdutoModal({
  produto,
  nomeLoja,
  qtd,
  onAlterar,
  onFechar,
}: {
  produto: ProdutoVitrine;
  nomeLoja: string;
  qtd: number;
  onAlterar: (delta: number) => void;
  onFechar: () => void;
}) {
  const fecharRef = useRef<HTMLButtonElement>(null);
  useEffect(() => fecharRef.current?.focus(), []);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="v-modal-titulo">
      <button type="button" className="x" onClick={onFechar} aria-label="Fechar" ref={fecharRef}>
        ×
      </button>
      <div className="foto">
        <Foto src={produto.imagem_url} />
      </div>
      <div className="mb">
        <h3 id="v-modal-titulo">{produto.nome}</h3>
        <p>{produto.descricao || `Produto selecionado da ${nomeLoja}.`}</p>
        <Comprar produto={produto} qtd={qtd} onAlterar={onAlterar} />
      </div>
    </div>
  );
}
