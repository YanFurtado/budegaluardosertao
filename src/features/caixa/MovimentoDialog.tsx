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
import { CurrencyInput, Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import type { MovimentoCaixa } from "@/types";

const SUGESTOES: Record<MovimentoCaixa["tipo"], string[]> = {
  sangria: ["Retirada para depósito", "Pagamento de fornecedor", "Troco para entregador"],
  suprimento: ["Reforço de troco", "Fundo de caixa"],
};

interface MovimentoDialogProps {
  open: boolean;
  tipo: MovimentoCaixa["tipo"];
  onOpenChange: (open: boolean) => void;
  /** Dinheiro esperado na gaveta — limite para a sangria. */
  dinheiroEsperado: number;
}

export function MovimentoDialog({ open, tipo, onOpenChange, dinheiroEsperado }: MovimentoDialogProps) {
  const movimentarCaixa = useAppStore((s) => s.movimentarCaixa);
  const [valor, setValor] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("");
  const [erros, setErros] = useState<{ valor?: string; motivo?: string }>({});

  useEffect(() => {
    if (open) {
      setValor(null);
      setMotivo("");
      setErros({});
    }
  }, [open]);

  const ehSangria = tipo === "sangria";

  const confirmar = () => {
    const e: typeof erros = {};
    if (valor === null || valor <= 0) e.valor = "Informe um valor maior que zero.";
    else if (ehSangria && valor > dinheiroEsperado + 0.001)
      e.valor = `A sangria não pode passar do dinheiro esperado na gaveta (${formatCurrency(dinheiroEsperado)}).`;
    if (!motivo.trim()) e.motivo = "Informe o motivo.";
    setErros(e);
    if (Object.keys(e).length) return;
    movimentarCaixa(tipo, valor!, motivo.trim());
    toast.success(ehSangria ? "Sangria registrada" : "Suprimento registrado", { description: formatCurrency(valor!) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{ehSangria ? "Sangria" : "Suprimento"}</DialogTitle>
          <DialogDescription>
            {ehSangria ? "Retirada de dinheiro da gaveta." : "Entrada de dinheiro na gaveta (ex.: reforço de troco)."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="form-movimento"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              confirmar();
            }}
          >
            <Field
              label="Valor"
              htmlFor="mov-valor"
              error={erros.valor}
              hint={ehSangria ? `Disponível na gaveta: ${formatCurrency(dinheiroEsperado)}` : undefined}
            >
              <CurrencyInput id="mov-valor" value={valor} onChange={setValor} autoFocus />
            </Field>
            <Field label="Motivo" htmlFor="mov-motivo" error={erros.motivo}>
              <Input id="mov-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={80} />
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES[tipo].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setMotivo(s)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[12px] transition-colors hover:bg-gray-50",
                      motivo === s ? "border-primary text-primary" : "border-line text-ink-muted",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-movimento">
            Registrar {ehSangria ? "sangria" : "suprimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
