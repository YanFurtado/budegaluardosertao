import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/shared/CardHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { cn } from "@/lib/utils";
import { formatInteger } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { AvaliacaoItem } from "@/features/avaliacoes/AvaliacaoItem";
import { ResumoAvaliacoes } from "@/features/avaliacoes/ResumoAvaliacoes";

const POR_PAGINA = 20;

type Filtro = "todas" | "sem_resposta" | 1 | 2 | 3 | 4 | 5;

export default function AvaliacoesPage() {
  const avaliacoes = useAppStore((s) => s.avaliacoes);
  const pedidos = useAppStore((s) => s.pedidos);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");
  const [visiveis, setVisiveis] = useState(POR_PAGINA);

  const numeroPorPedido = useMemo(() => new Map(pedidos.map((p) => [p.id, p.numero])), [pedidos]);

  const ordenadas = useMemo(
    () => [...avaliacoes].sort((a, b) => b.criado_em.getTime() - a.criado_em.getTime()),
    [avaliacoes],
  );

  const filtradas = useMemo(
    () =>
      ordenadas.filter((a) => {
        if (filtro === "sem_resposta" && a.resposta) return false;
        if (typeof filtro === "number" && a.nota !== filtro) return false;
        return contem(a.cliente_nome, busca) || contem(a.comentario, busca);
      }),
    [ordenadas, filtro, busca],
  );

  useEffect(() => setVisiveis(POR_PAGINA), [filtro, busca]);

  const chips: { valor: Filtro; label: string; qtd: number }[] = [
    { valor: "todas", label: "Todas", qtd: avaliacoes.length },
    { valor: "sem_resposta", label: "Sem resposta", qtd: avaliacoes.filter((a) => !a.resposta).length },
    ...([5, 4, 3, 2, 1] as const).map((n) => ({ valor: n, label: `${n} ★`, qtd: avaliacoes.filter((a) => a.nota === n).length })),
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <ResumoAvaliacoes
        avaliacoes={avaliacoes}
        notaSelecionada={typeof filtro === "number" ? filtro : null}
        onSelecionarNota={(n) => setFiltro(n === null ? "todas" : (n as Filtro))}
      />

      <section className="card overflow-hidden">
        <div className="border-b border-line p-4 sm:p-5">
          <CardHeader title="Avaliações dos clientes" subtitle="As respostas ficam visíveis para todos no cardápio digital." />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-0" role="group" aria-label="Filtrar avaliações">
              {chips.map((c) => (
                <button
                  key={String(c.valor)}
                  type="button"
                  aria-pressed={filtro === c.valor}
                  onClick={() => setFiltro(c.valor)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    filtro === c.valor
                      ? "border-primary bg-chart-primary/10 text-primary"
                      : "border-line bg-white text-ink hover:bg-gray-50",
                  )}
                >
                  {c.label}
                  <span className="ml-1 font-normal text-ink-muted">{formatInteger(c.qtd)}</span>
                </button>
              ))}
            </div>
            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por cliente ou comentário" className="lg:w-72" />
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState icon={Star} message="Nenhuma avaliação encontrada" />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {filtradas.slice(0, visiveis).map((a) => (
                <AvaliacaoItem key={a.id} avaliacao={a} numeroPedido={numeroPorPedido.get(a.pedido_id) ?? null} />
              ))}
            </ul>
            <div className="flex flex-col items-center gap-2 border-t border-line p-4 text-[12px] text-ink-muted">
              <span>
                Mostrando {formatInteger(Math.min(visiveis, filtradas.length))} de {formatInteger(filtradas.length)}
              </span>
              {visiveis < filtradas.length && (
                <Button variant="outline" size="sm" onClick={() => setVisiveis((v) => v + POR_PAGINA)}>
                  Carregar mais
                </Button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
