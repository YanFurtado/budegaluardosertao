import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
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
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

/** Escolhe um cliente sem limite de fiado e define um limite. */
export function LiberarFiadoDialog({
  open,
  onOpenChange,
  onLiberado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLiberado?: (clienteId: string) => void;
}) {
  const clientes = useAppStore((s) => s.clientes);
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [limite, setLimite] = useState<number | null>(200);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBusca("");
      setSelecionado(null);
      setLimite(200);
      setErro(null);
    }
  }, [open]);

  const candidatos = useMemo(
    () =>
      clientes
        .filter((c) => c.limite_fiado <= 0 && (contem(c.nome, busca) || contem(c.telefone, busca)))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [clientes, busca],
  );

  const confirmar = () => {
    const cliente = clientes.find((c) => c.id === selecionado);
    if (!cliente) return setErro("Escolha um cliente.");
    if (limite === null || limite <= 0) return setErro("Informe um limite maior que zero.");
    salvar("clientes", { ...cliente, limite_fiado: limite });
    registrarAtividade(`Liberou fiado de ${formatCurrency(limite)} para ${cliente.nome}`);
    toast.success("Fiado liberado", { description: `${cliente.nome} · limite de ${formatCurrency(limite)}` });
    onOpenChange(false);
    onLiberado?.(cliente.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Liberar fiado para cliente</DialogTitle>
          <DialogDescription>Escolha o cliente e o limite de crédito.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou telefone" />
          <div className="max-h-64 overflow-y-auto rounded-md border border-line" role="listbox" aria-label="Clientes sem fiado">
            {candidatos.length === 0 ? (
              <p className="px-3 py-6 text-center text-ink-muted">Nenhum cliente encontrado</p>
            ) : (
              candidatos.map((c) => {
                const ativo = c.id === selecionado;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={ativo}
                    onClick={() => {
                      setSelecionado(c.id);
                      setErro(null);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-gray-50",
                      ativo && "bg-chart-primary/10",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.nome}</span>
                      <span className="block text-[12px] text-ink-muted">
                        {c.telefone}
                        {c.bairro ? ` · ${c.bairro}` : ""}
                      </span>
                    </span>
                    {ativo && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
          <Field label="Limite de crédito" htmlFor="limite-liberar" error={erro}>
            <CurrencyInput id="limite-liberar" value={limite} onChange={setLimite} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmar}>Liberar fiado</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
