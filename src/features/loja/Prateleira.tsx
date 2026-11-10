import { useCallback, useEffect, useRef, useState } from "react";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Barra fixa com a busca e as categorias. A categoria marcada acompanha a rolagem da página,
 * e clicar numa categoria rola até ela.
 * `versao` muda quando a lista de seções na tela muda (busca), para recalcular a marcação.
 */
export function Prateleira({
  secoes,
  busca,
  onBusca,
  versao,
}: {
  secoes: { id: string; nome: string }[];
  busca: string;
  onBusca: (v: string) => void;
  versao: string;
}) {
  const shelfRef = useRef<HTMLElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [ativa, setAtiva] = useState(secoes[0]?.id ?? "");
  const pulando = useRef(false);
  const fimPulo = useRef<(() => void) | null>(null);
  const timer = useRef(0);

  const alturaPrateleira = () => {
    const el = shelfRef.current;
    if (!el) return 0;
    return el.getBoundingClientRect().height + (parseFloat(getComputedStyle(el).top) || 0);
  };

  // Categoria marcada conforme a rolagem
  useEffect(() => {
    let raf = 0;
    const spy = () => {
      raf = 0;
      if (pulando.current) return;
      const linha = alturaPrateleira() + 40;
      const secoesDom = Array.from(document.querySelectorAll<HTMLElement>(".vitrine .cat"));
      let atual = secoesDom[0]?.dataset.secao ?? "";
      for (const s of secoesDom) if (s.getBoundingClientRect().top <= linha) atual = s.dataset.secao ?? atual;
      setAtiva(atual);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(spy);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    spy();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [versao]);

  // Mantém a categoria marcada visível na faixa de categorias
  useEffect(() => {
    const box = chipsRef.current;
    const chip = box?.querySelector<HTMLElement>(`[data-secao="${CSS.escape(ativa)}"]`);
    if (!box || !chip) return;
    box.scrollTo({
      left: Math.max(0, chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2),
      behavior: reduzido() ? "auto" : "smooth",
    });
  }, [ativa]);

  // Ao sair da página, não deixa ouvinte de rolagem para trás
  useEffect(
    () => () => {
      if (fimPulo.current) window.removeEventListener("scroll", fimPulo.current);
      clearTimeout(timer.current);
    },
    [],
  );

  const irPara = useCallback((id: string) => {
    const s = document.getElementById(`secao-${id}`);
    if (!s) return;
    const y = s.getBoundingClientRect().top + window.scrollY - alturaPrateleira() - 14;
    const alvo = Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight));
    pulando.current = true;
    setAtiva(id);
    window.scrollTo({ top: Math.max(0, y), behavior: reduzido() ? "auto" : "smooth" });

    // A marcação pela rolagem volta a valer quando a rolagem parar
    if (fimPulo.current) window.removeEventListener("scroll", fimPulo.current);
    const parado = () => {
      clearTimeout(timer.current);
      timer.current = window.setTimeout(
        () => {
          pulando.current = false;
          window.removeEventListener("scroll", parado);
          fimPulo.current = null;
        },
        Math.abs(window.scrollY - alvo) < 2 ? 60 : 400,
      );
    };
    fimPulo.current = parado;
    window.addEventListener("scroll", parado, { passive: true });
    parado();
  }, []);

  return (
    <nav className="shelf" aria-label="Categorias" ref={shelfRef}>
      <div className="wrap">
        <label className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Buscar queijo, doce, café…"
            aria-label="Buscar produto"
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
          />
        </label>
        <div className="chips" ref={chipsRef}>
          {secoes.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip"
              data-secao={s.id}
              aria-pressed={s.id === ativa}
              onClick={() => {
                if (busca) {
                  onBusca("");
                  // espera a lista completa voltar para a tela antes de rolar
                  window.setTimeout(() => irPara(s.id), 0);
                } else irPara(s.id);
              }}
            >
              {s.nome}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
