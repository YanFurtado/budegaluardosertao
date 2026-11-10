import { useEffect, useState } from "react";
import { MapPinned, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ZonaEntrega } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CurrencyInput, Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { normalizar } from "@/components/shared/SearchInput";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { novoId } from "@/lib/id";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";

const iconBtn =
  "flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40";

export function ZonasTab() {
  const zonas = useAppStore((s) => s.zonas);
  const salvar = useAppStore((s) => s.salvar);
  const remover = useAppStore((s) => s.remover);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ZonaEntrega | null>(null);
  const [excluir, setExcluir] = useState<ZonaEntrega | null>(null);

  const abrir = (z: ZonaEntrega | null) => {
    setEditando(z);
    setAberto(true);
  };

  const alternar = (z: ZonaEntrega) => {
    salvar("zonas", { ...z, ativa: !z.ativa });
    registrarAtividade(`${z.ativa ? "Desativou" : "Ativou"} entregas para ${z.bairro}`);
    toast.success(z.ativa ? `Entregas para ${z.bairro} desativadas` : `Entregas para ${z.bairro} ativadas`);
  };

  const columns: Column<ZonaEntrega>[] = [
    {
      key: "bairro",
      header: "Bairro",
      sortValue: (z) => z.bairro,
      render: (z) => <span className={cn("font-semibold", !z.ativa && "text-ink-muted")}>{z.bairro}</span>,
    },
    {
      key: "taxa",
      header: "Taxa",
      align: "right",
      sortValue: (z) => z.taxa,
      render: (z) => (z.taxa === 0 ? <span className="font-semibold text-[#1F7A45]">Grátis</span> : formatCurrency(z.taxa)),
    },
    { key: "tempo", header: "Tempo estimado", sortValue: (z) => z.tempo_min, render: (z) => `${z.tempo_min}–${z.tempo_max} min` },
    {
      key: "ativa",
      header: "Ativa",
      align: "center",
      render: (z) => (
        <span className="relative inline-flex">
          <Switch checked={z.ativa} onCheckedChange={() => alternar(z)} aria-label={`Entregas para ${z.bairro}`} />
        </span>
      ),
    },
    {
      key: "acoes",
      header: (
        <span className="relative">
          <span className="sr-only">Ações</span>
        </span>
      ),
      align: "right",
      render: (z) => (
        <div className="flex justify-end">
          <button type="button" className={iconBtn} onClick={() => abrir(z)} aria-label={`Editar ${z.bairro}`} title="Editar">
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            className={cn(iconBtn, "hover:bg-negative-soft hover:text-negative")}
            onClick={() => setExcluir(z)}
            aria-label={`Excluir ${z.bairro}`}
            title="Excluir"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink-muted">
          {zonas.filter((z) => z.ativa).length} de {zonas.length} {zonas.length === 1 ? "bairro atendido" : "bairros atendidos"}. A taxa é
          somada ao pedido de delivery.
        </p>
        <Button onClick={() => abrir(null)}>
          <Plus /> Nova área
        </Button>
      </div>
      {zonas.length === 0 ? (
        <EmptyState icon={MapPinned} message="Nenhuma área de entrega cadastrada" />
      ) : (
        <DataTable columns={columns} rows={zonas} rowKey={(z) => z.id} defaultSort={{ key: "bairro", dir: "asc" }} />
      )}

      <ZonaDialog open={aberto} onOpenChange={setAberto} zona={editando} zonas={zonas} />

      <ConfirmDialog
        open={!!excluir}
        onOpenChange={(o) => !o && setExcluir(null)}
        title={`Excluir a área ${excluir?.bairro ?? ""}?`}
        description="Clientes desse bairro mantêm o endereço, mas não poderão pedir delivery até a área voltar."
        confirmLabel="Excluir área"
        destructive
        onConfirm={() => {
          if (!excluir) return;
          remover("zonas", excluir.id);
          registrarAtividade(`Excluiu a área de entrega ${excluir.bairro}`);
          toast.success("Área de entrega excluída");
        }}
      />
    </div>
  );
}

function ZonaDialog({
  open,
  onOpenChange,
  zona,
  zonas,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  zona: ZonaEntrega | null;
  zonas: ZonaEntrega[];
}) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [bairro, setBairro] = useState("");
  const [taxa, setTaxa] = useState<number | null>(null);
  const [tMin, setTMin] = useState("30");
  const [tMax, setTMax] = useState("45");
  const [ativa, setAtiva] = useState(true);
  const [erros, setErros] = useState<{ bairro?: string; taxa?: string; tempo?: string }>({});

  useEffect(() => {
    if (!open) return;
    setBairro(zona?.bairro ?? "");
    setTaxa(zona?.taxa ?? null);
    setTMin(String(zona?.tempo_min ?? 30));
    setTMax(String(zona?.tempo_max ?? 45));
    setAtiva(zona?.ativa ?? true);
    setErros({});
  }, [open, zona]);

  const onSalvar = () => {
    const e: typeof erros = {};
    const nome = bairro.trim();
    const min = Number(tMin);
    const max = Number(tMax);
    if (!nome) e.bairro = "Informe o bairro.";
    else if (zonas.some((z) => z.id !== zona?.id && normalizar(z.bairro) === normalizar(nome))) e.bairro = "Esse bairro já está cadastrado.";
    if (taxa === null || taxa < 0) e.taxa = "Informe a taxa (use 0 para entrega grátis).";
    if (tMin === "" || tMax === "" || !Number.isInteger(min) || !Number.isInteger(max) || min < 0) e.tempo = "Use minutos inteiros.";
    else if (min > max) e.tempo = "O tempo mínimo não pode ser maior que o máximo.";
    setErros(e);
    if (Object.keys(e).length) return;

    salvar("zonas", { id: zona?.id ?? novoId("zona"), bairro: nome, taxa: round2(taxa!), tempo_min: min, tempo_max: max, ativa });
    registrarAtividade(`${zona ? "Editou" : "Criou"} a área de entrega ${nome}`);
    toast.success(zona ? "Área atualizada" : "Área criada");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{zona ? "Editar área de entrega" : "Nova área de entrega"}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label="Bairro *" htmlFor="zona-bairro" error={erros.bairro}>
            <Input id="zona-bairro" value={bairro} maxLength={60} autoFocus onChange={(e) => setBairro(e.target.value)} />
          </Field>
          <Field label="Taxa de entrega *" error={erros.taxa}>
            <CurrencyInput value={taxa} onChange={setTaxa} aria-label="Taxa de entrega" />
          </Field>
          <Field label="Tempo estimado (minutos)" error={erros.tempo}>
            <div className="flex items-center gap-2">
              <Input type="number" inputMode="numeric" min={0} aria-label="Tempo mínimo" value={tMin} onChange={(e) => setTMin(e.target.value)} />
              <span className="text-ink-muted">a</span>
              <Input type="number" inputMode="numeric" min={0} aria-label="Tempo máximo" value={tMax} onChange={(e) => setTMax(e.target.value)} />
            </div>
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
            <span className="font-semibold">Entregas ativas para este bairro</span>
            <Switch checked={ativa} onCheckedChange={setAtiva} aria-label="Entregas ativas" />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar}>{zona ? "Salvar" : "Criar área"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
