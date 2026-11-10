import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { CircleDollarSign, Copy, Pencil, Plus, Receipt, TicketPercent, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Cupom } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CardHeader } from "@/components/shared/CardHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { cn } from "@/lib/utils";
import { formatCurrency, formatInteger } from "@/lib/format";
import { usosCupom } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import { CupomDialog } from "@/features/cupons/CupomDialog";
import {
  STATUS_CUPOM,
  beneficio,
  copiarCodigo,
  statusCupom,
  validade,
  type StatusCupom,
} from "@/features/cupons/cupomUtils";

interface Linha {
  cupom: Cupom;
  usos: number;
  status: StatusCupom;
}

const ORDEM_STATUS: StatusCupom[] = ["ativo", "agendado", "esgotado", "expirado", "desativado"];

const iconBtn =
  "flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40";

export default function CuponsPage() {
  const cupons = useAppStore((s) => s.cupons);
  const pedidos = useAppStore((s) => s.pedidos);
  const salvar = useAppStore((s) => s.salvar);
  const remover = useAppStore((s) => s.remover);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Cupom | null>(null);
  const [excluir, setExcluir] = useState<Cupom | null>(null);

  const linhas: Linha[] = useMemo(() => {
    const agora = new Date();
    return cupons
      .map((cupom) => {
        const usos = usosCupom(cupom.codigo, pedidos);
        return { cupom, usos, status: statusCupom(cupom, usos, agora) };
      })
      .sort(
        (a, b) =>
          ORDEM_STATUS.indexOf(a.status) - ORDEM_STATUS.indexOf(b.status) ||
          b.cupom.criado_em.getTime() - a.cupom.criado_em.getTime(),
      );
  }, [cupons, pedidos]);

  const stats = useMemo(() => {
    const desde = subDays(new Date(), 30);
    const comCupom = pedidos.filter((p) => p.cupom_codigo && p.status !== "cancelado" && p.criado_em >= desde);
    return {
      ativos: linhas.filter((l) => l.status === "ativo").length,
      usos: comCupom.length,
      desconto: comCupom.reduce((s, p) => s + p.desconto, 0),
      faturamento: comCupom.reduce((s, p) => s + p.total, 0),
    };
  }, [pedidos, linhas]);

  const abrirNovo = () => {
    setEditando(null);
    setDialogAberto(true);
  };
  const abrirEdicao = (c: Cupom) => {
    setEditando(c);
    setDialogAberto(true);
  };

  const alternar = (c: Cupom) => {
    salvar("cupons", { ...c, ativo: !c.ativo });
    registrarAtividade(`${c.ativo ? "Desativou" : "Ativou"} o cupom ${c.codigo}`);
    toast.success(c.ativo ? `Cupom ${c.codigo} desativado` : `Cupom ${c.codigo} ativado`);
  };

  const copiar = (codigo: string) =>
    copiarCodigo(codigo).then(
      () => toast.success(`Código ${codigo} copiado`),
      () => toast.error("Não foi possível copiar o código"),
    );

  /* ---------------- Peças reutilizadas (tabela e cards) ---------------- */

  const codigo = (c: Cupom) => (
    <span className="inline-flex items-center gap-1">
      <span className="rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-[12px] font-bold tracking-wide">
        {c.codigo}
      </span>
      <button type="button" className={cn(iconBtn, "size-7")} onClick={() => copiar(c.codigo)} aria-label={`Copiar código ${c.codigo}`} title="Copiar código">
        <Copy className="size-3.5" />
      </button>
    </span>
  );

  const usos = (l: Linha) => {
    const limite = l.cupom.limite_usos;
    const pct = limite ? Math.min(100, (l.usos / limite) * 100) : 0;
    return (
      <div className="flex min-w-[90px] flex-col items-start gap-1">
        <span className="tabular-nums">
          {formatInteger(l.usos)}
          <span className="text-ink-muted"> / {limite === null ? "∞" : formatInteger(limite)}</span>
        </span>
        {limite !== null && (
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100" aria-hidden>
            <span
              className={cn("block h-full rounded-full", pct >= 100 ? "bg-accent" : "bg-chart-primary")}
              style={{ width: `${pct}%` }}
            />
          </span>
        )}
      </div>
    );
  };

  const acoes = (c: Cupom) => (
    <div className="flex items-center justify-end">
      <button type="button" className={iconBtn} onClick={() => abrirEdicao(c)} aria-label={`Editar cupom ${c.codigo}`} title="Editar">
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        className={cn(iconBtn, "hover:bg-negative-soft hover:text-negative")}
        onClick={() => setExcluir(c)}
        aria-label={`Excluir cupom ${c.codigo}`}
        title="Excluir"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );

  const columns: Column<Linha>[] = [
    {
      key: "codigo",
      header: "Cupom",
      sortValue: (l) => l.cupom.codigo,
      render: (l) => (
        <div className="flex max-w-[280px] flex-col gap-1 whitespace-normal">
          {codigo(l.cupom)}
          <span className="line-clamp-2 text-[12px] text-ink-muted">{l.cupom.descricao}</span>
        </div>
      ),
    },
    {
      key: "beneficio",
      header: "Benefício",
      render: (l) => (
        <div className="flex flex-col">
          <span className="font-semibold">{beneficio(l.cupom.tipo, l.cupom.valor)}</span>
          <span className="text-[12px] text-ink-muted">
            {l.cupom.pedido_minimo > 0 ? `mín. ${formatCurrency(l.cupom.pedido_minimo)}` : "sem mínimo"}
            {l.cupom.primeira_compra && " · 1ª compra"}
          </span>
        </div>
      ),
    },
    { key: "validade", header: "Validade", sortValue: (l) => l.cupom.fim?.getTime() ?? Number.MAX_SAFE_INTEGER, render: (l) => validade(l.cupom) },
    {
      key: "status",
      header: "Status",
      sortValue: (l) => ORDEM_STATUS.indexOf(l.status),
      render: (l) => <Badge tom={STATUS_CUPOM[l.status].tom}>{STATUS_CUPOM[l.status].label}</Badge>,
    },
    { key: "usos", header: "Usos", sortValue: (l) => l.usos, render: (l) => usos(l) },
    {
      key: "ativo",
      header: "Ativo",
      align: "center",
      render: (l) => (
        <span className="relative inline-flex">
          <Switch checked={l.cupom.ativo} onCheckedChange={() => alternar(l.cupom)} aria-label={`Cupom ${l.cupom.codigo} ativo`} />
        </span>
      ),
    },
    { key: "acoes", header: (
        <span className="relative">
          <span className="sr-only">Ações</span>
        </span>
      ), align: "right", render: (l) => acoes(l.cupom) },
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cupons ativos" value={formatInteger(stats.ativos)} icon={TicketPercent} tom="green" />
        <StatCard label="Usos (30 dias)" value={formatInteger(stats.usos)} icon={Users} tom="blue" />
        <StatCard label="Desconto concedido (30 dias)" value={formatCurrency(stats.desconto)} icon={CircleDollarSign} tom="orange" />
        <StatCard label="Faturamento com cupom (30 dias)" value={formatCurrency(stats.faturamento)} icon={Receipt} tom="blue" />
      </div>

      <section className="card p-4 sm:p-5">
        <CardHeader
          title="Cupons"
          subtitle="Códigos de desconto que o cliente usa no cardápio digital ou no PDV."
          actions={
            <Button onClick={abrirNovo}>
              <Plus /> Novo cupom
            </Button>
          }
        />

        {linhas.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            message="Nenhum cupom cadastrado"
            action={
              <Button variant="outline" size="sm" onClick={abrirNovo}>
                <Plus /> Criar o primeiro cupom
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: tabela */}
            <div className="hidden md:block">
              <DataTable columns={columns} rows={linhas} rowKey={(l) => l.cupom.id} />
            </div>

            {/* Celular: cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {linhas.map((l) => (
                <li key={l.cupom.id} className="rounded-md border border-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    {codigo(l.cupom)}
                    <Badge tom={STATUS_CUPOM[l.status].tom}>{STATUS_CUPOM[l.status].label}</Badge>
                  </div>
                  <p className="mt-1.5 text-[12px] text-ink-muted">{l.cupom.descricao}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <p className="text-ink-muted">Benefício</p>
                      <p className="font-semibold">{beneficio(l.cupom.tipo, l.cupom.valor)}</p>
                      <p className="text-ink-muted">
                        {l.cupom.pedido_minimo > 0 ? `mín. ${formatCurrency(l.cupom.pedido_minimo)}` : "sem mínimo"}
                      </p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Usos</p>
                      {usos(l)}
                    </div>
                    <div className="col-span-2">
                      <p className="text-ink-muted">Validade</p>
                      <p>{validade(l.cupom)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
                    <label className="flex items-center gap-2 text-[12px] font-semibold">
                      <Switch checked={l.cupom.ativo} onCheckedChange={() => alternar(l.cupom)} aria-label={`Cupom ${l.cupom.codigo} ativo`} />
                      Ativo
                    </label>
                    {acoes(l.cupom)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <CupomDialog open={dialogAberto} onOpenChange={setDialogAberto} cupom={editando} cupons={cupons} />

      <ConfirmDialog
        open={!!excluir}
        onOpenChange={(o) => !o && setExcluir(null)}
        title={`Excluir o cupom ${excluir?.codigo ?? ""}?`}
        description="O código deixa de funcionar. Pedidos que já usaram o cupom continuam registrados com o desconto."
        confirmLabel="Excluir cupom"
        destructive
        onConfirm={() => {
          if (!excluir) return;
          remover("cupons", excluir.id);
          registrarAtividade(`Excluiu o cupom ${excluir.codigo}`);
          toast.success("Cupom excluído");
        }}
      />
    </div>
  );
}
