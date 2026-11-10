// Modelo de dados do painel. Nomes em snake_case de propósito: espelham as
// futuras tabelas, para que a troca do armazenamento local por uma API seja direta.

/* ------------------------------------------------------------------ */
/* Pedidos                                                            */
/* ------------------------------------------------------------------ */

export type TipoPedido = "delivery" | "retirada" | "no_local";
export type MomentoEntrega = "imediato" | "agendado";

/** Fluxo: pendente (em análise) → em_preparo → pronto → em_entrega (só delivery) → concluido. */
export type StatusPedido = "pendente" | "em_preparo" | "pronto" | "em_entrega" | "concluido" | "cancelado";

export interface ItemPedido {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  observacao?: string;
}

export interface Pedido {
  id: string;
  /** Número sequencial exibido ao usuário (#1234). */
  numero: number;
  criado_em: Date;
  aceito_em: Date | null;
  /** Momento em que o pedido foi concluído. */
  fechado_em: Date | null;
  agendado_para: Date | null;
  cancelado_em: Date | null;
  motivo_cancelamento: string | null;
  status: StatusPedido;
  tipo_pedido: TipoPedido;
  momento_entrega: MomentoEntrega;
  canal_venda: string;
  origem: string;
  forma_pagamento: string;
  /** Valor em dinheiro entregue pelo cliente, quando pede troco. */
  troco_para: number | null;
  funcionario_id: string;
  responsavel_entrega: string | null;
  cliente_id: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  itens: ItemPedido[];
  observacao: string | null;
  cupom_codigo: string | null;
  total_produtos: number;
  taxa_entrega: number;
  taxa_servico: number;
  taxas_adicionais: number;
  taxa_maquineta: number;
  desconto: number;
  total: number;
}

/* ------------------------------------------------------------------ */
/* Loja e equipe                                                      */
/* ------------------------------------------------------------------ */

export interface DiaFuncionamento {
  aberto: boolean;
  abre: string; // "HH:mm"
  fecha: string; // "HH:mm"
}

/** Dados da empresa (o sistema é de uma empresa só). */
export interface Loja {
  nome: string;
  /** Site ou cardápio online próprio da empresa (opcional, URL completa). */
  site: string;
  descricao: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  logo_url: string | null;
  cor_marca: string;
  /** Índice 0 = domingo … 6 = sábado. */
  horarios: DiaFuncionamento[];
  /** Loja fechada temporariamente (não recebe pedidos). */
  pausada: boolean;
}

export type Cargo = "administrador" | "gerente" | "atendente" | "cozinha";

export type Permissao =
  | "pedidos"
  | "caixa"
  | "desempenho"
  | "catalogo"
  | "clientes"
  | "fiado"
  | "marketing"
  | "configuracoes"
  | "equipe";

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: Cargo;
  permissoes: Permissao[];
  ativo: boolean;
  criado_em: Date;
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                           */
/* ------------------------------------------------------------------ */

export interface Categoria {
  id: string;
  nome: string;
  ordem: number;
  ativa: boolean;
}

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_promocional: number | null;
  /** Disponível para venda (pausado quando false). */
  ativo: boolean;
  destaque: boolean;
  /** Foto do produto: caminho em /produtos/… ou imagem enviada (data URL já reduzida). */
  imagem_url: string | null;
  criado_em: Date;
}

/* ------------------------------------------------------------------ */
/* Clientes, fiado e avaliações                                      */
/* ------------------------------------------------------------------ */

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  endereco: string | null;
  bairro: string | null;
  observacoes: string | null;
  /** 0 = cliente não pode comprar fiado. */
  limite_fiado: number;
  criado_em: Date;
}

export interface LancamentoFiado {
  id: string;
  cliente_id: string;
  /** compra aumenta a dívida; pagamento reduz. */
  tipo: "compra" | "pagamento";
  valor: number;
  descricao: string;
  pedido_id: string | null;
  forma_pagamento: string | null;
  em: Date;
}

