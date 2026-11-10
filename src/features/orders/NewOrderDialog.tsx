import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Bike, Minus, Plus, ShoppingBag, UserRound, UtensilsCrossed, X, type LucideIcon } from "lucide-react";
import type { Cliente, ItemPedido, TipoPedido } from "@/types";
import { Button } from "@/components/ui/button";
import { CurrencyInput, Field, Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { saldosFiado, useAppStore } from "@/store/useAppStore";
import { calcularTotaisPedido, precoVenda, type NovoPedidoInput } from "@/lib/pedidos";
import { formatCurrency } from "@/lib/format";
import { novoId } from "@/lib/id";
import { CANAIS_VENDA } from "@/data/catalogo";
import { cn } from "@/lib/utils";

const TIPOS: { value: TipoPedido; label: string; icon: LucideIcon }[] = [
  { value: "delivery", label: "Delivery", icon: Bike },
  { value: "retirada", label: "Retirada", icon: ShoppingBag },
  { value: "no_local", label: "No local", icon: UtensilsCrossed },
];

export function NewOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        {/* O formulário só existe com o diálogo aberto: cada abertura começa limpa. */}
        <NewOrderForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function NewOrderForm({ onDone }: { onDone: () => void }) {
  const clientes = useAppStore((s) => s.clientes);
  const produtos = useAppStore((s) => s.produtos);
  const categorias = useAppStore((s) => s.categorias);
  const zonas = useAppStore((s) => s.zonas);
  const configEntrega = useAppStore((s) => s.configEntrega);
  const cupons = useAppStore((s) => s.cupons);
  const pedidos = useAppStore((s) => s.pedidos);
  const fiado = useAppStore((s) => s.fiado);
  const formas = useAppStore((s) => s.config.formas_pagamento);
  const salvar = useAppStore((s) => s.salvar);
  const criarPedido = useAppStore((s) => s.criarPedido);

  const zonasAtivas = zonas.filter((z) => z.ativa);

  const [tipo, setTipo] = useState<TipoPedido>("delivery");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvarNovo, setSalvarNovo] = useState(false);
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [qtd, setQtd] = useState<Record<string, number>>({});
  const [buscaProduto, setBuscaProduto] = useState("");
  const [cupom, setCupom] = useState("");
  const [forma, setForma] = useState(() => formas.find((f) => f !== "Fiado") ?? "Pix");
  const [troco, setTroco] = useState<number | null>(null);
  const [obs, setObs] = useState("");
  const [canal, setCanal] = useState("Telefone");
  const [agendar, setAgendar] = useState(false);
  const [agendadoPara, setAgendadoPara] = useState("");
  const [tentou, setTentou] = useState(false);

  const escolherTipo = (t: TipoPedido) => {
    setTipo(t);
    setCanal(t === "delivery" ? "Telefone" : "Balcão");
    if (t === "no_local") setAgendar(false);
  };

  const selecionarCliente = (c: Cliente) => {
    setCliente(c);
    setBuscaCliente("");
    if (c.endereco) setEndereco(c.endereco);
    if (c.bairro && zonasAtivas.some((z) => z.bairro === c.bairro)) setBairro(c.bairro);
  };

  const resultadosClientes = useMemo(() => {
    const b = buscaCliente.trim();
    if (!b) return [];
    const dig = b.replace(/\D/g, "");
    return clientes
      .filter((c) => contem(c.nome, b) || (dig.length >= 3 && c.telefone.replace(/\D/g, "").includes(dig)))
      .slice(0, 6);
  }, [clientes, buscaCliente]);

  const categoriasVisiveis = useMemo(
    () =>
      [...categorias]
        .filter((c) => c.ativa)
        .sort((a, b) => a.ordem - b.ordem)
        .map((c) => ({
          categoria: c,
          produtos: produtos.filter(
            (p) => p.ativo && p.categoria_id === c.id && (contem(p.nome, buscaProduto) || contem(p.descricao, buscaProduto)),
          ),
        }))
        .filter((g) => g.produtos.length > 0),
    [categorias, produtos, buscaProduto],
  );

  const itens: ItemPedido[] = Object.entries(qtd)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => {
      const p = produtos.find((x) => x.id === id)!;
      return { produto_id: id, nome: p.nome, quantidade: q, preco_unitario: precoVenda(p) };
    });

  const mudarQtd = (id: string, delta: number) =>
    setQtd((m) => ({ ...m, [id]: Math.max(0, Math.min(99, (m[id] ?? 0) + delta)) }));

  const input: NovoPedidoInput = {
    tipo_pedido: tipo,
    cliente_id: cliente?.id ?? null,
    cliente_nome: cliente?.nome ?? nome.trim(),
    cliente_telefone: cliente?.telefone ?? (telefone.trim() || null),
    endereco: tipo === "delivery" ? endereco.trim() || null : null,
    bairro: tipo === "delivery" ? bairro || null : null,
    itens,
    forma_pagamento: forma,
    troco_para: forma === "Dinheiro" ? troco : null,
    observacao: obs,
    cupom_codigo: cupom.trim() || null,
    canal_venda: canal,
    origem: "PDV",
    agendado_para: agendar && agendadoPara ? new Date(agendadoPara) : null,
  };
  const totais = calcularTotaisPedido(input, { zonas, configEntrega, cupons, pedidos });

  // Fiado
  const saldo = cliente ? (saldosFiado(fiado).get(cliente.id) ?? 0) : 0;
  const fiadoElegivel = !!cliente && cliente.limite_fiado > 0;
  const disponivelFiado = cliente ? Math.max(0, cliente.limite_fiado - saldo) : 0;

  // Validação
  const erros: Record<string, string> = {};
  if (itens.length === 0) erros.itens = "Adicione pelo menos um produto.";
  if (tipo === "delivery") {
    if (!cliente && !nome.trim()) erros.nome = "Informe o nome do cliente.";
    if (!endereco.trim()) erros.endereco = "Informe o endereço.";
    if (!bairro) erros.bairro = "Escolha o bairro.";
    if (itens.length && totais.total_produtos < configEntrega.pedido_minimo)
      erros.minimo = `Pedido mínimo para delivery: ${formatCurrency(configEntrega.pedido_minimo)}.`;
  }
  if (totais.erroCupom) erros.cupom = totais.erroCupom;
  if (forma === "Fiado") {
    if (!fiadoElegivel) erros.forma = "Fiado só para cliente cadastrado com limite liberado.";
    else if (saldo + totais.total > cliente!.limite_fiado)
      erros.forma = `Limite de fiado excedido (disponível ${formatCurrency(disponivelFiado)}).`;
  }
  if (forma === "Dinheiro" && troco !== null && troco < totais.total) erros.troco = "O valor para troco é menor que o total.";
  if (agendar && (!agendadoPara || new Date(agendadoPara) <= new Date())) erros.agendamento = "Escolha uma data e hora futura.";
  const valido = Object.keys(erros).length === 0;
  const erro = (k: string) => (tentou ? (erros[k] ?? null) : null);

  const criar = () => {
    setTentou(true);
    if (!valido) {
      toast.error("Confira os campos destacados");
      return;
    }
    let clienteId = cliente?.id ?? null;
    if (!cliente && salvarNovo && nome.trim()) {
      const novo: Cliente = {
        id: novoId("cli"),
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: null,
        endereco: tipo === "delivery" ? endereco.trim() : null,
        bairro: tipo === "delivery" ? bairro : null,
        observacoes: null,
        limite_fiado: 0,
        criado_em: new Date(),
      };
      salvar("clientes", novo);
      clienteId = novo.id;
    }
    const p = criarPedido({ ...input, cliente_id: clienteId });
    toast.success(`Pedido #${p.numero} criado`, { description: `${p.cliente_nome} · ${formatCurrency(p.total)}` });
    onDone();
  };

  const agoraLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo pedido</DialogTitle>
        <DialogDescription>Lançamento no balcão ou por telefone. O pedido entra direto em preparo.</DialogDescription>
      </DialogHeader>

      <DialogBody>
        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:grid-rows-[auto_1fr]">
          {/* A — tipo e cliente */}
          <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
            <Bloco titulo="Tipo do pedido">
              <div role="radiogroup" aria-label="Tipo do pedido" className="grid grid-cols-3 gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={tipo === t.value}
                    onClick={() => escolherTipo(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-[12px] font-semibold transition-colors",
                      tipo === t.value ? "border-primary bg-chart-primary/10 text-primary" : "border-line hover:bg-gray-50",
                    )}
                  >
                    <t.icon className="size-4" /> {t.label}
                  </button>
                ))}
              </div>
            </Bloco>

            <Bloco titulo="Cliente">
              {cliente ? (
                <div className="flex items-start gap-3 rounded-md border border-line p-3">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{cliente.nome}</p>
                    <p className="text-[12px] text-ink-muted">{cliente.telefone}</p>
                    {cliente.limite_fiado > 0 && (
                      <p className="text-[12px] text-ink-muted">
                        Fiado: deve {formatCurrency(saldo)} · disponível {formatCurrency(disponivelFiado)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCliente(null)}
                    className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-gray-100"
                    aria-label="Trocar cliente"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <SearchInput value={buscaCliente} onChange={setBuscaCliente} placeholder="Buscar cliente cadastrado" />
                    {buscaCliente.trim() && (
                      <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-line bg-white shadow-lg">
                        {resultadosClientes.length === 0 ? (
                          <p className="px-3 py-2.5 text-ink-muted">Nenhum cliente encontrado</p>
                        ) : (
                          resultadosClientes.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selecionarCliente(c)}
                              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50"
                            >
                              <span className="font-semibold">{c.nome}</span>
                              <span className="text-[12px] text-ink-muted">
                                {c.telefone}
                                {c.bairro ? ` · ${c.bairro}` : ""}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-muted">Ou informe um cliente avulso:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Nome" htmlFor="novo-nome" error={erro("nome")}>
                      <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Consumidor final" />
                    </Field>
                    <Field label="Telefone" htmlFor="novo-tel">
                      <Input
                        id="novo-tel"
                        inputMode="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="(87) 9…"
                      />
                    </Field>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-[#2F7DBF]"
                      checked={salvarNovo}
                      disabled={!nome.trim()}
                      onChange={(e) => setSalvarNovo(e.target.checked)}
                    />
                    <span className={cn(!nome.trim() && "text-ink-muted")}>Salvar como novo cliente</span>
                  </label>
                </div>
              )}
            </Bloco>

            {tipo === "delivery" && (
              <Bloco titulo="Entrega">
                <div className="flex flex-col gap-3">
                  <Field label="Endereço" htmlFor="novo-end" error={erro("endereco")}>
                    <Input
                      id="novo-end"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </Field>
                  <Field label="Bairro" error={erro("bairro")}>
                    <Select value={bairro} onValueChange={setBairro}>
                      <SelectTrigger aria-label="Bairro">
                        <SelectValue placeholder="Escolha o bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        {zonasAtivas.map((z) => (
                          <SelectItem key={z.id} value={z.bairro}>
                            {z.bairro} · {formatCurrency(z.taxa)} · {z.tempo_min}–{z.tempo_max} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </Bloco>
            )}
          </div>

          {/* B — produtos */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <Bloco titulo="Produtos">
              <SearchInput value={buscaProduto} onChange={setBuscaProduto} placeholder="Buscar produto" />
              {erro("itens") && <p className="mt-2 text-[12px] text-negative">{erro("itens")}</p>}
              <div className="mt-3 flex flex-col gap-4">
                {categoriasVisiveis.length === 0 && <p className="py-6 text-center text-ink-muted">Nenhum produto encontrado</p>}
                {categoriasVisiveis.map(({ categoria, produtos: lista }) => (
                  <div key={categoria.id}>
                    <p className="mb-1.5 font-semibold">{categoria.nome}</p>
                    <ul className="divide-y divide-line rounded-md border border-line">
                      {lista.map((p) => {
                        const q = qtd[p.id] ?? 0;
                        return (
                          <li key={p.id} className={cn("flex items-center gap-3 px-3 py-2", q > 0 && "bg-chart-primary/5")}>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{p.nome}</p>
                              <p className="text-[12px] tabular-nums">
                                {p.preco_promocional !== null && (
                                  <span className="mr-1.5 text-ink-muted line-through">{formatCurrency(p.preco)}</span>
                                )}
                                <span className={cn(p.preco_promocional !== null && "font-semibold text-positive")}>
                                  {formatCurrency(precoVenda(p))}
                                </span>
                              </p>
                            </div>
                            {q === 0 ? (
                              <Button variant="outline" size="sm" onClick={() => mudarQtd(p.id, 1)} aria-label={`Adicionar ${p.nome}`}>
                                <Plus /> Adicionar
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => mudarQtd(p.id, -1)}
                                  className="flex size-8 items-center justify-center rounded-md border border-line hover:bg-gray-100"
                                  aria-label={`Diminuir ${p.nome}`}
                                >
                                  <Minus className="size-3.5" />
                                </button>
                                <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">
                                  {q}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => mudarQtd(p.id, 1)}
                                  className="flex size-8 items-center justify-center rounded-md border border-line hover:bg-gray-100"
                                  aria-label={`Aumentar ${p.nome}`}
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </Bloco>
          </div>

          {/* C — pagamento e resumo */}
          <div className="flex flex-col gap-4 self-start lg:col-start-2 lg:row-start-2">
            <Bloco titulo="Pagamento">
              <div className="flex flex-col gap-3">
                <Field label="Forma de pagamento" error={tentou || forma === "Fiado" ? (erros.forma ?? null) : null}>
                  <Select value={forma} onValueChange={setForma}>
                    <SelectTrigger aria-label="Forma de pagamento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formas.map((f) => (
                        <SelectItem key={f} value={f} disabled={f === "Fiado" && !fiadoElegivel}>
                          {f}
                          {f === "Fiado" && !fiadoElegivel ? " (cliente sem limite)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {forma === "Dinheiro" && (
                  <Field label="Troco para" hint="Deixe vazio se não precisa de troco" error={erro("troco")}>
                    <CurrencyInput value={troco} onChange={setTroco} aria-label="Troco para" />
                  </Field>
                )}
                <Field
                  label="Cupom"
                  error={cupom.trim() ? (erros.cupom ?? null) : null}
                  hint={cupom.trim() && totais.desconto > 0 ? `Desconto de ${formatCurrency(totais.desconto)} aplicado` : undefined}
                >
                  <Input
                    value={cupom}
                    onChange={(e) => setCupom(e.target.value.toUpperCase())}
                    placeholder="Código do cupom"
                    aria-label="Código do cupom"
                  />
                </Field>
                <Field label="Canal de venda">
                  <Select value={canal} onValueChange={setCanal}>
                    <SelectTrigger aria-label="Canal de venda">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANAIS_VENDA.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {configEntrega.aceita_agendamento && tipo !== "no_local" && (
                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center justify-between gap-3">
                      <span className="text-[12px] font-semibold">Agendar para depois</span>
                      <Switch checked={agendar} onCheckedChange={setAgendar} aria-label="Agendar pedido" />
                    </label>
                    {agendar && (
                      <Field label="Data e hora" error={erro("agendamento")}>
                        <Input
                          type="datetime-local"
                          min={agoraLocal}
                          value={agendadoPara}
                          onChange={(e) => setAgendadoPara(e.target.value)}
                        />
                      </Field>
                    )}
                  </div>
                )}
                <Field label="Observação">
                  <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: sem cebola" />
                </Field>
              </div>
            </Bloco>

            <Bloco titulo="Resumo">
              {itens.length > 0 && (
                <ul className="mb-3 flex flex-col gap-1">
                  {itens.map((i) => (
                    <li key={i.produto_id} className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        {i.quantidade}x {i.nome}
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                        {formatCurrency(i.quantidade * i.preco_unitario)}
                        <button
                          type="button"
                          onClick={() => setQtd((m) => ({ ...m, [i.produto_id]: 0 }))}
                          className="flex size-6 items-center justify-center rounded text-ink-muted hover:bg-gray-100"
                          aria-label={`Remover ${i.nome}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="flex flex-col gap-1 rounded-md bg-gray-50 p-3 tabular-nums">
                <Linha rotulo="Produtos" valor={formatCurrency(totais.total_produtos)} />
                {tipo === "delivery" && (
                  <Linha
                    rotulo="Entrega"
                    valor={
                      bairro
                        ? totais.taxa_entrega === 0
                          ? "Grátis"
                          : formatCurrency(totais.taxa_entrega)
                        : "—"
                    }
                  />
                )}
                {totais.taxa_servico > 0 && <Linha rotulo="Serviço (10%)" valor={formatCurrency(totais.taxa_servico)} />}
                {totais.desconto > 0 && <Linha rotulo="Desconto" valor={`-${formatCurrency(totais.desconto)}`} negativo />}
                <div className="mt-1 flex justify-between border-t border-line pt-2 text-[15px] font-bold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(totais.total)}</dd>
                </div>
              </dl>
              {erros.minimo && itens.length > 0 && <p className="mt-2 text-[12px] text-negative">{erros.minimo}</p>}
            </Bloco>
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="justify-between">
        <span className="text-[15px] font-bold tabular-nums">
          Total {formatCurrency(totais.total)}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button onClick={criar}>Criar pedido</Button>
        </div>
      </DialogFooter>
    </>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-muted">{titulo}</h3>
      {children}
    </section>
  );
}

function Linha({ rotulo, valor, negativo }: { rotulo: string; valor: string; negativo?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{rotulo}</dt>
      <dd className={cn(negativo && "text-negative")}>{valor}</dd>
    </div>
  );
}
