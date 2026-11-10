import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ConfigEntrega } from "@/types";
import { Button } from "@/components/ui/button";
import { CurrencyInput, Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";

interface Form {
  pedido_minimo: number | null;
  freteGratisAtivo: boolean;
  frete_gratis_acima: number | null;
  aceita_agendamento: boolean;
  raio_km: string;
}

const paraForm = (c: ConfigEntrega): Form => ({
  pedido_minimo: c.pedido_minimo,
  freteGratisAtivo: c.frete_gratis_acima !== null,
  frete_gratis_acima: c.frete_gratis_acima,
  aceita_agendamento: c.aceita_agendamento,
  raio_km: String(c.raio_km),
});

export function RegrasForm() {
  const config = useAppStore((s) => s.configEntrega);
  const atualizar = useAppStore((s) => s.atualizarConfigEntrega);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [form, setForm] = useState<Form>(() => paraForm(config));
  const [erros, setErros] = useState<{ minimo?: string; frete?: string; raio?: string }>({});

  useEffect(() => setForm(paraForm(config)), [config]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const alterado = JSON.stringify(form) !== JSON.stringify(paraForm(config));

  const onSalvar = () => {
    const e: typeof erros = {};
    const raio = Number(form.raio_km.replace(",", "."));
    if (form.pedido_minimo !== null && form.pedido_minimo < 0) e.minimo = "Valor inválido.";
    if (form.freteGratisAtivo && (form.frete_gratis_acima === null || form.frete_gratis_acima <= 0))
      e.frete = "Informe o valor a partir do qual a entrega é grátis.";
    if (!form.raio_km.trim() || Number.isNaN(raio) || raio <= 0) e.raio = "Informe um raio maior que zero.";
    setErros(e);
    if (Object.keys(e).length) return;

    atualizar({
      pedido_minimo: round2(form.pedido_minimo ?? 0),
      frete_gratis_acima: form.freteGratisAtivo ? round2(form.frete_gratis_acima!) : null,
      aceita_agendamento: form.aceita_agendamento,
      raio_km: round2(raio),
    });
    registrarAtividade("Atualizou as regras de entrega");
    toast.success("Regras de entrega salvas");
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pedido mínimo para delivery" error={erros.minimo} hint="Valor dos produtos, sem a taxa.">
          <CurrencyInput
            value={form.pedido_minimo}
            onChange={(v) => set("pedido_minimo", v)}
            placeholder="Sem mínimo"
            aria-label="Pedido mínimo para delivery"
          />
        </Field>
        <Field label="Raio de entrega (km)" htmlFor="raio" error={erros.raio}>
          <Input
            id="raio"
            inputMode="decimal"
            value={form.raio_km}
            onChange={(e) => set("raio_km", e.target.value.replace(/[^\d,.]/g, ""))}
          />
        </Field>
      </div>

      <div className="rounded-md border border-line p-3">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block font-semibold">Frete grátis acima de um valor</span>
            <span className="block text-[12px] text-ink-muted">A taxa de entrega é zerada quando os produtos passam do valor.</span>
          </span>
          <Switch checked={form.freteGratisAtivo} onCheckedChange={(v) => set("freteGratisAtivo", v)} aria-label="Frete grátis acima de um valor" />
        </label>
        {form.freteGratisAtivo && (
          <Field label="Frete grátis a partir de" error={erros.frete} className="mt-3 sm:max-w-[240px]">
            <CurrencyInput value={form.frete_gratis_acima} onChange={(v) => set("frete_gratis_acima", v)} aria-label="Frete grátis a partir de" />
          </Field>
        )}
      </div>

      <label className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
        <span>
          <span className="block font-semibold">Aceitar pedidos agendados</span>
          <span className="block text-[12px] text-ink-muted">O cliente escolhe dia e horário para receber.</span>
        </span>
        <Switch checked={form.aceita_agendamento} onCheckedChange={(v) => set("aceita_agendamento", v)} aria-label="Aceitar pedidos agendados" />
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={!alterado} onClick={() => setForm(paraForm(config))}>
          Descartar
        </Button>
        <Button disabled={!alterado} onClick={onSalvar}>
          Salvar regras
        </Button>
      </div>
    </div>
  );
}
