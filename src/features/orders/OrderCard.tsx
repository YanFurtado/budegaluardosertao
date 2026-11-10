import { CalendarClock, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Pedido } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { proximoStatus, resumoItens, rotuloAvancar } from "@/lib/pedidos";
import { labelTipoPedido } from "@/data/catalogo";
import { cn } from "@/lib/utils";
import { formatDuracao, minutosDesde, TOM_TIPO } from "./utils";

interface OrderCardProps {
  pedido: Pedido;
  agora: Date;
  alertaAtrasoMin: number;
  onOpen: (p: Pedido) => void;
  onAdvance: (p: Pedido) => void;
  onReject: (p: Pedido) => void;
}

export function OrderCard({ pedido: p, agora, alertaAtrasoMin, onOpen, onAdvance, onReject }: OrderCardProps) {
  const agendadoFuturo = !!p.agendado_para && p.agendado_para > agora;
  const minutos = minutosDesde(p.criado_em, agora);
  const atrasado = !agendadoFuturo && minutos > alertaAtrasoMin;
  const acao = proximoStatus(p) ? rotuloAvancar(p) : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(p)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(p);
        }
      }}
      aria-label={`Pedido ${p.numero}, ${p.cliente_nome}, ${formatCurrency(p.total)}`}
      className={cn(
        "cursor-pointer rounded-md border bg-white p-3 shadow-card transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40",
        atrasado ? "border-negative/50" : "border-line",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold tabular-nums">#{p.numero}</span>
        <Badge tom={TOM_TIPO[p.tipo_pedido]}>{labelTipoPedido(p.tipo_pedido)}</Badge>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 whitespace-nowrap text-[12px] tabular-nums",
            atrasado ? "font-bold text-negative" : "text-ink-muted",
          )}
          title={atrasado ? `Acima de ${alertaAtrasoMin} min` : "Tempo desde a criação"}
        >
          {agendadoFuturo ? (
            <>
              <CalendarClock className="size-3.5" /> {format(p.agendado_para!, "dd/MM HH:mm")}
            </>
          ) : (
            <>
              <Clock className="size-3.5" /> {formatDuracao(minutos)}
              {atrasado && " · atrasado"}
            </>
          )}
        </span>
      </div>

      <p className="mt-1.5 truncate font-semibold">{p.cliente_nome}</p>
      {p.tipo_pedido === "delivery" && p.bairro && <p className="truncate text-[12px] text-ink-muted">{p.bairro}</p>}
      <p className="mt-1 line-clamp-2 text-[12px] text-ink-muted">{resumoItens(p.itens)}</p>

      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="min-w-0 text-[12px] text-ink-muted">
          {p.forma_pagamento}
          {p.troco_para ? ` · troco p/ ${formatCurrency(p.troco_para)}` : ""}
          {p.momento_entrega === "agendado" && !agendadoFuturo ? " · agendado" : ""}
        </span>
        <span className="whitespace-nowrap text-[14px] font-bold tabular-nums">{formatCurrency(p.total)}</span>
      </div>

      {acao && (
        <div className="mt-3 flex gap-2">
          {p.status === "pendente" && (
            <Button
              variant="outline"
              size="sm"
              className="text-negative hover:bg-negative-soft"
              onClick={(e) => {
                e.stopPropagation();
                onReject(p);
              }}
            >
              Recusar
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(p);
            }}
          >
            {acao}
          </Button>
        </div>
      )}
    </article>
  );
}
