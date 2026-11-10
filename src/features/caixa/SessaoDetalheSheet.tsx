import { format } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogBody, DialogDescription, DialogFooter, DialogHeader, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { nomeFuncionario, useAppStore } from "@/store/useAppStore";
import { resumoSessao, duracao } from "./resumo";
import { Diferenca } from "./Diferenca";
import { PrintStyles } from "./PrintStyles";

/** Relatório (somente leitura) de um turno de caixa, com botão de imprimir. */
export function SessaoDetalheSheet({ sessaoId, onClose }: { sessaoId: string | null; onClose: () => void }) {
  const sessao = useAppStore((s) => s.sessoesCaixa.find((c) => c.id === sessaoId) ?? null);
  const pedidos = useAppStore((s) => s.pedidos);
  const funcionarios = useAppStore((s) => s.funcionarios);
  const loja = useAppStore((s) => s.loja);

  const r = sessao ? resumoSessao(sessao, pedidos) : null;

  return (
    <Dialog open={!!sessao} onOpenChange={(v) => !v && onClose()}>
      {sessao && r && (
        <SheetContent data-print-area className="max-w-xl">
          <PrintStyles />
          <DialogHeader>
            <DialogTitle>Caixa de {format(sessao.aberto_em, "dd/MM/yyyy")}</DialogTitle>
            <DialogDescription>
              {loja.nome} · {format(sessao.aberto_em, "HH:mm")} – {sessao.fechado_em ? format(sessao.fechado_em, "HH:mm") : "aberto"} (
              {duracao(r.inicio, r.fim)})
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Info rotulo="Aberto por" valor={`${nomeFuncionario(funcionarios, sessao.aberto_por)} às ${format(sessao.aberto_em, "HH:mm")}`} />
              <Info
                rotulo="Fechado por"
                valor={sessao.fechado_em ? `${nomeFuncionario(funcionarios, sessao.fechado_por)} às ${format(sessao.fechado_em, "HH:mm")}` : "—"}
              />
              <Info rotulo="Valor inicial" valor={formatCurrency(sessao.valor_inicial)} />
              <Info rotulo="Pedidos" valor={String(r.qtdPedidos)} />
            </dl>

            <section>
              <h3 className="mb-2 font-semibold">Vendas por forma de pagamento</h3>
              {r.porForma.length === 0 ? (
                <p className="text-ink-muted">Nenhuma venda.</p>
              ) : (
                <table className="w-full text-[13px]">
                  <tbody>
                    {r.porForma.map((f) => (
                      <tr key={f.forma} className="border-b border-line">
                        <td className="py-1.5">{f.forma}</td>
                        <td className="py-1.5 text-right text-ink-muted">{f.pedidos} ped.</td>
                        <td className="py-1.5 text-right tabular-nums">{formatCurrency(f.total)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-1.5">Total</td>
                      <td />
                      <td className="py-1.5 text-right tabular-nums">{formatCurrency(r.vendas)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Movimentações</h3>
              {sessao.movimentos.length === 0 ? (
                <p className="text-ink-muted">Nenhuma sangria ou suprimento.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {sessao.movimentos.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <Badge tom={m.tipo === "sangria" ? "red" : "green"}>{m.tipo === "sangria" ? "Sangria" : "Suprimento"}</Badge>
                        <span className="truncate">{m.motivo}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        <span className="mr-2 text-[12px] text-ink-muted">{format(m.em, "HH:mm")}</span>
                        {m.tipo === "sangria" ? "−" : "+"}
                        {formatCurrency(m.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-md border border-line p-3">
              <h3 className="mb-2 font-semibold">Conferência do dinheiro</h3>
              <dl className="flex flex-col gap-1">
                <Linha rotulo="Valor inicial" valor={formatCurrency(sessao.valor_inicial)} />
                <Linha rotulo="Vendas em dinheiro" valor={formatCurrency(r.vendasDinheiro)} />
                <Linha rotulo="Suprimentos" valor={`+${formatCurrency(r.suprimentos)}`} />
                <Linha rotulo="Sangrias" valor={`−${formatCurrency(r.sangrias)}`} />
                <div className="mt-1 border-t border-line pt-1.5">
                  <Linha rotulo="Esperado" valor={formatCurrency(r.dinheiroEsperado)} forte />
                  <Linha rotulo="Contado" valor={r.contado === null ? "—" : formatCurrency(r.contado)} forte />
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold">Diferença</dt>
                  <dd>
                    <Diferenca valor={r.diferenca} />
                  </dd>
                </div>
              </dl>
              {sessao.observacao && <p className="mt-2 text-[12px] text-ink-muted">Observação: {sessao.observacao}</p>}
            </section>
          </DialogBody>
          <DialogFooter className="print-hide">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => window.print()}>
              <Printer /> Imprimir
            </Button>
          </DialogFooter>
        </SheetContent>
      )}
    </Dialog>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-ink-muted">{rotulo}</dt>
      <dd className="truncate font-semibold">{valor}</dd>
    </div>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className={forte ? "flex justify-between gap-3 font-semibold" : "flex justify-between gap-3"}>
      <dt className={forte ? undefined : "text-ink-muted"}>{rotulo}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}
