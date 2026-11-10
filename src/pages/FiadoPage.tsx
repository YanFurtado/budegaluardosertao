import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, subDays } from "date-fns";
import { AlertTriangle, HandCoins, TrendingUp, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader } from "@/components/shared/CardHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency, formatInteger } from "@/lib/format";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import { contasFiado, type ContaFiado } from "@/features/fiado/contas";
import { UsoLimite } from "@/features/fiado/UsoLimite";
import { FiadoClienteSheet } from "@/features/fiado/FiadoClienteSheet";
import { LiberarFiadoDialog } from "@/features/fiado/LiberarFiadoDialog";

type Filtro = "todos" | "devendo" | "limite";

const data = (d: Date | null) => (d ? format(d, "dd/MM/yyyy") : "—");

export default function FiadoPage() {
  const clientes = useAppStore((s) => s.clientes);
  const fiado = useAppStore((s) => s.fiado);
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [liberarOpen, setLiberarOpen] = useState(false);
  const clienteAberto = params.get("cliente");

  const abrirCliente = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set("cliente", id);
    else p.delete("cliente");
    setParams(p, { replace: true });
  };

  const contas = useMemo(() => contasFiado(clientes, fiado), [clientes, fiado]);

  const stats = useMemo(() => {
    const devendo = contas.filter((c) => c.saldo > 0);
    const desde = subDays(new Date(), 30);
    const recebido = fiado.filter((l) => l.tipo === "pagamento" && l.em >= desde).reduce((s, l) => s + l.valor, 0);
    const maior = devendo.reduce<ContaFiado | null>((m, c) => (!m || c.saldo > m.saldo ? c : m), null);
    return {
      aReceber: round2(devendo.reduce((s, c) => s + c.saldo, 0)),
      devendo: devendo.length,
      recebido: round2(recebido),
      maior,
    };
  }, [contas, fiado]);

  const linhas = useMemo(
    () =>
      contas.filter(
        (c) =>
          (contem(c.cliente.nome, busca) || contem(c.cliente.telefone, busca)) &&
          (filtro === "todos" || (filtro === "devendo" ? c.saldo > 0 : (c.uso ?? 0) >= 0.9)),
      ),
    [contas, busca, filtro],
  );

  const colunas: Column<ContaFiado>[] = [
    {
      key: "cliente",
      header: "Cliente",
      sortValue: (r) => r.cliente.nome,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold">{r.cliente.nome}</span>
          {r.limite > 0 && r.saldo > r.limite && <Badge tom="red">Acima do limite</Badge>}
          {r.limite <= 0 && <Badge tom="gray">Fiado bloqueado</Badge>}
        </span>
      ),
    },
    { key: "telefone", header: "Telefone", render: (r) => r.cliente.telefone },
    { key: "limite", header: "Limite", align: "right", sortValue: (r) => r.limite, render: (r) => (r.limite > 0 ? formatCurrency(r.limite) : "—") },
    {
      key: "saldo",
      header: "Saldo devedor",
      align: "right",
      sortValue: (r) => r.saldo,
      render: (r) => (
        <span className={r.saldo > 0 ? "font-semibold text-negative" : r.saldo < 0 ? "font-semibold text-[#1F8A4C]" : "text-ink-muted"}>
          {formatCurrency(r.saldo)}
        </span>
      ),
    },
    { key: "uso", header: "Uso do limite", sortValue: (r) => r.uso ?? -1, render: (r) => <UsoLimite uso={r.uso} /> },
    { key: "compra", header: "Última compra", sortValue: (r) => r.ultimaCompra?.getTime() ?? 0, render: (r) => data(r.ultimaCompra) },
    {
      key: "pagamento",
      header: "Último pagamento",
      sortValue: (r) => r.ultimoPagamento?.getTime() ?? 0,
      render: (r) => data(r.ultimoPagamento),
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total a receber" value={formatCurrency(stats.aReceber)} icon={HandCoins} tom="red" />
        <StatCard label="Clientes devendo" value={formatInteger(stats.devendo)} icon={Users} tom="orange" />
        <StatCard label="Recebido nos últimos 30 dias" value={formatCurrency(stats.recebido)} icon={TrendingUp} tom="green" />
        <StatCard
          label="Maior saldo"
          value={stats.maior ? formatCurrency(stats.maior.saldo) : "—"}
          hint={stats.maior?.cliente.nome}
          icon={AlertTriangle}
          tom="gray"
        />
      </div>

      <section className="card p-4 sm:p-5">
        <CardHeader
          title="Contas de fiado"
          subtitle="Clientes com crédito liberado ou saldo em aberto. Clique em um cliente para ver o extrato."
          actions={
            <Button onClick={() => setLiberarOpen(true)}>
              <UserPlus /> Liberar fiado para cliente
            </Button>
          }
        />
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou telefone" className="sm:max-w-xs sm:flex-1" />
          <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <SelectTrigger className="sm:w-[240px]" aria-label="Filtrar contas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as contas</SelectItem>
              <SelectItem value="devendo">Com saldo devedor</SelectItem>
              <SelectItem value="limite">Acima de 90% do limite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          columns={colunas}
          rows={linhas}
          rowKey={(r) => r.cliente.id}
          defaultSort={{ key: "saldo", dir: "desc" }}
          pageSize={15}
          onRowClick={(r) => abrirCliente(r.cliente.id)}
          emptyMessage={contas.length ? "Nenhuma conta encontrada" : "Nenhum cliente com fiado liberado"}
        />
      </section>

      <FiadoClienteSheet clienteId={clienteAberto} onClose={() => abrirCliente(null)} />
      <LiberarFiadoDialog open={liberarOpen} onOpenChange={setLiberarOpen} onLiberado={(id) => abrirCliente(id)} />
    </div>
  );
}
