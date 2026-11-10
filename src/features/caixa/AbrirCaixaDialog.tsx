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
import { CurrencyInput, Field } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

export function AbrirCaixaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const abrirCaixa = useAppStore((s) => s.abrirCaixa);
  const ultimoInicial = useAppStore((s) => {
    const fechadas = s.sessoesCaixa.filter((c) => c.fechado_em);
    return fechadas.length ? fechadas[fechadas.length - 1].valor_inicial : 150;
  });
  const [valor, setValor] = useState<number | null>(ultimoInicial);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValor(ultimoInicial);
      setErro(null);
    }
  }, [open, ultimoInicial]);

  const confirmar = () => {
    if (valor === null || valor < 0) {
      setErro("Informe o valor inicial (pode ser R$ 0,00).");
      return;
    }
    abrirCaixa(valor);
    toast.success("Caixa aberto", { description: `Valor inicial de ${formatCurrency(valor)}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Abrir caixa</DialogTitle>
          <DialogDescription>Informe o dinheiro que está na gaveta para começar o turno.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="form-abrir-caixa"
            onSubmit={(e) => {
              e.preventDefault();
              confirmar();
            }}
          >
            <Field label="Valor inicial (fundo de troco)" htmlFor="valor-inicial" error={erro} hint="Sugestão: o mesmo valor do último turno.">
              <CurrencyInput id="valor-inicial" value={valor} onChange={setValor} autoFocus />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-abrir-caixa">
            Abrir caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
