import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput, Field, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import type { SessaoCaixa } from "@/types";
import type { ResumoSessao } from "./resumo";
import { Diferenca } from "./Diferenca";

interface FecharCaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessao: SessaoCaixa;
  resumo: ResumoSessao;
  /** Chamado com o id da sessão recém-fechada (para abrir o relatório). */
  onFechado: (sessaoId: string) => void;
}

export function FecharCaixaDialog({ open, onOpenChange, sessao, resumo, onFechado }: FecharCaixaDialogProps) {
  const fecharCaixa = useAppStore((s) => s.fecharCaixa);
  const [contado, setContado] = useState<number | null>(null);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setContado(null);
      setObservacao("");
      setErro(null);
    }
  }, [open]);

  const diferenca = contado === null ? null : round2(contado - resumo.dinheiroEsperado);

  const confirmar = () => {
    if (contado === null || contado < 0) {
      setErro("Conte o dinheiro da gaveta e informe o valor.");
      return;
    }
    fecharCaixa(contado, observacao);
    toast.success("Caixa fechado");
    onOpenChange(false);
    onFechado(sessao.id);
  };

  const linhasGaveta: [string, number][] = [
    ["Valor inicial", sessao.valor_inicial],
    ["Vendas em dinheiro", resumo.vendasDinheiro],
    ["Suprimentos", resumo.suprimentos],
    ["Sangrias", -resumo.sangrias],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Fechar caixa</DialogTitle>
          <DialogDescription>Confira os valores do turno e informe o dinheiro contado na gaveta.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <section>
            <h3 className="mb-2 font-semibold">Vendas do turno por forma de pagamento</h3>
            {resumo.porForma.length === 0 ? (
              <p className="text-ink-muted">Nenhuma venda neste turno.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-line text-left">
                      <th className="px-3 py-2 font-semibold">Forma</th>
                      <th className="px-3 py-2 text-right font-semibold">Pedidos</th>
                      <th className="px-3 py-2 text-right font-semibold">Esperado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.porForma.map((f) => (
                      <tr key={f.forma} className="border-t border-line">
                        <td className="px-3 py-2">{f.forma}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{f.pedidos}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(f.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line bg-gray-50 font-semibold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums">{resumo.qtdPedidos}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(resumo.vendas)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-1.5 text-[12px] text-ink-muted">
              Pix, cartões e fiado não ficam na gaveta — confira-os no extrato da maquininha/banco.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-line p-3">
              <h3 className="mb-2 font-semibold">Dinheiro na gaveta</h3>
              <dl className="flex flex-col gap-1">
                {linhasGaveta.map(([rotulo, v]) => (
                  <div key={rotulo} className="flex justify-between gap-3">
                    <dt className="text-ink-muted">{rotulo}</dt>
                    <dd className="tabular-nums">{formatCurrency(v)}</dd>
                  </div>
                ))}
                <div className="mt-1 flex justify-between gap-3 border-t border-line pt-1.5 font-semibold">
                  <dt>Esperado</dt>
                  <dd className="tabular-nums">{formatCurrency(resumo.dinheiroEsperado)}</dd>
                </div>
              </dl>
            </div>

            <form
              id="form-fechar-caixa"
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                confirmar();
              }}
            >
              <Field label="Valor contado" htmlFor="valor-contado" error={erro}>
                <CurrencyInput id="valor-contado" value={contado} onChange={setContado} autoFocus />
              </Field>
              <div className="rounded-md bg-gray-50 px-3 py-2" aria-live="polite">
                <span className="text-[12px] text-ink-muted">Diferença: </span>
                {diferenca === null ? <span className="text-ink-muted">informe o valor contado</span> : <Diferenca valor={diferenca} descritivo />}
              </div>
              <Field label="Observação" htmlFor="obs-fechamento" hint="Explique a diferença, se houver.">
                <Textarea id="obs-fechamento" rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={200} />
              </Field>
            </form>
          </section>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-fechar-caixa">
            Fechar caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