export interface Avaliacao {
  id: string;
  pedido_id: string;
  cliente_id: string | null;
  cliente_nome: string;
  nota: number; // 1 a 5
  comentario: string | null;
  criado_em: Date;
  resposta: string | null;
  respondido_em: Date | null;
}

/* ------------------------------------------------------------------ */
/* Caixa                                                              */
/* ------------------------------------------------------------------ */

export interface MovimentoCaixa {
  id: string;
  tipo: "sangria" | "suprimento";
  valor: number;
  motivo: string;
  em: Date;
  funcionario_id: string;
}

/** As vendas do turno são calculadas a partir dos pedidos criados entre a abertura e o fechamento. */
export interface SessaoCaixa {
  id: string;
  aberto_em: Date;
  aberto_por: string;
  valor_inicial: number;
  movimentos: MovimentoCaixa[];
  fechado_em: Date | null;
  fechado_por: string | null;
  /** Dinheiro contado na gaveta no fechamento. */
  valor_contado: number | null;
  observacao: string | null;
}

/* ------------------------------------------------------------------ */
/* Delivery e marketing                                               */
/* ------------------------------------------------------------------ */

export interface ZonaEntrega {
  id: string;
  bairro: string;
  taxa: number;
  tempo_min: number;
  tempo_max: number;
  ativa: boolean;
}

export interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  tipo: "proprio" | "parceiro";
  ativo: boolean;
}

export interface ConfigEntrega {
  pedido_minimo: number;
  /** null = sem frete grátis. */
  frete_gratis_acima: number | null;
  aceita_agendamento: boolean;
  raio_km: number;
}

export type TipoCupom = "percentual" | "valor_fixo" | "frete_gratis";

export interface Cupom {
  id: string;
  codigo: string;
  descricao: string;
  tipo: TipoCupom;
  /** % (percentual) ou R$ (valor_fixo). Ignorado em frete_gratis. */
  valor: number;
  pedido_minimo: number;
  inicio: Date;
  fim: Date | null;
  limite_usos: number | null;
  primeira_compra: boolean;
  ativo: boolean;
  criado_em: Date;
}

/* ------------------------------------------------------------------ */
/* Sistema                                                            */
/* ------------------------------------------------------------------ */

export interface Configuracoes {
  aceitar_automaticamente: boolean;
  tempo_preparo_padrao: number; // minutos
  /** Pedido em aberto há mais que isso fica destacado como atrasado. */
  alerta_atraso_min: number;
  impressao_automatica: boolean;
  vias_impressao: number;
  som_novo_pedido: boolean;
  notificacoes_navegador: boolean;
  /** Formas de pagamento aceitas em novos pedidos. */
  formas_pagamento: string[];
  /** Modo demonstração: gera pedidos recebidos de tempos em tempos. */
  simular_pedidos: boolean;
}

export interface Notificacao {
  id: string;
  tipo: "pedido" | "avaliacao" | "caixa" | "sistema";
  titulo: string;
  descricao: string;
  em: Date;
  lida: boolean;
  link: string | null;
}

export interface Atividade {
  id: string;
  em: Date;
  funcionario_id: string | null;
  descricao: string;
}

/** Todos os dados do painel (o que fica salvo no navegador). */
export interface DadosApp {
  loja: Loja;
  funcionarios: Funcionario[];
  categorias: Categoria[];
  produtos: Produto[];
  clientes: Cliente[];
  pedidos: Pedido[];
  sessoesCaixa: SessaoCaixa[];
  cupons: Cupom[];
  avaliacoes: Avaliacao[];
  fiado: LancamentoFiado[];
  zonas: ZonaEntrega[];
  entregadores: Entregador[];
  configEntrega: ConfigEntrega;
  config: Configuracoes;
  notificacoes: Notificacao[];
  atividades: Atividade[];
}
