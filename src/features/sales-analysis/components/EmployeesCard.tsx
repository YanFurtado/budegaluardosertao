import { formatCurrency, formatInteger } from "@/lib/format";
import type { EmployeeRow } from "../aggregate";
import { CardHeader } from "@/components/shared/CardHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";

const columns: Column<EmployeeRow>[] = [
  { key: "nome", header: "Funcionário", render: (r) => r.nome },
  { key: "faturamento", header: "Faturamento", align: "right", sortValue: (r) => r.faturamento, render: (r) => formatCurrency(r.faturamento) },
  { key: "pedidos", header: "Pedidos", align: "right", render: (r) => formatInteger(r.pedidos) },
];

export function EmployeesCard({ loading, rows }: { loading: boolean; rows: EmployeeRow[] }) {
  return (
    <section className="card p-4 sm:p-5">
      <CardHeader
        title="Pedidos por funcionário (Delivery/Retirada/No local)"
        subtitle="O valor do faturamento inclui todas as taxas e descontos. O pedido é atribuído ao funcionário que fez ou aceitou ele."
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        skeletonRows={3}
        defaultSort={{ key: "faturamento", dir: "desc" }}
      />
    </section>
  );
}
