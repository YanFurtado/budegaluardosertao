import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, Banknote, Lock, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/shared/CardHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency, formatInteger } from "@/lib/format";
import { nomeFuncionario, useAppStore, useCaixaAberto } from "@/store/useAppStore";
import type { MovimentoCaixa, SessaoCaixa } from "@/types";
import { duracao, resumoSessao, type ResumoSessao } from "@/features/caixa/resumo";
import { Diferenca } from "@/features/caixa/Diferenca";
import { VendasPorForma } from "@/features/caixa/VendasPorForma";
import { AbrirCaixaDialog } from "@/features/caixa/AbrirCaixaDialog";
import { MovimentoDialog } from "@/features/caixa/MovimentoDialog";
import { FecharCaixaDialog } from "@/features/caixa/FecharCaixaDialog";
import { SessaoDetalheSheet } from "@/features/caixa/SessaoDetalheSheet";

/** Atualiza a cada 30 s para a duração e as vendas do turno acompanharem o relógio. */
function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

type LinhaHistorico = { sessao: SessaoCaixa; resumo: ResumoSessao };

export default function CaixaPage() {
  const agora = useAgora();
  const aberto = useCaixaAberto();
  const sessoes = useAppStore((s) => s.sessoesCaixa);
  const pedidos = useAppStore((s) => s.pedidos);
  const funcionarios = useAppStore((s) => s.funcionarios);

  const [abrirOpen, setAbrirOpen] = useState(false);
  const [fecharOpen, setFecharOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<MovimentoCaixa["tipo"]>("sangria");
  const [movOpen, setMovOpen] = useState(false);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const resumo = useMemo(() => (aberto ? resumoSessao(aberto, pedidos, agora) : null), [aberto, pedidos, agora]);

  const historico = useMemo<LinhaHistorico[]>(
    () =>
      sessoes
        .filter((s) => s.fechado_em)
        .map((sessao) => ({ sessao, resumo: resumoSessao(sessao, pedidos) }))
        .sort((a, b) => b.sessao.aberto_em.getTime() - a.sessao.aberto_em.getTime()),
    [sessoes, pedidos],
  );
  const ultimo = historico[0];

  const abrirMovimento = (tipo: MovimentoCaixa["tipo"]) => {
    setMovTipo(tipo);
    setMovOpen(true);
  };

  const colunas: Column<LinhaHistorico>[] = [
    {
      key: "data",
      header: "Data",
      sortValue: (r) => r.sessao.aberto_em.getTime(),
      render: (r) => format(r.sessao.aberto_em, "dd/MM/yyyy"),
    },
    { key: "operador", header: "Aberto por", render: (r) => nomeFuncionario(funcionarios, r.sessao.aberto_por) },
    {
      key: "horario",
      header: "Horário",
      render: (r) => `${format(r.sessao.aberto_em, "HH:mm")} – ${format(r.sessao.fechado_em!, "HH:mm")}`,
    },
    { key: "vendas", header: "Vendas", align: "right", sortValue: (r) => r.resumo.vendas, render: (r) => formatCurrency(r.resumo.vendas) },
    { key: "esperado", header: "Esperado", align: "right", render: (r) => formatCurrency(r.resumo.dinheiroEsperado) },
    {
      key: "contado",
      header: "Contado",
      align: "right",
      render: (r) => (r.resumo.contado === null ? "—" : formatCurrency(r.resumo.contado)),
    },
    {
      key: "diferenca",
      header: "Diferença",
      align: "right",
      sortValue: (r) => r.resumo.diferenca ?? 0,
      render: (r) => <Diferenca valor={r.resumo.diferenca} />,
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      {aberto && resumo ? (
        <>
          {/* Cabeçalho do turno */}
          <section className="card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-positive text-white" aria-hidden>
                <Wallet className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="card-title">Caixa aberto</span>
                  <Badge tom="green">Em andamento</Badge>
                </p>
                <p className="text-ink-muted">
                  Aberto por <strong className="text-ink">{nomeFuncionario(funcionarios, aberto.aberto_por)}</strong> às{" "}
                  {format(aberto.aberto_em, "HH:mm")}
                  {format(aberto.aberto_em, "yyyy-MM-dd") !== format(agora, "yyyy-MM-dd") && ` de ${format(aberto.aberto_em, "dd/MM")}`} · há{" "}
                  {duracao(aberto.aberto_em, agora)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => abrirMovimento("suprimento")}>
                <ArrowDownCircle className="text-positive" /> Suprimento
              </Button>
              <Button variant="outline" onClick={() => abrirMovimento("sangria")}>
                <ArrowUpCircle className="text-negative" /> Sangria
              </Button>
              <Button onClick={() => setFecharOpen(true)}>
                <Lock /> Fechar caixa
              </Button>
            </div>
          </section>

          {/* Números do turno */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Vendas do turno" value={formatCurrency(resumo.vendas)} icon={Receipt} tom="blue" />
            <StatCard label="Pedidos" value={formatInteger(resumo.qtdPedidos)} icon={ShoppingBag} tom="orange" />
            <StatCard
              label="Dinheiro esperado na gaveta"
              value={formatCurrency(resumo.dinheiroEsperado)}
              hint={`Inicial ${formatCurrency(aberto.valor_inicial)}`}
              icon={Banknote}
              tom="green"
            />
            <StatCard
              label="Sangrias"
              value={<span className={resumo.sangrias > 0 ? "text-negative" : undefined}>−{formatCurrency(resumo.sangrias)}</span>}
              hint={`Suprimentos: +${formatCurrency(resumo.suprimentos)}`}
              icon={Wallet}
              tom="gray"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <section className="card p-4 sm:p-5">
              <CardHeader title="Vendas por forma de pagamento" subtitle="Pedidos criados desde a abertura do caixa (sem cancelados)." />
              <VendasPorForma itens={resumo.porForma} />
            </section>

            <section className="card p-4 sm:p-5">
              <CardHeader title="Dinheiro na gaveta" />
              <dl className="flex flex-col gap-1.5">
                <LinhaGaveta rotulo="Valor inicial" valor={formatCurrency(aberto.valor_inicial)} />
                <LinhaGaveta rotulo="Vendas em dinheiro" valor={`+${formatCurrency(resumo.vendasDinheiro)}`} />
                <LinhaGaveta rotulo="Suprimentos" valor={`+${formatCurrency(resumo.suprimentos)}`} />
                <LinhaGaveta rotulo="Sangrias" valor={`−${formatCurrency(resumo.sangrias)}`} />
                <div className="mt-1 flex justify-between gap-3 border-t border-line pt-2 text-[15px] font-bold">
                  <dt>Esperado</dt>
                  <dd className="tabular-nums">{formatCurrency(resumo.dinheiroEsperado)}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Movimentações */}
          <section className="card p-4 sm:p-5">
            <CardHeader title="Movimentações do turno" subtitle="Sangrias (retiradas) e suprimentos (entradas) de dinheiro." />
            {aberto.movimentos.length === 0 ? (
              <EmptyState message="Nenhuma movimentação neste turno" icon={Wallet} />
            ) : (
              <ul className="flex flex-col divide-y divide-line rounded-md border border-line">
                {[...aberto.movimentos].reverse().map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge tom={m.tipo === "sangria" ? "red" : "green"}>{m.tipo === "sangria" ? "Sangria" : "Suprimento"}</Badge>
                      <span className="truncate">{m.motivo}</span>
                    </span>
                    <span className="flex items-center gap-3 text-ink-muted">
                      <span className="text-[12px]">
                        {format(m.em, "HH:mm")} · {nomeFuncionario(funcionarios, m.funcionario_id)}
                      </span>
                      <span className={m.tipo === "sangria" ? "font-semibold tabular-nums text-negative" : "font-semibold tabular-nums text-[#1F8A4C]"}>
                        {m.tipo === "sangria" ? "−" : "+"}
                        {formatCurrency(m.valor)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <MovimentoDialog open={movOpen} tipo={movTipo} onOpenChange={setMovOpen} dinheiroEsperado={resumo.dinheiroEsperado} />
          <FecharCaixaDialog
            open={fecharOpen}
            onOpenChange={setFecharOpen}
            sessao={aberto}
            resumo={resumo}
            onFechado={(id) => setDetalheId(id)}
          />
        </>
      ) : (
        <section className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-ink-muted" aria-hidden>
            <Lock className="size-6" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold">Caixa fechado</h2>
            <p className="mx-auto max-w-md text-ink-muted">
              Abra o caixa para acompanhar as vendas do turno, registrar sangrias e suprimentos e fazer a conferência no fechamento.
            </p>
          </div>
          <Button onClick={() => setAbrirOpen(true)}>
            <Wallet /> Abrir caixa
          </Button>
          {ultimo && (
            <button
              type="button"
              onClick={() => setDetalheId(ultimo.sessao.id)}
              className="mt-2 rounded-md bg-gray-50 px-4 py-2.5 text-[12px] text-ink-muted hover:bg-gray-100"
            >
              Último fechamento: <strong className="text-ink">{format(ultimo.sessao.fechado_em!, "dd/MM 'às' HH:mm")}</strong> por{" "}
              {nomeFuncionario(funcionarios, ultimo.sessao.fechado_por)} · Vendas {formatCurrency(ultimo.resumo.vendas)} · Diferença{" "}
              <Diferenca valor={ultimo.resumo.diferenca} />
            </button>
          )}
        </section>
      )}

      {/* Histórico */}
      <section className="card p-4 sm:p-5">
        <CardHeader title="Histórico de caixas" subtitle="Turnos fechados. Clique em uma linha para ver o relatório." />
        <DataTable
          columns={colunas}
          rows={historico}
          rowKey={(r) => r.sessao.id}
          defaultSort={{ key: "data", dir: "desc" }}
          pageSize={10}
          onRowClick={(r) => setDetalheId(r.sessao.id)}
          emptyMessage="Nenhum caixa fechado ainda"
        />
      </section>

      <AbrirCaixaDialog open={abrirOpen} onOpenChange={setAbrirOpen} />
      <SessaoDetalheSheet sessaoId={detalheId} onClose={() => setDetalheId(null)} />
    </div>
  );
}

function LinhaGaveta({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{rotulo}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}
