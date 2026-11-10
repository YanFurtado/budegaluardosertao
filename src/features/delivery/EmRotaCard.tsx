import { useEffect, useState } from "react";
import { Bike, MapPin } from "lucide-react";
import { CardHeader } from "@/components/shared/CardHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

function useAgora(intervaloMs = 30_000) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

/** Pedidos com status "Saiu para entrega". */
export function EmRotaCard() {
  const pedidos = useAppStore((s) => s.pedidos);
  const alerta = useAppStore((s) => s.config.alerta_atraso_min);
  const agora = useAgora();

  const emRota = pedidos
    .filter((p) => p.status === "em_entrega")
    .sort((a, b) => (a.aceito_em ?? a.criado_em).getTime() - (b.aceito_em ?? b.criado_em).getTime());

  return (
    <section className="card p-4 sm:p-5">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Em rota agora
            {emRota.length > 0 && <Badge tom="teal">{emRota.length}</Badge>}
          </span>
        }
        subtitle="Pedidos que saíram para entrega e ainda não foram confirmados."
      />
      {emRota.length === 0 ? (
        <EmptyState icon={Bike} message="Nenhum pedido em rota no momento" className="py-6" />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {emRota.map((p) => {
            const desde = p.aceito_em ?? p.criado_em;
            const min = Math.max(0, Math.floor((agora.getTime() - desde.getTime()) / 60_000));
            const atrasado = min > alerta;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-start gap-3 rounded-md border border-line p-3",
                  atrasado && "border-l-4 border-l-negative",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E0F4F2] text-[#1C7A72]" aria-hidden>
                  <Bike className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between gap-2">
                    <span className="font-bold">#{p.numero}</span>
                    <span className={cn("text-[12px] tabular-nums", atrasado ? "font-bold text-negative" : "text-ink-muted")}>
                      há {min} min
                    </span>
                  </p>
                  <p className="truncate">{p.cliente_nome}</p>
                  <p className="flex items-center gap-1 truncate text-[12px] text-ink-muted">
                    <MapPin className="size-3 shrink-0" /> {p.bairro ?? "Sem bairro"}
                  </p>
                  <p className="truncate text-[12px] text-ink-muted">
                    Entregador: <span className="font-semibold text-ink">{p.responsavel_entrega ?? "Não definido"}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
