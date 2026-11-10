import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { toast } from "sonner";
import type { Cupom, TipoCupom } from "@/types";
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
import { CurrencyInput, Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { novoId } from "@/lib/id";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import { frasePrevia } from "./cupomUtils";

const TIPOS: { value: TipoCupom; label: string }[] = [
  { value: "percentual", label: "Percentual (%)" },
  { value: "valor_fixo", label: "Valor fixo (R$)" },
  { value: "frete_gratis", label: "Frete grátis" },
];

interface Form {
  codigo: string;
  descricao: string;
  tipo: TipoCupom;
  valor: number | null;
  pedido_minimo: number | null;
  inicio: string; // yyyy-MM-dd
  fim: string; // yyyy-MM-dd ou ""
  limite: string;
  primeira_compra: boolean;
  ativo: boolean;
}

type Erros = Partial<Record<keyof Form, string>>;

const paraData = (s: string, fimDoDia: boolean) => (s ? new Date(`${s}T${fimDoDia ? "23:59:59.999" : "00:00:00"}`) : null);

interface CupomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = novo cupom. */
  cupom: Cupom | null;
  cupons: Cupom[];
}

export function CupomDialog({ open, onOpenChange, cupom, cupons }: CupomDialogProps) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [form, setForm] = useState<Form>(vazio());
  const [erros, setErros] = useState<Erros>({});

  useEffect(() => {
    if (!open) return;
    setErros({});
    setForm(
      cupom
        ? {
            codigo: cupom.codigo,
            descricao: cupom.descricao,
            tipo: cupom.tipo,
            valor: cupom.tipo === "frete_gratis" ? null : cupom.valor,
            pedido_minimo: cupom.pedido_minimo,
            inicio: format(cupom.inicio, "yyyy-MM-dd"),
            fim: cupom.fim ? format(cupom.fim, "yyyy-MM-dd") : "",
            limite: cupom.limite_usos === null ? "" : String(cupom.limite_usos),
            primeira_compra: cupom.primeira_compra,
            ativo: cupom.ativo,
          }
        : vazio(),
    );
  }, [open, cupom]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const limiteNum = form.limite.trim() === "" ? null : Number(form.limite);
  const previa = useMemo(
    () =>
      frasePrevia({
        tipo: form.tipo,
        valor: form.valor,
        pedido_minimo: form.pedido_minimo ?? 0,
        inicio: paraData(form.inicio, false),
        fim: paraData(form.fim, true),
        limite_usos: limiteNum !== null && Number.isInteger(limiteNum) && limiteNum > 0 ? limiteNum : null,
        primeira_compra: form.primeira_compra,
      }),
    [form, limiteNum],
  );

  const validar = (): Erros => {
    const e: Erros = {};
    const codigo = form.codigo.trim();
    if (!codigo) e.codigo = "Informe o código.";
    else if (!/^[A-Z0-9_-]{3,20}$/.test(codigo)) e.codigo = "Use de 3 a 20 letras, números, - ou _ (sem espaços).";
    else if (cupons.some((c) => c.id !== cupom?.id && c.codigo.toUpperCase() === codigo)) e.codigo = "Já existe um cupom com esse código.";

    if (form.tipo === "percentual") {
      if (form.valor === null || form.valor < 1 || form.valor > 100) e.valor = "Informe um percentual entre 1 e 100.";
    } else if (form.tipo === "valor_fixo") {
      if (form.valor === null || form.valor <= 0) e.valor = "Informe um valor maior que zero.";
    }
    if (form.pedido_minimo !== null && form.pedido_minimo < 0) e.pedido_minimo = "Valor inválido.";
    if (!form.inicio) e.inicio = "Informe a data de início.";
    if (form.fim && form.inicio && form.fim < form.inicio) e.fim = "O fim precisa ser depois do início.";
    if (limiteNum !== null && (!Number.isInteger(limiteNum) || limiteNum < 1)) e.limite = "Use um número inteiro a partir de 1.";
    return e;
  };

  const onSalvar = () => {
    const e = validar();
    setErros(e);
    if (Object.keys(e).length) return;
    const item: Cupom = {
      id: cupom?.id ?? novoId("cup"),
      criado_em: cupom?.criado_em ?? new Date(),
      codigo: form.codigo.trim(),
      descricao: form.descricao.trim() || previa,
      tipo: form.tipo,
      valor: form.tipo === "frete_gratis" ? 0 : round2(form.valor!),
      pedido_minimo: round2(form.pedido_minimo ?? 0),
      inicio: paraData(form.inicio, false)!,
      fim: paraData(form.fim, true),
      limite_usos: limiteNum,
      primeira_compra: form.primeira_compra,
      ativo: form.ativo,
    };
    salvar("cupons", item);
    registrarAtividade(`${cupom ? "Editou" : "Criou"} o cupom ${item.codigo}`);
    toast.success(cupom ? "Cupom atualizado" : "Cupom criado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{cupom ? `Editar cupom ${cupom.codigo}` : "Novo cupom"}</DialogTitle>
          <DialogDescription>O cliente digita o código no cardápio digital ou no PDV.</DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código *" htmlFor="cup-codigo" error={erros.codigo} hint="Letras maiúsculas, sem espaços.">
              <Input
                id="cup-codigo"
                value={form.codigo}
                maxLength={20}
                autoFocus
                className="font-mono uppercase tracking-wide"
                onChange={(e) => set("codigo", e.target.value.toUpperCase().replace(/\s+/g, ""))}
              />
            </Field>
            <Field label="Descrição" htmlFor="cup-desc" hint="Opcional. Se vazio, usamos a frase da prévia.">
              <Textarea id="cup-desc" rows={1} value={form.descricao} maxLength={120} onChange={(e) => set("descricao", e.target.value)} />
            </Field>
          </div>

          <Field label="Tipo de desconto">
            <div role="radiogroup" aria-label="Tipo de desconto" className="grid grid-cols-3 gap-1 rounded-md bg-gray-100 p-1">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={form.tipo === t.value}
                  onClick={() => set("tipo", t.value)}
                  className={cn(
                    "rounded px-2 py-2 text-[12px] font-semibold transition-colors sm:text-[13px]",
                    form.tipo === t.value ? "bg-white text-primary shadow-sm" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {form.tipo === "percentual" && (
              <Field label="Percentual *" htmlFor="cup-pct" error={erros.valor}>
                <div className="relative">
                  <Input
                    id="cup-pct"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={100}
                    className="pr-8 tabular-nums"
                    value={form.valor ?? ""}
                    onChange={(e) => set("valor", e.target.value === "" ? null : Number(e.target.value))}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">%</span>
                </div>
              </Field>
            )}
            {form.tipo === "valor_fixo" && (
              <Field label="Valor do desconto *" error={erros.valor}>
                <CurrencyInput value={form.valor} onChange={(v) => set("valor", v)} aria-label="Valor do desconto" />
              </Field>
            )}
            <Field label="Pedido mínimo" error={erros.pedido_minimo} hint="Valor dos produtos, sem taxas.">
              <CurrencyInput
                value={form.pedido_minimo}
                onChange={(v) => set("pedido_minimo", v)}
                placeholder="Sem mínimo"
                aria-label="Pedido mínimo"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Início *" htmlFor="cup-ini" error={erros.inicio}>
              <Input id="cup-ini" type="date" value={form.inicio} onChange={(e) => set("inicio", e.target.value)} />
            </Field>
            <Field label="Fim" htmlFor="cup-fim" error={erros.fim} hint="Vazio = sem data de fim.">
              <Input id="cup-fim" type="date" value={form.fim} min={form.inicio} onChange={(e) => set("fim", e.target.value)} />
            </Field>
            <Field label="Limite de usos" htmlFor="cup-lim" error={erros.limite} hint="Vazio = ilimitado.">
              <Input
                id="cup-lim"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="Ilimitado"
                value={form.limite}
                onChange={(e) => set("limite", e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-line p-3">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Só na primeira compra</span>
                <span className="block text-[12px] text-ink-muted">Vale apenas para clientes que nunca pediram.</span>
              </span>
              <Switch checked={form.primeira_compra} onCheckedChange={(v) => set("primeira_compra", v)} aria-label="Só na primeira compra" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Cupom ativo</span>
                <span className="block text-[12px] text-ink-muted">Desligado, o código não é aceito.</span>
              </span>
              <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} aria-label="Cupom ativo" />
            </label>
          </div>

          <div className="flex gap-2 rounded-md bg-chart-primary/10 p-3 text-[13px]" aria-live="polite">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-semibold">Prévia: </span>
              {previa}
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar}>{cupom ? "Salvar alterações" : "Criar cupom"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function vazio(): Form {
  return {
    codigo: "",
    descricao: "",
    tipo: "percentual",
    valor: 10,
    pedido_minimo: null,
    inicio: format(new Date(), "yyyy-MM-dd"),
    fim: "",
    limite: "",
    primeira_compra: false,
    ativo: true,
  };
}
