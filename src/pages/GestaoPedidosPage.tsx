import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { startOfDay } from "date-fns";
import { CirclePause, ClipboardPlus, Inbox } from "lucide-react";
import type { Pedido, StatusPedido, TipoPedido } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatInteger } from "@/lib/format";
import { STATUS_ATIVOS, STATUS_PEDIDO } from "@/lib/pedidos";
import { TIPOS_PEDIDO } from "@/data/catalogo";
import { cn } from "@/lib/utils";
import { OrderCard } from "@/features/orders/OrderCard";
import { OrderDetailsSheet } from "@/features/orders/OrderDetailsSheet";
import { NewOrderDialog } from "@/features/orders/NewOrderDialog";
import { useOrderActions } from "@/features/orders/useOrderActions";
import { buscaPedido, COR_STATUS, useAgora, useMediaQuery } from "@/features/orders/utils";

export default function GestaoPedidosPage() {
  const pedidos = useAppStore((s) => s.pedidos);
  const pausada = useAppStore((s) => s.loja.pausada);
  const alerta = useAppStore((s) => s.config.alerta_atraso_min);
  const agora = useAgora();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { avancar, cancelar, dialogs } = useOrderActions();

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | TipoPedido>("todos");
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [aba, setAba] = useState<StatusPedido>("pendente");

  // Atalho da topbar: /gestao-pedidos?novo=1
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get("novo")) {
      setNovoAberto(true);
      const p = new URLSearchParams(params);
      p.delete("novo");
      setParams(p, { replace: true });
    }
  }, [params, setParams]);

  const colunas = useMemo(() => {
    const ativos = pedidos
      .filter((p) => STATUS_ATIVOS.includes(p.status))
      .filter((p) => (tipo === "todos" || p.tipo_pedido === tipo) && buscaPedido(p, busca))
      .sort((a, b) => a.criado_em.getTime() - b.criado_em.getTime());
    return STATUS_ATIVOS.map((status) => ({ status, pedidos: ativos.filter((p) => p.status === status) }));
  }, [pedidos, tipo, busca]);

  // Celular: abre na primeira coluna com pedidos até o usuário escolher uma aba.
  const [abaManual, setAbaManual] = useState(false);
  useEffect(() => {
    if (abaManual) return;
    const atual = colunas.find((c) => c.status === aba);
    if (atual && atual.pedidos.length > 0) return;
    const primeira = colunas.find((c) => c.pedidos.length > 0);
    if (primeira) setAba(primeira.status);
  }, [colunas, aba, abaManual]);

  const hoje = startOfDay(agora);
  const concluidosHoje = pedidos.filter((p) => p.status === "concluido" && p.fechado_em && p.fechado_em >= hoje);
  const totalHoje = concluidosHoje.reduce((s, p) => s + p.total, 0);
  const totalAtivos = colunas.reduce((s, c) => s + c.pedidos.length, 0);

  const cardProps = {
    agora,
    alertaAtrasoMin: alerta,
    onOpen: (p: Pedido) => setDetalheId(p.id),
    onAdvance: avancar,
    onReject: cancelar,
  };

  const lista = (itens: Pedido[]) =>
    itens.length === 0 ? (
      <p className="rounded-md border border-dashed border-line px-3 py-8 text-center text-[12px] text-ink-muted">Nenhum pedido</p>
    ) : (
      <div className="flex flex-col gap-3">
        {itens.map((p) => (
          <OrderCard key={p.id} pedido={p} {...cardProps} />
        ))}
      </div>
    );

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      {pausada && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-accent/50 bg-accent/10 px-4 py-3">
          <CirclePause className="size-4 text-[#B86A1F]" />
          <span className="flex-1">
            <strong>Sua loja está pausada</strong> e não recebe pedidos pelo cardápio digital.
          </span>
          <Link to="/minha-empresa" className="font-semibold text-primary hover:underline">
            Reabrir em Minha empresa
          </Link>
        </div>
      )}

      {/* Barra de ferramentas */}
      <section className="card flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <SearchInput
          value={busca}
          onChange={setBusca}
          placeholder="Buscar por nº, cliente ou telefone"
          className="w-full sm:w-72"
        />
        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por tipo">
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

        <Link
          to="/historico-pedidos"
          className="text-ink-muted hover:text-primary sm:ml-2"
          title="Ver no histórico de pedidos"
        >
          Concluídos hoje:{" "}
          <strong className="tabular-nums text-ink">
            {formatInteger(concluidosHoje.length)} · {formatCurrency(totalHoje)}
          </strong>
        </Link>

        <Button className="w-full sm:ml-auto sm:w-auto" onClick={() => setNovoAberto(true)}>
          <ClipboardPlus /> Novo pedido
        </Button>
      </section>

      {/* Quadro */}
      {totalAtivos === 0 && !busca && tipo === "todos" ? (
        <section className="card flex flex-col items-center gap-2 px-6 py-14 text-center text-ink-muted">
          <Inbox className="size-8 text-gray-300" />
          <p className="font-semibold text-ink">Nenhum pedido em andamento</p>
          <p>Os pedidos novos aparecem aqui assim que chegam.</p>
        </section>
      ) : desktop ? (
        <div className="grid grid-cols-4 items-start gap-4">
          {colunas.map((c) => (
            <section key={c.status} className="rounded-card border border-line bg-gray-50/70 p-3" aria-label={STATUS_PEDIDO[c.status].label}>
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("size-2.5 rounded-full", COR_STATUS[c.status])} aria-hidden />
                <h2 className="font-semibold">{STATUS_PEDIDO[c.status].label}</h2>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[12px] font-bold tabular-nums text-ink-muted ring-1 ring-line">
                  {c.pedidos.length}
                </span>
              </header>
              {lista(c.pedidos)}
            </section>
          ))}
        </div>
      ) : (
        <Tabs
          value={aba}
          onValueChange={(v) => {
            setAba(v as StatusPedido);
            setAbaManual(true);
          }}
          className="card p-3"
        >
          <TabsList>
            {colunas.map((c) => (
              <TabsTrigger key={c.status} value={c.status}>
                <span className={cn("size-2 rounded-full", COR_STATUS[c.status])} aria-hidden />
                {STATUS_PEDIDO[c.status].label}
                <span className="tabular-nums text-ink-muted">({c.pedidos.length})</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {colunas.map((c) => (
            <TabsContent key={c.status} value={c.status}>
              {lista(c.pedidos)}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <OrderDetailsSheet pedidoId={detalheId} onClose={() => setDetalheId(null)} onAdvance={avancar} onCancel={cancelar} />
      <NewOrderDialog open={novoAberto} onOpenChange={setNovoAberto} />
      {dialogs}
    </div>
  );
}
