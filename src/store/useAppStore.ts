import { create } from "zustand";
import { toast } from "sonner";
import { createJSONStorage, persist } from "zustand/middleware";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type {
  Atividade,
  Avaliacao,
  Categoria,
  Cliente,
  ConfigEntrega,
  Configuracoes,
  Cupom,
  DadosApp,
  Entregador,
  Funcionario,
  LancamentoFiado,
  Loja,
  MovimentoCaixa,
  Notificacao,
  Pedido,
  Produto,
  SessaoCaixa,
  StatusPedido,
  ZonaEntrega,
} from "@/types";
import { gerarDadosExemplo } from "@/data/seed";
import { corrigirTextosV3 } from "@/data/migracoes";
import { CONSUMIDOR_FINAL } from "@/data/catalogo";
import { calcularTotaisPedido, type NovoPedidoInput, round2 } from "@/lib/pedidos";
import { formatCurrency } from "@/lib/format";
import { novoId } from "@/lib/id";

/**
 * Store único do painel (zustand), salvo no navegador (localStorage).
 * Não há banco de dados: tudo roda no front-end.
 *
 * Coleções simples usam `salvar`/`remover`. Fluxos com regra de negócio
 * (pedidos, caixa, fiado…) têm ações próprias.
 */

/** Coleções editáveis com `salvar` (cria ou atualiza pelo id) e `remover`. */
export type Colecoes = {
  funcionarios: Funcionario;
  categorias: Categoria;
  produtos: Produto;
  clientes: Cliente;
  cupons: Cupom;
  avaliacoes: Avaliacao;
  fiado: LancamentoFiado;
  zonas: ZonaEntrega;
  entregadores: Entregador;
};
export type Colecao = keyof Colecoes;

interface Acoes {
  // Genéricas
  salvar: <K extends Colecao>(colecao: K, item: Colecoes[K]) => void;
  remover: <K extends Colecao>(colecao: K, id: string) => void;
  atualizarLoja: (parcial: Partial<Loja>) => void;
  atualizarConfig: (parcial: Partial<Configuracoes>) => void;
  atualizarConfigEntrega: (parcial: Partial<ConfigEntrega>) => void;

  // Pedidos
  criarPedido: (input: NovoPedidoInput) => Pedido;
  mudarStatusPedido: (
    id: string,
    status: StatusPedido,
    opcoes?: { motivo?: string; responsavel_entrega?: string | null },
  ) => void;

  // Caixa
  abrirCaixa: (valorInicial: number) => void;
  movimentarCaixa: (tipo: MovimentoCaixa["tipo"], valor: number, motivo: string) => void;
  fecharCaixa: (valorContado: number, observacao?: string | null) => void;

  // Fiado e avaliações
  registrarPagamentoFiado: (clienteId: string, valor: number, formaPagamento: string, descricao?: string) => void;
  responderAvaliacao: (id: string, resposta: string) => void;

  // Notificações e registro de atividades
  notificar: (n: Omit<Notificacao, "id" | "em" | "lida">) => void;
  marcarNotificacoesLidas: () => void;
  registrarAtividade: (descricao: string) => void;

  // Sessão
  entrar: (email: string, senha: string) => boolean;
  sair: () => void;

  // Dados de demonstração
  restaurarDadosExemplo: () => void;
  limparDados: () => void;
}

export type AppState = DadosApp & {
  usuarioLogadoId: string | null;
  /** Dia (yyyy-MM-dd) a que as datas salvas se referem — usado para manter a demonstração atual. */
  baseDate: string;
} & Acoes;

const hojeISO = () => format(new Date(), "yyyy-MM-dd");
const ISO_DATA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Mantém exatamente os campos de `padrao`, usando o valor salvo quando existir. */
function completar<T extends object>(padrao: T, salvo: Partial<T> | undefined): T {
  const out = { ...padrao };
  if (salvo) for (const k of Object.keys(padrao) as (keyof T)[]) if (salvo[k] !== undefined) out[k] = salvo[k] as T[keyof T];
  return out;
}

/** Avança todas as datas do estado em `dias` (modo demonstração). */
function deslocarDatas<T>(valor: T, dias: number): T {
  if (valor instanceof Date) return addDays(valor, dias) as T;
  if (Array.isArray(valor)) return valor.map((v) => deslocarDatas(v, dias)) as T;
  if (valor && typeof valor === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) out[k] = deslocarDatas(v, dias);
    return out as T;
  }
  return valor;
}

