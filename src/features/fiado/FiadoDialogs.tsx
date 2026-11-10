import { useEffect, useState, type ReactNode } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { round2 } from "@/lib/pedidos";
import { novoId } from "@/lib/id";
import { useAppStore } from "@/store/useAppStore";
import type { Cliente } from "@/types";

const FORMAS_RECEBIMENTO = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito"];

function Formulario({
  open,
  onOpenChange,
  titulo,
  descricao,
  confirmar,
  rotuloConfirmar,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titulo: string;
  descricao: ReactNode;
  confirmar: () => void;
  rotuloConfirmar: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="form-fiado"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              confirmar();
            }}
          >
            {children}
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-fiado">
            {rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BaseProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cliente: Cliente;
  saldo: number;
}

/* ------------------------------------------------------------------ */

export function PagamentoFiadoDialog({ open, onOpenChange, cliente, saldo }: BaseProps) {
  const registrar = useAppStore((s) => s.registrarPagamentoFiado);
  const [valor, setValor] = useState<number | null>(null);
  const [forma, setForma] = useState("Pix");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValor(saldo > 0 ? saldo : null);
      setForma("Pix");
      setDescricao("");
      setErro(null);
    }
  }, [open, saldo]);

  const credito = valor !== null && valor > saldo + 0.001 ? round2(valor - Math.max(saldo, 0)) : 0;

  return (
    <Formulario
      open={open}
      onOpenChange={onOpenChange}
      titulo="Registrar pagamento"
      descricao={
        <>
          {cliente.nome} · saldo devedor de <strong className="text-ink">{formatCurrency(Math.max(saldo, 0))}</strong>
        </>
      }
      rotuloConfirmar="Registrar pagamento"
      confirmar={() => {
        if (valor === null || valor <= 0) return setErro("Informe um valor maior que zero.");
        registrar(cliente.id, valor, forma, descricao);
        toast.success("Pagamento registrado", { description: `${cliente.nome} · ${formatCurrency(valor)}` });
        onOpenChange(false);
      }}
    >
      <Field
        label="Valor recebido"
        htmlFor="fiado-valor"
        error={erro}
        hint={credito > 0 ? `O valor passa do saldo: ficará um crédito de ${formatCurrency(credito)} para o cliente.` : undefined}
      >
        <CurrencyInput id="fiado-valor" value={valor} onChange={setValor} autoFocus />
      </Field>
      <Field label="Forma de pagamento">
        <Select value={forma} onValueChange={setForma}>
          <SelectTrigger aria-label="Forma de pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAS_RECEBIMENTO.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Descrição (opcional)" htmlFor="fiado-desc">
        <Input id="fiado-desc" placeholder="Pagamento" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={80} />
      </Field>
    </Formulario>
  );
}

/* ------------------------------------------------------------------ */

export function CompraAvulsaDialog({ open, onOpenChange, cliente, saldo }: BaseProps) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [valor, setValor] = useState<number | null>(null);
  const [descricao, setDescricao] = useState("");
  const [erros, setErros] = useState<{ valor?: string; descricao?: string }>({});

  useEffect(() => {
    if (open) {
      setValor(null);
      setDescricao("");
      setErros({});
    }
  }, [open]);

  const excesso = valor !== null && cliente.limite_fiado > 0 ? round2(saldo + valor - cliente.limite_fiado) : 0;

  return (
    <Formulario
      open={open}
      onOpenChange={onOpenChange}
      titulo="Lançar compra avulsa"
      descricao={`Compra fiado fora do sistema de pedidos para ${cliente.nome}.`}
      rotuloConfirmar="Lançar compra"
      confirmar={() => {
        const e: typeof erros = {};
        if (valor === null || valor <= 0) e.valor = "Informe um valor maior que zero.";
        if (!descricao.trim()) e.descricao = "Descreva a compra.";
        setErros(e);
        if (Object.keys(e).length) return;
        salvar("fiado", {
          id: novoId("fia"),
          cliente_id: cliente.id,
          tipo: "compra",
          valor: round2(valor!),
          descricao: descricao.trim(),
          pedido_id: null,
          forma_pagamento: null,
          em: new Date(),
        });
        registrarAtividade(`Lançou compra fiado de ${formatCurrency(valor!)} para ${cliente.nome}`);
        toast.success("Compra lançada", { description: `${cliente.nome} · ${formatCurrency(valor!)}` });
        onOpenChange(false);
      }}
    >
      <Field
        label="Valor"
        htmlFor="compra-valor"
        error={erros.valor}
        hint={excesso > 0 ? `Atenção: ultrapassa o limite do cliente em ${formatCurrency(excesso)}.` : undefined}
      >
        <CurrencyInput id="compra-valor" value={valor} onChange={setValor} autoFocus />
      </Field>
      <Field label="Descrição" htmlFor="compra-desc" error={erros.descricao}>
        <Input
          id="compra-desc"
          placeholder="Ex.: Compra no balcão"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={80}
        />
      </Field>
    </Formulario>
  );
}

/* ------------------------------------------------------------------ */

export function LimiteFiadoDialog({ open, onOpenChange, cliente, saldo }: BaseProps) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [limite, setLimite] = useState<number | null>(cliente.limite_fiado);

  useEffect(() => {
    if (open) setLimite(cliente.limite_fiado);
  }, [open, cliente.limite_fiado]);

  const novo = limite ?? 0;
  const aviso =
    novo === 0
      ? "Com limite zero o cliente não poderá mais comprar fiado."
      : novo < saldo
        ? `O novo limite é menor que o saldo devedor atual (${formatCurrency(saldo)}).`
        : undefined;

  return (
    <Formulario
      open={open}
      onOpenChange={onOpenChange}
      titulo="Ajustar limite de fiado"
      descricao={cliente.nome}
      rotuloConfirmar="Salvar limite"
      confirmar={() => {
        salvar("clientes", { ...cliente, limite_fiado: round2(novo) });
        registrarAtividade(`Alterou o limite de fiado de ${cliente.nome} para ${formatCurrency(novo)}`);
        toast.success("Limite atualizado", { description: formatCurrency(novo) });
        onOpenChange(false);
      }}
    >
      <Field label="Limite de crédito" htmlFor="limite-fiado" hint={aviso}>
        <CurrencyInput id="limite-fiado" value={limite} onChange={setLimite} autoFocus />
      </Field>
    </Formulario>
  );
}
