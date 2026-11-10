import { useMemo, useState } from "react";
import { format } from "date-fns";
import { HandCoins, MessageCircle, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogBody, DialogDescription, DialogHeader, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import { linkWhatsApp } from "@/features/clientes/telefone";
import { extrato } from "./contas";
import { UsoLimite } from "./UsoLimite";
import { CompraAvulsaDialog, LimiteFiadoDialog, PagamentoFiadoDialog } from "./FiadoDialogs";

type Acao = "pagamento" | "compra" | "limite" | null;

/** Painel lateral com o extrato de fiado de um cliente e as ações da conta. */
export function FiadoClienteSheet({ clienteId, onClose }: { clienteId: string | null; onClose: () => void }) {
  const cliente = useAppStore((s) => s.clientes.find((c) => c.id === clienteId) ?? null);
  const fiado = useAppStore((s) => s.fiado);
  const nomeLoja = useAppStore((s) => s.loja.nome);
  const [acao, setAcao] = useState<Acao>(null);

  const linhas = useMemo(() => (clienteId ? extrato(fiado.filter((l) => l.cliente_id === clienteId)) : []), [fiado, clienteId]);
  const saldo = linhas.length ? linhas[linhas.length - 1].saldo : 0;
  const limite = cliente?.limite_fiado ?? 0;
  const disponivel = round2(Math.max(0, limite - Math.max(saldo, 0)));

  const mensagem = cliente
    ? `Olá, ${cliente.nome.split(" ")[0]}! Tudo bem? Aqui é da ${nomeLoja}. Passando para lembrar que há um saldo de ${formatCurrency(
        saldo,
      )} em aberto na sua conta fiado. Qualquer dúvida, estamos à disposição. Obrigado!`
    : "";
  const podeCobrar = !!cliente?.telefone && saldo > 0;

  return (
    <Dialog open={!!cliente} onOpenChange={(v) => !v && onClose()}>
      {cliente && (
        <SheetContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{cliente.nome}</DialogTitle>
            <DialogDescription>
              {cliente.telefone}
              {cliente.bairro ? ` · ${cliente.bairro}` : ""}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5">
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3">
              <Resumo rotulo="Saldo devedor" valor={formatCurrency(saldo)} destaque={saldo > 0 ? "text-negative" : "text-[#1F8A4C]"} />
              <Resumo rotulo="Limite" valor={limite > 0 ? formatCurrency(limite) : "—"} />
              <Resumo rotulo="Disponível" valor={limite > 0 ? formatCurrency(disponivel) : "—"} />
            </div>
            {limite > 0 && (
              <div className="flex items-center gap-2 text-[12px] text-ink-muted">
                Uso do limite <UsoLimite uso={Math.max(saldo, 0) / limite} />
                {saldo > limite && <Badge tom="red">Acima do limite</Badge>}
              </div>
            )}

            {/* Ações */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setAcao("pagamento")}>
                <HandCoins /> Registrar pagamento
              </Button>
              <Button variant="outline" onClick={() => setAcao("compra")}>
                <Plus /> Compra avulsa
              </Button>
              <Button variant="outline" onClick={() => setAcao("limite")}>
                <SlidersHorizontal /> Ajustar limite
              </Button>
              {podeCobrar ? (
                <a
                  href={linkWhatsApp(cliente.telefone, mensagem)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-[13px] font-semibold text-[#1F8A4C] hover:bg-gray-50 [&_svg]:size-4"
                >
                  <MessageCircle /> Cobrar no WhatsApp
                </a>
              ) : (
                <Button variant="outline" disabled title="Sem saldo para cobrar">
                  <MessageCircle /> Cobrar no WhatsApp
                </Button>
              )}
            </div>

            {/* Extrato */}
            <section>
              <h3 className="mb-2 font-semibold">Extrato</h3>
              {linhas.length === 0 ? (
                <EmptyState message="Nenhum lançamento ainda" />
              ) : (
                <div className="overflow-x-auto rounded-md border border-line">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-line text-left">
                        <th className="px-3 py-2 font-semibold">Data</th>
                        <th className="px-3 py-2 font-semibold">Descrição</th>
                        <th className="px-3 py-2 text-right font-semibold">Valor</th>
                        <th className="px-3 py-2 text-right font-semibold">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map(({ lancamento: l, saldo: s }) => (
                        <tr key={l.id} className="border-t border-line">
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink-muted">{format(l.em, "dd/MM/yy")}</td>
                          <td className="px-3 py-2">
                            {l.descricao}
                            {l.forma_pagamento && <span className="text-[12px] text-ink-muted"> · {l.forma_pagamento}</span>}
                          </td>
                          <td
                            className={cn(
                              "whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums",
                              l.tipo === "compra" ? "text-negative" : "text-[#1F8A4C]",
                            )}
                          >
                            {l.tipo === "compra" ? "+" : "−"}
                            {formatCurrency(l.valor)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCurrency(s)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-1.5 text-[12px] text-ink-muted">
                Compras (+) aumentam a dívida; pagamentos (−) reduzem. Pedidos fiado cancelados saem do extrato.
              </p>
            </section>
          </DialogBody>

          <PagamentoFiadoDialog open={acao === "pagamento"} onOpenChange={(v) => !v && setAcao(null)} cliente={cliente} saldo={saldo} />
          <CompraAvulsaDialog open={acao === "compra"} onOpenChange={(v) => !v && setAcao(null)} cliente={cliente} saldo={saldo} />
          <LimiteFiadoDialog open={acao === "limite"} onOpenChange={(v) => !v && setAcao(null)} cliente={cliente} saldo={saldo} />
        </SheetContent>
      )}
    </Dialog>
  );
}

function Resumo({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: string }) {
  return (
    <div className="rounded-md bg-gray-50 px-3 py-2">
      <p className="text-[12px] text-ink-muted">{rotulo}</p>
      <p className={cn("truncate text-[15px] font-bold tabular-nums", destaque)}>{valor}</p>
    </div>
  );
}
