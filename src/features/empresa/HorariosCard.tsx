import { CopyCheck } from "lucide-react";
import type { DiaFuncionamento } from "@/types";
import { Switch } from "@/components/ui/switch";
import { CardHeader } from "@/components/shared/CardHeader";
import { DIAS_SEMANA } from "@/lib/loja";
import { cn } from "@/lib/utils";

// Segunda primeiro, domingo por último (índices do modelo: 0 = domingo).
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

interface HorariosCardProps {
  horarios: DiaFuncionamento[];
  onChange: (horarios: DiaFuncionamento[]) => void;
  erros: Record<number, string>;
}

export function HorariosCard({ horarios, onChange, erros }: HorariosCardProps) {
  const alterar = (dia: number, parcial: Partial<DiaFuncionamento>) =>
    onChange(horarios.map((h, i) => (i === dia ? { ...h, ...parcial } : h)));

  const copiarParaTodos = (dia: number) => onChange(horarios.map(() => ({ ...horarios[dia] })));

  return (
    <section className="card p-4 sm:p-5">
      <CardHeader
        title="Horário de funcionamento"
        subtitle="Usado para mostrar se a loja está aberta e para aceitar pedidos. Use o ícone de cópia para repetir um horário em todos os dias."
      />
      <div className="flex flex-col divide-y divide-line rounded-md border border-line">
        {ORDEM.map((dia) => {
          const h = horarios[dia];
          const viraDia = h.aberto && h.fecha < h.abre;
          return (
            <div key={dia} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
              <label className="flex w-36 items-center gap-2.5">
                <Switch
                  checked={h.aberto}
                  onCheckedChange={(aberto) => alterar(dia, { aberto })}
                  aria-label={`${DIAS_SEMANA[dia]} aberto`}
                />
                <span className={cn("font-semibold", !h.aberto && "text-ink-muted")}>{DIAS_SEMANA[dia]}</span>
              </label>

              {h.aberto ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    type="time"
                    className="input w-[110px]"
                    value={h.abre}
                    onChange={(e) => alterar(dia, { abre: e.target.value })}
                    aria-label={`${DIAS_SEMANA[dia]}: abre às`}
                  />
                  <span className="text-ink-muted">às</span>
                  <input
                    type="time"
                    className="input w-[110px]"
                    value={h.fecha}
                    onChange={(e) => alterar(dia, { fecha: e.target.value })}
                    aria-label={`${DIAS_SEMANA[dia]}: fecha às`}
                  />
                  {viraDia && <span className="text-[12px] text-ink-muted">fecha no dia seguinte</span>}
                  {erros[dia] && <span className="w-full text-[12px] text-negative">{erros[dia]}</span>}
                </div>
              ) : (
                <span className="flex-1 text-ink-muted">Fechado</span>
              )}

              <button
                type="button"
                onClick={() => copiarParaTodos(dia)}
                className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-gray-100 hover:text-ink"
                aria-label={`Copiar o horário de ${DIAS_SEMANA[dia]} para todos os dias`}
                title="Copiar para todos os dias"
              >
                <CopyCheck className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
