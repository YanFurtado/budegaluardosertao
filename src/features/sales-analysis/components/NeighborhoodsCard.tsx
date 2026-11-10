import { formatCurrency, formatInteger } from "@/lib/format";
import type { NeighborhoodRow } from "../aggregate";
import { CardHeader } from "@/components/shared/CardHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";

const columns: Column<NeighborhoodRow>[] = [
  { key: "bairro", header: "Bairro", render: (r) => r.bairro },
  { key: "faturamento", header: "Faturamento", align: "right", sortValue: (r) => r.faturamento, render: (r) => formatCurrency(r.faturamento) },
  { key: "pedidos", header: "Pedidos", align: "right", render: (r) => formatInteger(r.pedidos) },
  { key: "ticket", header: "Ticket médio", align: "right", render: (r) => formatCurrency(r.ticket) },
  { key: "totalTaxas", header: "Total em taxas", align: "right", render: (r) => formatCurrency(r.totalTaxas) },
  { key: "taxaMedia", header: "Taxa média", align: "right", render: (r) => formatCurrency(r.taxaMedia) },
];

export function NeighborhoodsCard({ loading, rows }: { loading: boolean; rows: NeighborhoodRow[] }) {
  return (
    <section className="card p-4 sm:p-5">
      <CardHeader title="Pedidos por bairro (Delivery)" subtitle="O valor do faturamento inclui todas as taxas e descontos" />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.bairro}
        loading={loading}
        defaultSort={{ key: "faturamento", dir: "desc" }}
      />
    </section>
  );
}
