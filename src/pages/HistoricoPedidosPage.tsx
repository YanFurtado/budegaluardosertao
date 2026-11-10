import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Ban, Download, Receipt, ShoppingBag, Wallet } from "lucide-react";
import type { Pedido, StatusPedido, TipoPedido } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPedidoBadge } from "@/components/shared/StatusPedidoBadge";
import { CardHeader } from "@/components/shared/CardHeader";
import { useAppStore } from "@/store/useAppStore";
import { DATE_PRESETS, inRange, type DateRange } from "@/lib/dateRange";
import { formatCurrency, formatDateTime, formatInteger } from "@/lib/format";
import { STATUS_PEDIDO } from "@/lib/pedidos";
import { FORMAS_PAGAMENTO, labelTipoPedido, TIPOS_PEDIDO } from "@/data/catalogo";
import { OrderDetailsSheet } from "@/features/orders/OrderDetailsSheet";
import { useOrderActions } from "@/features/orders/useOrderActions";
import { exportarPedidosCsv } from "@/features/orders/exportarCsv";
import { buscaPedido, TOM_TIPO } from "@/features/orders/utils";

const columns: Column<Pedido>[] = [
  { key: "numero", header: "Nº", sortValue: (p) => p.numero, render: (p) => <span className="font-semibold">#{p.numero}</span> },
  { key: "data", header: "Data/hora", sortValue: (p) => p.criado_em.getTime(), render: (p) => formatDateTime(p.criado_em) },
  {
    key: "cliente",
    header: "Cliente",
    sortValue: (p) => p.cliente_nome,
    render: (p) => <span className="block max-w-[220px] truncate">{p.cliente_nome}</span>,
  },
  {
    key: "tipo",
    header: "Tipo",
    sortValue: (p) => labelTipoPedido(p.tipo_pedido),
    render: (p) => <Badge tom={TOM_TIPO[p.tipo_pedido]}>{labelTipoPedido(p.tipo_pedido)}</Badge>,
  },
  { key: "pagamento", header: "Pagamento", sortValue: (p) => p.forma_pagamento, render: (p) => p.forma_pagamento },
  {
    key: "status",
    header: "Status",
    sortValue: (p) => STATUS_PEDIDO[p.status].label,
    render: (p) => <StatusPedidoBadge status={p.status} />,
  },
  {
    key: "total",
    header: "Total",
    align: "right",
    sortValue: (p) => p.total,
    render: (p) => (
      <span className={p.status === "cancelado" ? "text-ink-muted line-through" : "font-semibold"}>{formatCurrency(p.total)}</span>
    ),
  },
];

export default function HistoricoPedidosPage() {
  const pedidos = useAppStore((s) => s.pedidos);
  const formasConfig = useAppStore((s) => s.config.formas_pagamento);
  const { avancar, cancelar, dialogs } = useOrderActions();

  const [range, setRange] = useState<DateRange>(() => DATE_PRESETS.find((p) => p.key === "7d")!.get(new Date()));
  const [status, setStatus] = useState<"todos" | StatusPedido>("todos");
  const [tipo, setTipo] = useState<"todos" | TipoPedido>("todos");
  const [forma, setForma] = useState("todas");
  const [busca, setBusca] = useState("");
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const formas = useMemo(() => [...new Set([...FORMAS_PAGAMENTO, ...formasConfig])], [formasConfig]);

  const filtrados = useMemo(
    () =>
      pedidos.filter(
        (p) =>
          inRange(p.criado_em, range) &&
          (status === "todos" || p.status === status) &&
          (tipo === "todos" || p.tipo_pedido === tipo) &&
          (forma === "todas" || p.forma_pagamento === forma) &&
          buscaPedido(p, busca),
      ),
    [pedidos, range, status, tipo, forma, busca],
  );

  const validos = filtrados.filter((p) => p.status !== "cancelado");
  const faturamento = validos.reduce((s, p) => s + p.total, 0);
  const cancelados = filtrados.length - validos.length;

  const exportar = () => {
    if (!filtrados.length) {
      toast.info("Nenhum pedido para exportar");
      return;
    }
    const ordenados = [...filtrados].sort((a, b) => a.criado_em.getTime() - b.criado_em.getTime());
    exportarPedidosCsv(
      ordenados,
      `pedidos_${format(range.start, "yyyy-MM-dd")}_a_${format(range.end, "yyyy-MM-dd")}.csv`,
    );
    toast.success(`${formatInteger(ordenados.length)} pedidos exportados`);
  };

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      {/* Filtros */}
      <section className="card flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <DateRangePicker value={range} onChange={setRange} />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {(Object.keys(STATUS_PEDIDO) as StatusPedido[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_PEDIDO[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS_PEDIDO.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={forma} onValueChange={setForma}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Forma de pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as formas</SelectItem>
            {formas.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SearchInput value={busca} onChange={setBusca} placeholder="Nº, cliente ou telefone" className="w-full sm:w-64" />
      </section>

      {/* Números */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos" value={formatInteger(filtrados.length)} icon={ShoppingBag} tom="blue" />
        <StatCard label="Faturamento" value={formatCurrency(faturamento)} hint="Sem os cancelados" icon={Wallet} tom="green" />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(validos.length ? faturamento / validos.length : 0)}
          icon={Receipt}
          tom="orange"
        />
        <StatCard label="Cancelados" value={formatInteger(cancelados)} icon={Ban} tom="red" />
      </div>

      {/* Tabela */}
      <section className="card p-4 sm:p-5">
        <CardHeader
          title="Pedidos"
          subtitle="Clique em um pedido para ver os detalhes"
          actions={
            <Button variant="outline" onClick={exportar}>
              <Download /> Exportar CSV
            </Button>
          }
        />
        <DataTable
          columns={columns}
          rows={filtrados}
          rowKey={(p) => p.id}
          defaultSort={{ key: "data", dir: "desc" }}
          pageSize={20}
          onRowClick={(p) => setDetalheId(p.id)}
          emptyMessage="Nenhum pedido com esses filtros"
        />
      </section>

      <OrderDetailsSheet pedidoId={detalheId} onClose={() => setDetalheId(null)} onAdvance={avancar} onCancel={cancelar} />
      {dialogs}
    </div>
  );
}
