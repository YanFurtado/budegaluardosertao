import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, MapPin, MessageCircle, NotebookPen, Pencil, Phone, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SheetContent,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusPedidoBadge } from "@/components/shared/StatusPedidoBadge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatInteger } from "@/lib/format";
import { labelTipoPedido } from "@/data/catalogo";
import { iniciais } from "@/lib/loja";
import { saldosFiado, useAppStore, useUsuarioLogado } from "@/store/useAppStore";
import type { Cliente } from "@/types";
import { statsPorCliente, STATS_VAZIO } from "./stats";
import { linkWhatsApp } from "./telefone";

interface ClienteSheetProps {
  clienteId: string | null;
  onClose: () => void;
  onEditar: (c: Cliente) => void;
}

/** Painel lateral com dados, estatísticas, pedidos, avaliações e fiado do cliente. */
export function ClienteSheet({ clienteId, onClose, onEditar }: ClienteSheetProps) {
  const navigate = useNavigate();
  const usuario = useUsuarioLogado();
  const cliente = useAppStore((s) => s.clientes.find((c) => c.id === clienteId) ?? null);
  const pedidos = useAppStore((s) => s.pedidos);
  const avaliacoes = useAppStore((s) => s.avaliacoes);
  const fiado = useAppStore((s) => s.fiado);
  const remover = useAppStore((s) => s.remover);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const dados = useMemo(() => {
    if (!clienteId) return null;
    const doCliente = pedidos.filter((p) => p.cliente_id === clienteId);
    return {
      stats: statsPorCliente(doCliente).get(clienteId) ?? STATS_VAZIO,
      ultimos: [...doCliente].sort((a, b) => b.criado_em.getTime() - a.criado_em.getTime()).slice(0, 10),
      totalPedidos: doCliente.length,
      avaliacoes: avaliacoes.filter((a) => a.cliente_id === clienteId).sort((a, b) => b.criado_em.getTime() - a.criado_em.getTime()),
      saldoFiado: saldosFiado(fiado.filter((l) => l.cliente_id === clienteId)).get(clienteId) ?? 0,
      temFiado: fiado.some((l) => l.cliente_id === clienteId),
    };
  }, [clienteId, pedidos, avaliacoes, fiado]);

  const bloqueioExclusao = !dados
    ? null
    : dados.totalPedidos > 0
      ? `Não é possível excluir: o cliente tem ${dados.totalPedidos} ${dados.totalPedidos === 1 ? "pedido" : "pedidos"} no histórico.`
      : dados.temFiado
        ? "Não é possível excluir: o cliente tem lançamentos de fiado."
        : null;

  const podeVerFiado = !!usuario?.permissoes.includes("fiado");

  return (
    <Dialog open={!!cliente} onOpenChange={(v) => !v && onClose()}>
      {cliente && dados && (
        <SheetContent className="max-w-xl">
          <DialogHeader className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chart-primary/15 text-[14px] font-bold text-primary">
              {iniciais(cliente.nome)}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate">{cliente.nome}</DialogTitle>
              <DialogDescription>Cliente desde {format(cliente.criado_em, "MMMM 'de' yyyy", { locale: ptBR })}</DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5">
            {/* Contato */}
            <ul className="flex flex-col gap-2">
              <Contato icon={<Phone />}>
                <span className="tabular-nums">{cliente.telefone}</span>
                <a
                  href={linkWhatsApp(cliente.telefone)}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1F8A4C] hover:underline"
                >
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
              </Contato>
              {cliente.email && <Contato icon={<Mail />}>{cliente.email}</Contato>}
              {(cliente.endereco || cliente.bairro) && (
                <Contato icon={<MapPin />}>{[cliente.endereco, cliente.bairro].filter(Boolean).join(" · ")}</Contato>
              )}
              {cliente.observacoes && <Contato icon={<NotebookPen />}>{cliente.observacoes}</Contato>}
            </ul>

            {/* Números */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Numero rotulo="Pedidos" valor={formatInteger(dados.stats.pedidos)} />
              <Numero rotulo="Total gasto" valor={formatCurrency(dados.stats.total)} />
              <Numero rotulo="Ticket médio" valor={formatCurrency(dados.stats.ticket)} />
              <Numero
                rotulo="Último pedido"
                valor={dados.stats.ultimoPedido ? formatDistanceToNow(dados.stats.ultimoPedido, { addSuffix: true, locale: ptBR }) : "Nunca"}
              />
            </div>

            {/* Fiado */}
            {(cliente.limite_fiado > 0 || Math.abs(dados.saldoFiado) >= 0.005) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2.5">
                <span>
                  Fiado:{" "}
                  <strong className={dados.saldoFiado > 0 ? "text-negative" : "text-[#1F8A4C]"}>{formatCurrency(dados.saldoFiado)}</strong>{" "}
                  <span className="text-ink-muted">
                    {cliente.limite_fiado > 0 ? `de ${formatCurrency(cliente.limite_fiado)} de limite` : "· fiado bloqueado"}
                  </span>
                </span>
                {podeVerFiado && (
                  <Button variant="link" size="sm" className="h-auto px-0" onClick={() => navigate(`/fiado?cliente=${cliente.id}`)}>
                    Ver extrato
                  </Button>
                )}
              </div>
            )}

            {/* Pedidos */}
            <section>
              <h3 className="mb-2 font-semibold">Últimos pedidos</h3>
              {dados.ultimos.length === 0 ? (
                <p className="text-ink-muted">Nenhum pedido ainda.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line rounded-md border border-line">
                  {dados.ultimos.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="font-semibold tabular-nums">#{p.numero}</span>
                        <span className="text-[12px] text-ink-muted">
                          {format(p.criado_em, "dd/MM/yy HH:mm")} · {labelTipoPedido(p.tipo_pedido)}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusPedidoBadge status={p.status} />
                        <span className={cn("tabular-nums", p.status === "cancelado" && "text-ink-muted line-through")}>
                          {formatCurrency(p.total)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Avaliações */}
            <section>
              <h3 className="mb-2 font-semibold">Avaliações</h3>
              {dados.avaliacoes.length === 0 ? (
                <p className="text-ink-muted">Este cliente ainda não avaliou a loja.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dados.avaliacoes.map((a) => (
                    <li key={a.id} className="rounded-md bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <Estrelas nota={a.nota} />
                        <span className="text-[12px] text-ink-muted">{format(a.criado_em, "dd/MM/yyyy")}</span>
                      </div>
                      {a.comentario && <p className="mt-1">{a.comentario}</p>}
                      {a.resposta && <p className="mt-1 text-[12px] text-ink-muted">Resposta da loja: {a.resposta}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {bloqueioExclusao && <p className="text-[12px] text-ink-muted">{bloqueioExclusao} O cadastro é mantido para preservar o histórico.</p>}
          </DialogBody>

          <DialogFooter className="justify-between">
            <Button
              variant="ghost"
              className="text-negative hover:bg-negative-soft"
              disabled={!!bloqueioExclusao}
              title={bloqueioExclusao ?? undefined}
              onClick={() => setConfirmarExclusao(true)}
            >
              <Trash2 /> Excluir
            </Button>
            <Button onClick={() => onEditar(cliente)}>
              <Pencil /> Editar
            </Button>
          </DialogFooter>

          <ConfirmDialog
            open={confirmarExclusao}
            onOpenChange={setConfirmarExclusao}
            title="Excluir cliente?"
            description={`O cadastro de ${cliente.nome} será apagado. Essa ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            destructive
            onConfirm={() => {
              remover("clientes", cliente.id);
              registrarAtividade(`Excluiu o cliente ${cliente.nome}`);
              toast.success("Cliente excluído", { description: cliente.nome });
              onClose();
            }}
          />
        </SheetContent>
      )}
    </Dialog>
  );
}

function Contato({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 text-ink-muted [&_svg]:size-4">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-md bg-gray-50 px-3 py-2">
      <p className="text-[12px] text-ink-muted">{rotulo}</p>
      <p className="truncate font-bold tabular-nums">{valor}</p>
    </div>
  );
}

export function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("size-3.5", i <= nota ? "fill-accent text-accent" : "text-gray-300")} aria-hidden />
      ))}
    </span>
  );
}
