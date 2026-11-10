import type { ReactNode } from "react";
import { MapPin, Phone, Printer, XCircle } from "lucide-react";
import type { Pedido } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SheetContent,
} from "@/components/ui/dialog";
import { StatusPedidoBadge } from "@/components/shared/StatusPedidoBadge";
import { nomeFuncionario, useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { proximoStatus, rotuloAvancar, STATUS_PEDIDO } from "@/lib/pedidos";
import { labelTipoPedido } from "@/data/catalogo";
import { cn } from "@/lib/utils";
import { imprimirComanda } from "./imprimirComanda";
import { TOM_TIPO } from "./utils";

interface OrderDetailsSheetProps {
  pedidoId: string | null;
  onClose: () => void;
  onAdvance: (p: Pedido) => void;
  onCancel: (p: Pedido) => void;
}

/** Drawer com todos os detalhes do pedido (usado na Gestão e no Histórico). */
export function OrderDetailsSheet({ pedidoId, onClose, onAdvance, onCancel }: OrderDetailsSheetProps) {
  const pedido = useAppStore((s) => (pedidoId ? s.pedidos.find((p) => p.id === pedidoId) : undefined));

  return (
    <Dialog open={!!pedidoId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {pedido ? (
          <Conteudo pedido={pedido} onAdvance={onAdvance} onCancel={onCancel} />
        ) : (
          <DialogHeader>
            <DialogTitle>Pedido não encontrado</DialogTitle>
          </DialogHeader>
        )}
      </SheetContent>
    </Dialog>
  );
}

function Conteudo({
  pedido: p,
  onAdvance,
  onCancel,
}: {
  pedido: Pedido;
  onAdvance: (p: Pedido) => void;
  onCancel: (p: Pedido) => void;
}) {
  const loja = useAppStore((s) => s.loja);
  const funcionarios = useAppStore((s) => s.funcionarios);
  const vias = useAppStore((s) => s.config.vias_impressao);
  const ativo = p.status !== "concluido" && p.status !== "cancelado";
  const prox = proximoStatus(p);
  const atendente = nomeFuncionario(funcionarios, p.funcionario_id);

  const etapas: { rotulo: string; em: Date | null; detalhe?: string; tom?: "neg" | "pos" }[] = [
    { rotulo: "Pedido criado", em: p.criado_em },
    { rotulo: "Aceito", em: p.aceito_em },
  ];
  if (p.agendado_para) etapas.push({ rotulo: "Agendado para", em: p.agendado_para });
  if (p.status === "concluido") etapas.push({ rotulo: "Concluído", em: p.fechado_em, tom: "pos" });
  if (p.status === "cancelado")
    etapas.push({ rotulo: "Cancelado", em: p.cancelado_em, detalhe: p.motivo_cancelamento ?? undefined, tom: "neg" });

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle>Pedido #{p.numero}</DialogTitle>
          <StatusPedidoBadge status={p.status} />
          <Badge tom={TOM_TIPO[p.tipo_pedido]}>{labelTipoPedido(p.tipo_pedido)}</Badge>
          {p.momento_entrega === "agendado" && <Badge tom="orange">Agendado</Badge>}
        </div>
        <DialogDescription>
          {formatDateTime(p.criado_em)} · {p.canal_venda} · {p.origem}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="flex flex-col gap-5">
        {/* Linha do tempo */}
        <Secao titulo="Andamento">
          <ol className="relative ml-1.5 border-l border-line pl-4">
            {etapas.map((e) => (
              <li key={e.rotulo} className="relative pb-3 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[21.5px] top-1 size-2.5 rounded-full ring-2 ring-white",
                    !e.em ? "bg-gray-300" : e.tom === "neg" ? "bg-negative" : e.tom === "pos" ? "bg-positive" : "bg-chart-primary",
                  )}
                />
                <p className={cn("font-semibold", !e.em && "text-ink-muted")}>{e.rotulo}</p>
                <p className="text-[12px] text-ink-muted">{e.em ? formatDateTime(e.em) : "Aguardando"}</p>
                {e.detalhe && <p className="text-[12px] text-negative">Motivo: {e.detalhe}</p>}
              </li>
            ))}
            {ativo && prox && (
              <li className="relative">
                <span className="absolute -left-[21.5px] top-1 size-2.5 rounded-full bg-gray-300 ring-2 ring-white" />
                <p className="text-ink-muted">Próximo: {STATUS_PEDIDO[prox].label}</p>
              </li>
            )}
          </ol>
        </Secao>

        {/* Cliente */}
        <Secao titulo="Cliente">
          <p className="font-semibold">{p.cliente_nome}</p>
          {p.cliente_telefone && (
            <a href={`tel:${p.cliente_telefone.replace(/\D/g, "")}`} className="mt-1 flex items-center gap-1.5 text-primary hover:underline">
              <Phone className="size-3.5" /> {p.cliente_telefone}
            </a>
          )}
          {p.endereco && (
            <p className="mt-1 flex items-start gap-1.5 text-ink-muted">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {p.endereco}
                {p.bairro && ` – ${p.bairro}`}
              </span>
            </p>
          )}
        </Secao>

        {/* Itens */}
        <Secao titulo="Itens">
          <div className="overflow-hidden rounded-md border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-line">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Item</th>
                  <th className="px-3 py-2 text-right font-semibold">Unit.</th>
                  <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {p.itens.map((i, idx) => (
                  <tr key={`${i.produto_id}-${idx}`} className="border-t border-line align-top">
                    <td className="px-3 py-2">
                      <span className="font-semibold">{i.quantidade}x</span> {i.nome}
                      {i.observacao && <span className="block text-[12px] text-ink-muted">{i.observacao}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCurrency(i.preco_unitario)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatCurrency(i.quantidade * i.preco_unitario)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>

        {/* Valores */}
        <Secao titulo="Valores">
          <dl className="flex flex-col gap-1 tabular-nums">
            <Valor rotulo="Produtos" valor={p.total_produtos} />
            {p.taxa_entrega > 0 && <Valor rotulo="Taxa de entrega" valor={p.taxa_entrega} />}
            {p.taxa_servico > 0 && <Valor rotulo="Taxa de serviço" valor={p.taxa_servico} />}
            {p.taxas_adicionais > 0 && <Valor rotulo="Taxas adicionais" valor={p.taxas_adicionais} />}
            {p.taxa_maquineta > 0 && <Valor rotulo="Taxa da maquineta" valor={p.taxa_maquineta} />}
            {p.desconto > 0 && (
              <Valor rotulo={p.cupom_codigo ? `Desconto (${p.cupom_codigo})` : "Desconto"} valor={-p.desconto} negativo />
            )}
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-[15px] font-bold">
              <dt>Total</dt>
              <dd>{formatCurrency(p.total)}</dd>
            </div>
          </dl>
        </Secao>

        {/* Pagamento e entrega */}
        <Secao titulo="Pagamento e entrega">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-ink-muted">Pagamento</dt>
            <dd>{p.forma_pagamento}</dd>
            {p.troco_para && (
              <>
                <dt className="text-ink-muted">Troco</dt>
                <dd>
                  Para {formatCurrency(p.troco_para)} · levar {formatCurrency(Math.max(0, p.troco_para - p.total))}
                </dd>
              </>
            )}
            {p.tipo_pedido === "delivery" && (
              <>
                <dt className="text-ink-muted">Entregador</dt>
                <dd>{p.responsavel_entrega ?? "Não definido"}</dd>
              </>
            )}
            <dt className="text-ink-muted">Atendente</dt>
            <dd>{atendente}</dd>
          </dl>
        </Secao>

        {p.observacao && (
          <Secao titulo="Observação">
            <p className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2">{p.observacao}</p>
          </Secao>
        )}
      </DialogBody>

      <DialogFooter className="justify-between">
        <Button variant="outline" onClick={() => imprimirComanda(p, loja, atendente, vias)}>
          <Printer /> Imprimir comanda
        </Button>
        {ativo && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="text-negative hover:bg-negative-soft" onClick={() => onCancel(p)}>
              <XCircle /> {p.status === "pendente" ? "Recusar" : "Cancelar"}
            </Button>
            {prox && <Button onClick={() => onAdvance(p)}>{rotuloAvancar(p)}</Button>}
          </div>
        )}
      </DialogFooter>
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-muted">{titulo}</h3>
      {children}
    </section>
  );
}

function Valor({ rotulo, valor, negativo }: { rotulo: string; valor: number; negativo?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{rotulo}</dt>
      <dd className={cn(negativo && "text-negative")}>{formatCurrency(valor)}</dd>
    </div>
  );
}
