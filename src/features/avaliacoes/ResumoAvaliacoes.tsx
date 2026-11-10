import type { Avaliacao } from "@/types";
import { cn } from "@/lib/utils";
import { formatInteger, formatPercent } from "@/lib/format";
import { Estrelas } from "./Estrelas";

interface ResumoAvaliacoesProps {
  avaliacoes: Avaliacao[];
  notaSelecionada: number | null;
  onSelecionarNota: (nota: number | null) => void;
}

export function ResumoAvaliacoes({ avaliacoes, notaSelecionada, onSelecionarNota }: ResumoAvaliacoesProps) {
  const total = avaliacoes.length;
  const media = total ? avaliacoes.reduce((s, a) => s + a.nota, 0) / total : 0;
  const respondidas = avaliacoes.filter((a) => a.resposta).length;
  const porNota = [5, 4, 3, 2, 1].map((n) => ({ n, qtd: avaliacoes.filter((a) => a.nota === n).length }));
  const maior = Math.max(1, ...porNota.map((p) => p.qtd));

  return (
    <section className="card grid gap-6 p-4 sm:p-5 md:grid-cols-[220px_1fr_200px] md:items-center">
      <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
        <p className="text-[12px] text-ink-muted">Nota média</p>
        <p className="text-[40px] font-extrabold leading-none tabular-nums">
          {total ? media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
        </p>
        <Estrelas nota={media} tamanho="size-5" />
        <p className="text-[12px] text-ink-muted">
          {formatInteger(total)} {total === 1 ? "avaliação" : "avaliações"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5" aria-label="Distribuição das notas">
        {porNota.map(({ n, qtd }) => {
          const ativo = notaSelecionada === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelecionarNota(ativo ? null : n)}
              aria-pressed={ativo}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}: ${qtd} ${qtd === 1 ? "avaliação" : "avaliações"}. Filtrar.`}
              className={cn(
                "grid grid-cols-[28px_1fr_40px] items-center gap-2 rounded px-1 py-0.5 text-[12px] transition-colors hover:bg-gray-50",
                ativo && "bg-chart-primary/10",
              )}
            >
              <span className="font-semibold tabular-nums">{n} ★</span>
              <span className="h-2 overflow-hidden rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-[#F29A3F]" style={{ width: `${(qtd / maior) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-ink-muted">{formatInteger(qtd)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1 rounded-md bg-gray-50 p-4 text-center">
        <p className="text-[12px] text-ink-muted">Respondidas</p>
        <p className="text-[24px] font-bold tabular-nums">{total ? formatPercent(respondidas / total) : "—"}</p>
        <p className="text-[12px] text-ink-muted">
          {formatInteger(total - respondidas)} sem resposta
        </p>
      </div>
    </section>
  );
}