/**
 * localStorage que não quebra o sistema quando o navegador fica sem espaço (ex.: muitas fotos
 * enviadas): a alteração continua na tela, mas avisa que não foi salva.
 */
let ultimoAvisoEspaco = 0;
const armazenamentoSeguro = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      if (Date.now() - ultimoAvisoEspaco > 10_000) {
        ultimoAvisoEspaco = Date.now();
        toast.error("Sem espaço no navegador: a última alteração não foi salva. Use fotos menores ou remova algumas.");
      }
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* sem acesso ao armazenamento */
    }
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const atividade = (descricao: string): Atividade => ({
        id: novoId("atv"),
        em: new Date(),
        funcionario_id: get().usuarioLogadoId,
        descricao,
      });
      const comAtividade = (descricao: string) => ({ atividades: [atividade(descricao), ...get().atividades].slice(0, 300) });

      return {
        ...gerarDadosExemplo(),
        usuarioLogadoId: null,
        baseDate: hojeISO(),

        /* ---------------- Genéricas ---------------- */

        salvar: (colecao, item) =>
          set((s) => {
            const lista = s[colecao] as unknown as { id: string }[];
            const existe = lista.some((x) => x.id === item.id);
            const nova = existe ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item];
            return { [colecao]: nova } as Partial<AppState>;
          }),

        remover: (colecao, id) =>
          set((s) => {
            const lista = s[colecao] as unknown as { id: string }[];
            return { [colecao]: lista.filter((x) => x.id !== id) } as Partial<AppState>;
          }),

        atualizarLoja: (parcial) => set((s) => ({ loja: { ...s.loja, ...parcial } })),
        atualizarConfig: (parcial) => set((s) => ({ config: { ...s.config, ...parcial } })),
        atualizarConfigEntrega: (parcial) => set((s) => ({ configEntrega: { ...s.configEntrega, ...parcial } })),

        /* ---------------- Pedidos ---------------- */

        criarPedido: (input) => {
          const s = get();
          const agora = new Date();
          const totais = calcularTotaisPedido(input, s, agora);
          const cliente = input.cliente_id ? s.clientes.find((c) => c.id === input.cliente_id) : undefined;
          const status = input.status ?? "em_preparo";
          const numero = s.pedidos.reduce((m, p) => Math.max(m, p.numero), 1000) + 1;

          const pedido: Pedido = {
            id: novoId("ped"),
            numero,
            criado_em: agora,
            aceito_em: status === "pendente" ? null : agora,
            fechado_em: status === "concluido" ? agora : null,
            agendado_para: input.agendado_para ?? null,
            cancelado_em: null,
            motivo_cancelamento: null,
            status,
            tipo_pedido: input.tipo_pedido,
            momento_entrega: input.momento_entrega ?? (input.agendado_para ? "agendado" : "imediato"),
            canal_venda: input.canal_venda ?? "Balcão",
            origem: input.origem ?? "PDV",
            forma_pagamento: input.forma_pagamento,
            troco_para: input.troco_para ?? null,
            funcionario_id: input.funcionario_id ?? s.usuarioLogadoId ?? s.funcionarios[0]?.id ?? "",
            responsavel_entrega: null,
            cliente_id: input.cliente_id,
            cliente_nome: input.cliente_nome?.trim() || cliente?.nome || CONSUMIDOR_FINAL,
            cliente_telefone: input.cliente_telefone ?? cliente?.telefone ?? null,
            endereco: input.tipo_pedido === "delivery" ? (input.endereco ?? cliente?.endereco ?? null) : null,
            bairro: input.tipo_pedido === "delivery" ? (input.bairro ?? cliente?.bairro ?? null) : null,
            itens: input.itens,
            observacao: input.observacao?.trim() || null,
            cupom_codigo: totais.desconto > 0 && input.cupom_codigo ? input.cupom_codigo.trim().toUpperCase() : null,
            total_produtos: totais.total_produtos,
            taxa_entrega: totais.taxa_entrega,
            taxa_servico: totais.taxa_servico,
            taxas_adicionais: totais.taxas_adicionais,
            taxa_maquineta: totais.taxa_maquineta,
            desconto: totais.desconto,
            total: totais.total,
          };

          const fiado =
            pedido.forma_pagamento === "Fiado" && pedido.cliente_id
              ? [
                  ...s.fiado,
                  {
                    id: novoId("fia"),
                    cliente_id: pedido.cliente_id,
                    tipo: "compra" as const,
                    valor: pedido.total,
                    descricao: `Pedido #${pedido.numero}`,
                    pedido_id: pedido.id,
                    forma_pagamento: null,
                    em: agora,
                  },
                ]
              : s.fiado;

          set({
            pedidos: [...s.pedidos, pedido],
            fiado,
            ...(input.externo ? {} : comAtividade(`Criou o pedido #${numero}`)),
          });
          return pedido;
        },

        mudarStatusPedido: (id, status, opcoes) => {
          const s = get();
          const atual = s.pedidos.find((p) => p.id === id);
          if (!atual || atual.status === status) return;
          const agora = new Date();
          const atualizado: Pedido = {
            ...atual,
            status,
            aceito_em: status !== "pendente" && status !== "cancelado" ? (atual.aceito_em ?? agora) : atual.aceito_em,
            fechado_em: status === "concluido" ? agora : atual.fechado_em,
            cancelado_em: status === "cancelado" ? agora : null,
            motivo_cancelamento: status === "cancelado" ? (opcoes?.motivo ?? "Não informado") : null,
            responsavel_entrega:
              opcoes?.responsavel_entrega !== undefined ? opcoes.responsavel_entrega : atual.responsavel_entrega,
          };
          // Cancelou um pedido fiado: a compra sai da conta do cliente.
          const fiado = status === "cancelado" ? s.fiado.filter((l) => l.pedido_id !== id) : s.fiado;
          const verbo: Record<StatusPedido, string> = {
            pendente: "Voltou para análise",
            em_preparo: "Aceitou",
            pronto: "Marcou como pronto",
            em_entrega: "Enviou para entrega",
            concluido: "Concluiu",
            cancelado: "Cancelou",
          };
          set({
            pedidos: s.pedidos.map((p) => (p.id === id ? atualizado : p)),
            fiado,
            ...comAtividade(`${verbo[status]} o pedido #${atual.numero}`),
          });
        },

        /* ---------------- Caixa ---------------- */

        abrirCaixa: (valorInicial) => {
          const s = get();
          if (s.sessoesCaixa.some((c) => !c.fechado_em)) return;
          const sessao: SessaoCaixa = {
            id: novoId("cx"),
            aberto_em: new Date(),
            aberto_por: s.usuarioLogadoId ?? "",
            valor_inicial: round2(valorInicial),
            movimentos: [],
            fechado_em: null,
            fechado_por: null,
            valor_contado: null,
            observacao: null,
          };
          set({ sessoesCaixa: [...s.sessoesCaixa, sessao], ...comAtividade(`Abriu o caixa com ${formatCurrency(valorInicial)}`) });
        },

        movimentarCaixa: (tipo, valor, motivo) => {
          const s = get();
          const mov: MovimentoCaixa = {
            id: novoId("mov"),
            tipo,
            valor: round2(valor),
            motivo,
            em: new Date(),
            funcionario_id: s.usuarioLogadoId ?? "",
          };
          set({
            sessoesCaixa: s.sessoesCaixa.map((c) => (c.fechado_em ? c : { ...c, movimentos: [...c.movimentos, mov] })),
            ...comAtividade(`${tipo === "sangria" ? "Fez sangria" : "Fez suprimento"} de ${formatCurrency(valor)}`),
          });
        },

        fecharCaixa: (valorContado, observacao) => {
          const s = get();
          set({
            sessoesCaixa: s.sessoesCaixa.map((c) =>
              c.fechado_em
                ? c
                : {
                    ...c,
                    fechado_em: new Date(),
                    fechado_por: s.usuarioLogadoId,
                    valor_contado: round2(valorContado),
                    observacao: observacao?.trim() || null,
                  },
            ),
            ...comAtividade("Fechou o caixa"),
          });
        },

        /* ---------------- Fiado e avaliações ---------------- */

        registrarPagamentoFiado: (clienteId, valor, formaPagamento, descricao) => {
          const s = get();
          const cliente = s.clientes.find((c) => c.id === clienteId);
          set({
            fiado: [
              ...s.fiado,
              {
                id: novoId("fia"),
                cliente_id: clienteId,
                tipo: "pagamento",
                valor: round2(valor),
                descricao: descricao?.trim() || "Pagamento",
                pedido_id: null,
                forma_pagamento: formaPagamento,
                em: new Date(),
              },
            ],
            ...comAtividade(`Recebeu ${formatCurrency(valor)} de fiado de ${cliente?.nome ?? "cliente"}`),
          });
        },

        responderAvaliacao: (id, resposta) =>
          set((s) => ({
            avaliacoes: s.avaliacoes.map((a) =>
              a.id === id ? { ...a, resposta: resposta.trim() || null, respondido_em: resposta.trim() ? new Date() : null } : a,
            ),
          })),

        /* ---------------- Notificações ---------------- */

        notificar: (n) =>
          set((s) => ({
            notificacoes: [{ ...n, id: novoId("not"), em: new Date(), lida: false }, ...s.notificacoes].slice(0, 50),
          })),
        marcarNotificacoesLidas: () => set((s) => ({ notificacoes: s.notificacoes.map((n) => ({ ...n, lida: true })) })),
        registrarAtividade: (descricao) => set(() => comAtividade(descricao)),

        /* ---------------- Sessão ---------------- */

        entrar: (email, senha) => {
          const f = get().funcionarios.find((x) => x.ativo && x.email.toLowerCase() === email.trim().toLowerCase());
          if (!f || !senha) return false;
          set({ usuarioLogadoId: f.id });
          return true;
        },
        sair: () => set({ usuarioLogadoId: null }),

        /* ---------------- Demonstração ---------------- */

        restaurarDadosExemplo: () => set({ ...gerarDadosExemplo(), baseDate: hojeISO() }),

        limparDados: () =>
          set((s) => ({
            pedidos: [],
            clientes: [],
            cupons: [],
            avaliacoes: [],
            fiado: [],
            sessoesCaixa: [],
            notificacoes: [],
            atividades: [atividade("Apagou os dados de movimentação")],
            produtos: s.produtos,
          })),
      };
    },
    {
      name: "meu-painel:dados",
      // 3: catálogo e dados reais da loja (antes eram pratos de exemplo).
      // 4: correção de português no catálogo (os dados salvos são mantidos, só os textos são corrigidos).
      version: 4,
      storage: createJSONStorage(() => armazenamentoSeguro, {
        reviver: (_k, v) => (typeof v === "string" && ISO_DATA.test(v) ? new Date(v) : v),
      }),
      partialize: (s) => {
        // Só dados (sem funções)
        const dados: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(s)) if (typeof v !== "function") dados[k] = v;
        return dados as Partial<AppState>;
      },
      // 3 → 4 mantém tudo e só corrige textos; qualquer versão mais antiga começa de novo com os dados de exemplo.
      migrate: (persistido, versao) =>
        versao === 3
          ? (corrigirTextosV3(persistido as Record<string, unknown>) as unknown as AppState)
          : ({ ...gerarDadosExemplo(), usuarioLogadoId: null, baseDate: hojeISO() } as unknown as AppState),
      merge: (persistido, atual) => {
        const p = persistido as Partial<AppState> | undefined;
        if (!p?.baseDate) return atual;
        const dias = differenceInCalendarDays(new Date(), parseISO(p.baseDate));
        const dados = (dias > 0 ? deslocarDatas(p, dias) : p) as Partial<AppState>;

        // Compatibilidade com dados salvos por versões anteriores: só entram campos que
        // ainda existem, e os objetos de ajustes são completados com os valores padrão.
        const resultado: Record<string, unknown> = { ...atual };
        for (const k of Object.keys(atual) as (keyof AppState)[]) {
          if (typeof atual[k] !== "function" && dados[k] !== undefined) resultado[k] = dados[k];
        }
        resultado.loja = completar(atual.loja, dados.loja);
        resultado.config = completar(atual.config, dados.config);
        resultado.configEntrega = completar(atual.configEntrega, dados.configEntrega);
        resultado.baseDate = hojeISO();
        return resultado as unknown as AppState;
      },
    },
  ),
);

/* ------------------------------------------------------------------ */
/* Seletores comuns                                                   */
/* ------------------------------------------------------------------ */

export const useUsuarioLogado = () =>
  useAppStore((s) => s.funcionarios.find((f) => f.id === s.usuarioLogadoId) ?? null);

/** Sessão de caixa aberta (ou null). */
export const useCaixaAberto = () => useAppStore((s) => s.sessoesCaixa.find((c) => !c.fechado_em) ?? null);

export const nomeFuncionario = (funcionarios: Funcionario[], id: string | null) =>
  funcionarios.find((f) => f.id === id)?.nome ?? "—";

/** Saldo devedor de fiado por cliente (compras − pagamentos). */
export function saldosFiado(lancamentos: LancamentoFiado[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lancamentos) {
    m.set(l.cliente_id, round2((m.get(l.cliente_id) ?? 0) + (l.tipo === "compra" ? l.valor : -l.valor)));
  }
  return m;
}
