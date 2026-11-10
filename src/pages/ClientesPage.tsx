import { useMemo, useState } from "react";
import { formatDistanceToNow, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Receipt, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader } from "@/components/shared/CardHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency, formatInteger } from "@/lib/format";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import type { Cliente } from "@/types";
import { statsPorCliente, STATS_VAZIO, type ClienteStats } from "@/features/clientes/stats";
import { ClienteFormDialog } from "@/features/clientes/ClienteFormDialog";
import { ClienteSheet } from "@/features/clientes/ClienteSheet";

const TODOS = "__todos__";
const SEM_BAIRRO = "__sem__";

type Linha = { cliente: Cliente; stats: ClienteStats };

export default function ClientesPage() {
  const clientes = useAppStore((s) => s.clientes);
  const pedidos = useAppStore((s) => s.pedidos);
  const zonas = useAppStore((s) => s.zonas);

  const [busca, setBusca] = useState("");
  const [bairro, setBairro] = useState(TODOS);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; cliente: Cliente | null }>({ open: false, cliente: null });

  const statsMap = useMemo(() => statsPorCliente(pedidos), [pedidos]);
  const linhasTodas = useMemo<Linha[]>(
    () => clientes.map((cliente) => ({ cliente, stats: statsMap.get(cliente.id) ?? STATS_VAZIO })),
    [clientes, statsMap],
  );

  const resumo = useMemo(() => {
    const desde = subDays(new Date(), 30);
    let pedidosTotal = 0;
    let gasto = 0;
    for (const l of linhasTodas) {
      pedidosTotal += l.stats.pedidos;
      gasto += l.stats.total;
    }
    return {
      total: clientes.length,
      novos: clientes.filter((c) => c.criado_em >= desde).length,
      ativos: linhasTodas.filter((l) => l.stats.ultimoPedido && l.stats.ultimoPedido >= desde).length,
      ticket: pedidosTotal ? round2(gasto / pedidosTotal) : 0,
    };
  }, [clientes, linhasTodas]);

  // Bairros dos filtros: zonas de entrega + bairros digitados nos cadastros
  const bairros = useMemo(() => {
    const set = new Set(zonas.map((z) => z.bairro));
    for (const c of clientes) if (c.bairro) set.add(c.bairro);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [zonas, clientes]);

  const linhas = useMemo(() => {
    const digitos = busca.replace(/\D/g, "");
    return linhasTodas.filter(
      ({ cliente: c }) =>
        (contem(c.nome, busca) ||
          contem(c.telefone, busca) ||
          contem(c.email, busca) ||
          (digitos.length >= 3 && c.telefone.replace(/\D/g, "").includes(digitos))) &&
        (bairro === TODOS || (bairro === SEM_BAIRRO ? !c.bairro : c.bairro === bairro)),
    );
  }, [linhasTodas, busca, bairro]);

  const colunas: Column<Linha>[] = [
    {
      key: "nome",
      header: "Nome",
      sortValue: (r) => r.cliente.nome,
      render: (r) => (
        <span className="flex flex-col">
          <span className="font-semibold">{r.cliente.nome}</span>
          {r.cliente.email && <span className="text-[12px] text-ink-muted">{r.cliente.email}</span>}
        </span>
      ),
    },
    { key: "telefone", header: "Telefone", render: (r) => r.cliente.telefone },
    { key: "bairro", header: "Bairro", sortValue: (r) => r.cliente.bairro ?? "", render: (r) => r.cliente.bairro ?? <span className="text-ink-muted">—</span> },
    { key: "pedidos", header: "Pedidos", align: "right", sortValue: (r) => r.stats.pedidos, render: (r) => formatInteger(r.stats.pedidos) },
    { key: "total", header: "Total gasto", align: "right", sortValue: (r) => r.stats.total, render: (r) => formatCurrency(r.stats.total) },
    { key: "ticket", header: "Ticket médio", align: "right", sortValue: (r) => r.stats.ticket, render: (r) => formatCurrency(r.stats.ticket) },
    {
      key: "ultimo",
      header: "Último pedido",
      sortValue: (r) => r.stats.ultimoPedido?.getTime() ?? 0,
      render: (r) =>
        r.stats.ultimoPedido ? (
          <span title={r.stats.ultimoPedido.toLocaleString("pt-BR")}>
            {formatDistanceToNow(r.stats.ultimoPedido, { addSuffix: true, locale: ptBR })}
          </span>
        ) : (
          <span className="text-ink-muted">Nunca</span>
        ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de clientes" value={formatInteger(resumo.total)} icon={Users} tom="blue" />
        <StatCard label="Novos (30 dias)" value={formatInteger(resumo.novos)} icon={UserPlus} tom="green" />
        <StatCard label="Ativos (pediram em 30 dias)" value={formatInteger(resumo.ativos)} icon={Activity} tom="orange" />
        <StatCard label="Ticket médio por pedido" value={formatCurrency(resumo.ticket)} icon={Receipt} tom="gray" />
      </div>

      <section className="card p-4 sm:p-5">
        <CardHeader
          title="Clientes"
          subtitle="Clique em um cliente para ver pedidos, avaliações e fiado. Pedidos cancelados não entram nas estatísticas."
          actions={
            <Button onClick={() => setForm({ open: true, cliente: null })}>
              <UserPlus /> Novo cliente
            </Button>
          }
        />
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome, telefone ou e-mail" className="sm:max-w-sm sm:flex-1" />
          <Select value={bairro} onValueChange={setBairro}>
            <SelectTrigger className="sm:w-[220px]" aria-label="Filtrar por bairro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os bairros</SelectItem>
              {bairros.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
              <SelectItem value={SEM_BAIRRO}>Sem bairro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          columns={colunas}
          rows={linhas}
          rowKey={(r) => r.cliente.id}
          defaultSort={{ key: "total", dir: "desc" }}
          pageSize={20}
          onRowClick={(r) => setSelecionado(r.cliente.id)}
          emptyMessage={clientes.length ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
        />
      </section>

      <ClienteSheet
        clienteId={selecionado}
        onClose={() => setSelecionado(null)}
        onEditar={(c) => setForm({ open: true, cliente: c })}
      />
      <ClienteFormDialog
        open={form.open}
        cliente={form.cliente}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        onSaved={(c) => {
          if (!form.cliente) setSelecionado(c.id);
        }}
      />
    </div>
  );
}
