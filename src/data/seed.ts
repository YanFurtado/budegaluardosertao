import { addDays, addMinutes, startOfDay, subDays } from "date-fns";
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
  MomentoEntrega,
  MovimentoCaixa,
  Notificacao,
  Pedido,
  Produto,
  SessaoCaixa,
  StatusPedido,
  TipoPedido,
  ZonaEntrega,
} from "@/types";
import { CANAIS_VENDA, CONSUMIDOR_FINAL, FORMAS_PAGAMENTO, ORIGENS } from "./catalogo";
import { formatCurrency } from "@/lib/format";
import { round2 } from "@/lib/pedidos";
import { CARGOS } from "@/lib/permissoes";
import { sortearItens } from "@/lib/sortearItens";
import LOJA_REAL from "./lojaReal.json";

/**
 * Dados de exemplo de todo o painel (somente front-end).
 * Determinístico: a mesma semente gera sempre os mesmos dados, relativos ao "agora".
 */
export const TOTAL_PEDIDOS_EXEMPLO = 600;
export const DIAS_EXEMPLO = 60;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picos de manhã (9h–11h) e no fim da tarde (16h–19h); pedidos fora do horário da loja são descartados.
const PESO_HORA: Record<number, number> = {
  8: 3, 9: 6, 10: 8, 11: 7, 12: 4, 13: 3, 14: 2, 15: 3, 16: 5, 17: 7, 18: 7, 19: 5, 20: 2,
};
// Domingo … sábado (domingo abre só de manhã; sexta e sábado vendem mais)
const PESO_DIA_SEMANA = [0.8, 0.8, 0.9, 0.9, 1, 1.3, 1.5];

const paraMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const NOMES = ["Maria", "José", "Ana", "João", "Francisca", "Antônio", "Luiza", "Paulo", "Carla", "Pedro", "Juliana", "Lucas", "Fernanda", "Rafaela", "Camila", "Marcos", "Patrícia", "Thiago", "Aline", "Gabriel", "Bruna", "Felipe", "Larissa", "Diego", "Renata", "Bruno", "Vanessa", "Rodrigo", "Tatiane", "Edson"];
const SOBRENOMES = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Ferreira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Carvalho", "Gomes", "Araújo", "Ribeiro", "Barbosa", "Cavalcanti", "Barros", "Moura", "Coelho"];
const RUAS = ["Rua do Sol", "Av. Souza Filho", "Rua Pacífico da Luz", "Rua Dom Vital", "Av. Guararapes", "Rua Aristarco Lopes", "Rua Coronel Amorim", "Travessa do Rosário"];
const OBSERVACOES = ["Queijo bem curado, por favor", "Fatiar a mussarela bem fininha", "Tocar o interfone 2x", "Troco em notas pequenas", "Pode deixar na portaria"];

const COMENTARIOS: Record<number, (string | null)[]> = {
  5: ["Queijo coalho maravilhoso, igual ao do interior!", "Melhor doce de leite de Petrolina.", "Atendimento nota 10, entrega rápida.", "Tudo perfeito, como sempre.", "O bolo de rolo chegou fresquinho, recomendo!", null],
  4: ["Muito bom, só demorou um pouco.", "Gostei bastante, produtos de qualidade.", "Queijo ótimo, a embalagem podia ser melhor.", null],
  3: ["Produto bom, mas o queijo veio menos curado do que pedi.", "Razoável. Já foi melhor.", "Demorou bastante para chegar."],
  2: ["Veio faltando um item do pedido.", "O pedido atrasou quase uma hora."],
  1: ["Pedido veio errado e ninguém atendeu o telefone.", "Queijo muito salgado, não gostei."],
};

export const CONFIG_PADRAO: Configuracoes = {
  aceitar_automaticamente: false,
  tempo_preparo_padrao: 30,
  alerta_atraso_min: 40,
  impressao_automatica: true,
  vias_impressao: 1,
  som_novo_pedido: true,
  notificacoes_navegador: false,
  formas_pagamento: [...FORMAS_PAGAMENTO],
  simular_pedidos: true,
};

export function gerarDadosExemplo(agora = new Date(), total = TOTAL_PEDIDOS_EXEMPLO): DadosApp {
  const rand = mulberry32(20261104);
  const escolher = <T,>(itens: readonly T[], pesos?: readonly number[]): T => {
    const p = pesos ?? itens.map(() => 1);
    const soma = p.reduce((a, b) => a + b, 0);
    let r = rand() * soma;
    for (let i = 0; i < itens.length; i++) {
      r -= p[i];
      if (r <= 0) return itens[i];
    }
    return itens[itens.length - 1];
  };
  const entre = (min: number, max: number) => min + rand() * (max - min);
  const inteiro = (min: number, max: number) => Math.floor(entre(min, max + 1));
  const chance = (p: number) => rand() < p;
  const digitos = (n: number) => Array.from({ length: n }, () => inteiro(0, 9)).join("");
  const hoje = startOfDay(agora);

  /* ---------------- Loja e equipe ---------------- */

  const loja: Loja = { ...LOJA_REAL.loja, horarios: LOJA_REAL.loja.horarios.map((h) => ({ ...h })) };
  /** Dentro do expediente do dia (com 5 min de folga antes de fechar). */
  const noHorario = (d: Date) => {
    const h = loja.horarios[d.getDay()];
    const m = d.getHours() * 60 + d.getMinutes();
    return h.aberto && m >= paraMin(h.abre) && m < paraMin(h.fecha) - 5;
  };

  const perms = (cargo: Funcionario["cargo"]) => [...CARGOS.find((c) => c.value === cargo)!.permissoesPadrao];
  const funcionarios: Funcionario[] = [
    { id: "func-1", nome: "Ana Souza", email: "ana@budegaluardosertao.com.br", telefone: "(87) 99811-2233", cargo: "administrador", permissoes: perms("administrador"), ativo: true, criado_em: subDays(hoje, 400) },
    { id: "func-2", nome: "Carlos Lima", email: "carlos@budegaluardosertao.com.br", telefone: "(87) 99822-3344", cargo: "gerente", permissoes: perms("gerente"), ativo: true, criado_em: subDays(hoje, 300) },
    { id: "func-3", nome: "Mariana Alves", email: "mariana@budegaluardosertao.com.br", telefone: "(87) 99833-4455", cargo: "atendente", permissoes: perms("atendente"), ativo: true, criado_em: subDays(hoje, 120) },
    { id: "func-4", nome: "José Ferreira", email: "jose@budegaluardosertao.com.br", telefone: "(87) 99844-5566", cargo: "cozinha", permissoes: perms("cozinha"), ativo: true, criado_em: subDays(hoje, 90) },
  ];

  /* ---------------- Catálogo ---------------- */

  // Catálogo real da loja (extraído da página antiga por scripts/extrair-vitrine.mjs)
  const categorias: Categoria[] = LOJA_REAL.categorias.map((c) => ({ ...c, ativa: true }));
  const produtos: Produto[] = LOJA_REAL.produtos.map((p, i) => ({ ...p, criado_em: subDays(hoje, 400 - i) }));
  const ativos = produtos.filter((p) => p.ativo);

  /* ---------------- Delivery ---------------- */

  const zonas: ZonaEntrega[] = [
    { id: "zona-1", bairro: "Centro", taxa: 5, tempo_min: 25, tempo_max: 40, ativa: true },
    { id: "zona-2", bairro: "Jardim Florida", taxa: 7, tempo_min: 30, tempo_max: 45, ativa: true },
    { id: "zona-3", bairro: "Vila Eduardo", taxa: 6, tempo_min: 30, tempo_max: 45, ativa: true },
    { id: "zona-4", bairro: "Areia Branca", taxa: 8, tempo_min: 35, tempo_max: 50, ativa: true },
    { id: "zona-5", bairro: "Cohab Massangano", taxa: 10, tempo_min: 40, tempo_max: 60, ativa: false },
  ];
  const zonasAtivas = zonas.filter((z) => z.ativa);

  const entregadores: Entregador[] = [
    { id: "ent-1", nome: "João Pedro", telefone: "(87) 99901-1122", tipo: "proprio", ativo: true },
    { id: "ent-2", nome: "Rafael Santos", telefone: "(87) 99902-3344", tipo: "proprio", ativo: true },
    { id: "ent-3", nome: "Entrega parceira", telefone: "(87) 3861-9000", tipo: "parceiro", ativo: true },
  ];

  const configEntrega: ConfigEntrega = { pedido_minimo: LOJA_REAL.pedido_minimo, frete_gratis_acima: 120, aceita_agendamento: true, raio_km: 8 };

  /* ---------------- Clientes ---------------- */

  const clientes: Cliente[] = [];
  const usados = new Set<string>();
  while (clientes.length < 80) {
    const nome = `${escolher(NOMES)} ${escolher(SOBRENOMES)}`;
    if (usados.has(nome)) continue;
    usados.add(nome);
    const i = clientes.length;
    const temEndereco = chance(0.85);
    const bairro = temEndereco ? escolher(zonasAtivas, [35, 25, 22, 18]).bairro : null;
    const slug = nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(" ", ".");
    clientes.push({
      id: `cli-${String(i + 1).padStart(3, "0")}`,
      nome,
      telefone: `(87) 9${digitos(4)}-${digitos(4)}`,
      email: chance(0.45) ? `${slug}@email.com` : null,
      endereco: temEndereco ? `${escolher(RUAS)}, ${inteiro(10, 999)}` : null,
      bairro,
      observacoes: null,
      limite_fiado: i < 8 && temEndereco ? escolher([150, 200, 300]) : 0,
      criado_em: subDays(hoje, inteiro(5, 400)),
    });
  }
  const clientesComEndereco = clientes.filter((c) => c.bairro);
  const pesoCliente = (c: Cliente) => (Number(c.id.slice(4)) <= 25 ? 3 : 1);

  /* ---------------- Cupons ---------------- */

  const cupons: Cupom[] = [
    { id: "cup-1", codigo: "SERTAO10", descricao: "10% de desconto em qualquer pedido acima de R$ 40", tipo: "percentual", valor: 10, pedido_minimo: 40, inicio: subDays(hoje, 90), fim: null, limite_usos: null, primeira_compra: false, ativo: true, criado_em: subDays(hoje, 90) },
    { id: "cup-2", codigo: "BEMVINDO", descricao: "R$ 8 de desconto na primeira compra", tipo: "valor_fixo", valor: 8, pedido_minimo: 30, inicio: subDays(hoje, 120), fim: null, limite_usos: null, primeira_compra: true, ativo: true, criado_em: subDays(hoje, 120) },
    { id: "cup-3", codigo: "FRETEGRATIS", descricao: "Entrega grátis em pedidos acima de R$ 60", tipo: "frete_gratis", valor: 0, pedido_minimo: 60, inicio: subDays(hoje, 45), fim: addDays(hoje, 30), limite_usos: 200, primeira_compra: false, ativo: true, criado_em: subDays(hoje, 45) },
    { id: "cup-4", codigo: "QUARTA15", descricao: "15% off na quarta-feira", tipo: "percentual", valor: 15, pedido_minimo: 50, inicio: subDays(hoje, 20), fim: null, limite_usos: null, primeira_compra: false, ativo: true, criado_em: subDays(hoje, 20) },
    { id: "cup-5", codigo: "PROMO5", descricao: "R$ 5 de desconto (campanha encerrada)", tipo: "valor_fixo", valor: 5, pedido_minimo: 25, inicio: subDays(hoje, 70), fim: subDays(hoje, 25), limite_usos: 100, primeira_compra: false, ativo: false, criado_em: subDays(hoje, 70) },
  ];

  /* ---------------- Pedidos ---------------- */

  const horas = Object.keys(PESO_HORA).map(Number);
  const pesosHora = horas.map((h) => PESO_HORA[h]);
  const maxPesoDia = Math.max(...PESO_DIA_SEMANA);
  const brutos: Omit<Pedido, "id" | "numero">[] = [];
  let tentativas = 0;

  while (brutos.length < total && tentativas < total * 50) {
    tentativas++;
    const dia = subDays(hoje, Math.floor(rand() * (DIAS_EXEMPLO + 1)));
    if (rand() > PESO_DIA_SEMANA[dia.getDay()] / maxPesoDia) continue;
    const criado_em = addMinutes(dia, escolher(horas, pesosHora) * 60 + Math.floor(rand() * 60));
    if (criado_em > agora || !noHorario(criado_em)) continue;
    const idadeMin = (agora.getTime() - criado_em.getTime()) / 60000;

    const tipo_pedido = escolher<TipoPedido>(["delivery", "retirada", "no_local"], [55, 25, 20]);

    // Agendados só no passado (já entregues)
    let momento_entrega: MomentoEntrega = "imediato";
    let agendado_para: Date | null = null;
    if (tipo_pedido !== "no_local" && chance(0.15)) {
      const ag = addMinutes(criado_em, Math.round(entre(60, 26 * 60) / 15) * 15);
      if (addMinutes(ag, 45) < agora) {
        momento_entrega = "agendado";
        agendado_para = ag;
      }
    }

    const cliente =
      tipo_pedido === "delivery"
        ? escolher(clientesComEndereco, clientesComEndereco.map(pesoCliente))
        : tipo_pedido === "retirada" || chance(0.3)
          ? escolher(clientes, clientes.map(pesoCliente))
          : null;
    const bairro = tipo_pedido === "delivery" ? cliente!.bairro : null;

    // Itens
    const itens = sortearItens(ativos, rand, configEntrega.pedido_minimo);
    const total_produtos = round2(itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0));

    const forma_pagamento =
      cliente && cliente.limite_fiado > 0 && chance(0.3)
        ? "Fiado"
        : escolher(FORMAS_PAGAMENTO.slice(0, 4), [35, 30, 20, 15]);

    const canal_venda =
      tipo_pedido === "no_local"
        ? escolher(["Balcão", "Cardápio digital"], [70, 30])
        : tipo_pedido === "delivery"
          ? escolher(CANAIS_VENDA.slice(0, 3), [50, 35, 15])
          : escolher(CANAIS_VENDA, [40, 40, 10, 10]);
    const origem =
      canal_venda === "Balcão" ? "PDV" : tipo_pedido === "no_local" ? "QR Code" : escolher(ORIGENS.slice(0, 3), [45, 35, 20]);

    const zona = zonas.find((z) => z.bairro === bairro);
    const taxa_entrega = zona && total_produtos < configEntrega.frete_gratis_acima! ? zona.taxa : 0;
    const taxa_servico = tipo_pedido === "no_local" ? round2(total_produtos * 0.1) : 0;
    const taxas_adicionais = chance(0.12) ? round2(entre(1, 3)) : 0;
    const taxa_maquineta = forma_pagamento.startsWith("Cartão") && chance(0.4) ? round2(total_produtos * 0.025) : 0;

    // Cupom
    let desconto = 0;
    let cupom_codigo: string | null = null;
    if (chance(0.15)) {
      const candidatos = cupons.filter(
        (c) =>
          !c.primeira_compra &&
          c.inicio <= criado_em &&
          (!c.fim || c.fim >= criado_em) &&
          total_produtos >= c.pedido_minimo &&
          (c.tipo !== "frete_gratis" || (tipo_pedido === "delivery" && taxa_entrega > 0)) &&
          (c.codigo !== "QUARTA15" || criado_em.getDay() === 3),
      );
      if (candidatos.length) {
        const c = escolher(candidatos);
        cupom_codigo = c.codigo;
        desconto =
          c.tipo === "frete_gratis" ? taxa_entrega : c.tipo === "percentual" ? round2((total_produtos * c.valor) / 100) : c.valor;
      }
    }

    const totalPedido = round2(total_produtos + taxa_entrega + taxa_servico + taxas_adicionais + taxa_maquineta - desconto);

    // Status conforme a idade do pedido (os da última hora ainda estão em andamento)
    let status: StatusPedido = chance(0.04) ? "cancelado" : "concluido";
    if (status !== "cancelado" && momento_entrega === "imediato" && idadeMin < 75) {
      if (idadeMin < 4) status = "pendente";
      else if (idadeMin < 22) status = "em_preparo";
      else if (idadeMin < 35) status = "pronto";
      else if (tipo_pedido === "delivery" && idadeMin < 60) status = "em_entrega";
    }

    const aceito_em = status === "pendente" ? null : addMinutes(criado_em, inteiro(1, 4));
    let fechado_em: Date | null = null;
    if (status === "concluido") {
      const previsto =
        momento_entrega === "agendado"
          ? addMinutes(agendado_para!, inteiro(10, 30))
          : addMinutes(criado_em, inteiro(35, 60));
      fechado_em = previsto <= agora ? previsto : addMinutes(agora, -1);
    }
    const cancelado_em = status === "cancelado" ? addMinutes(criado_em, inteiro(2, 15)) : null;

    const troco_para =
      forma_pagamento === "Dinheiro" && tipo_pedido === "delivery" && chance(0.5)
        ? Math.ceil(totalPedido / 50) * 50 + (Math.ceil(totalPedido / 50) * 50 === totalPedido ? 50 : 0)
        : null;

    brutos.push({
      criado_em,
      aceito_em,
      fechado_em,
      agendado_para,
      cancelado_em,
      motivo_cancelamento: cancelado_em ? escolher(["Cliente desistiu", "Produto indisponível", "Pagamento não aprovado"]) : null,
      status,
      tipo_pedido,
      momento_entrega,
      canal_venda,
      origem,
      forma_pagamento,
      troco_para,
      funcionario_id: escolher(["func-1", "func-2", "func-3"], [45, 35, 20]),
      responsavel_entrega:
        tipo_pedido === "delivery" && (status === "em_entrega" || status === "concluido")
          ? escolher(entregadores.map((e) => e.nome), [45, 35, 20])
          : null,
      cliente_id: cliente?.id ?? null,
      cliente_nome: cliente?.nome ?? CONSUMIDOR_FINAL,
      cliente_telefone: cliente?.telefone ?? null,
      endereco: tipo_pedido === "delivery" ? cliente!.endereco : null,
      bairro,
      itens,
      observacao: chance(0.1) ? escolher(OBSERVACOES) : null,
      cupom_codigo,
      total_produtos,
      taxa_entrega,
      taxa_servico,
      taxas_adicionais,
      taxa_maquineta,
      desconto,
      total: totalPedido,
    });
  }

  const pedidos: Pedido[] = brutos
    .sort((a, b) => a.criado_em.getTime() - b.criado_em.getTime())
    .map((p, i) => ({ ...p, id: `ped-${1001 + i}`, numero: 1001 + i }));

  // Cliente cadastrado antes do primeiro pedido
  for (const c of clientes) {
    const primeiro = pedidos.find((p) => p.cliente_id === c.id);
    if (primeiro && primeiro.criado_em < c.criado_em) c.criado_em = addMinutes(primeiro.criado_em, -inteiro(5, 600));
  }

  /* ---------------- Avaliações ---------------- */

  const avaliacoes: Avaliacao[] = [];
  for (const p of pedidos) {
    if (p.status !== "concluido" || !p.cliente_id || p.tipo_pedido === "no_local" || !chance(0.14)) continue;
    const em = addMinutes(p.fechado_em!, inteiro(20, 600));
    if (em > agora) continue;
    const nota = escolher([1, 2, 3, 4, 5], [3, 4, 10, 30, 53]);
    const primeiroNome = p.cliente_nome.split(" ")[0];
    const responde = em < subDays(agora, 1) && chance(0.6);
    avaliacoes.push({
      id: `ava-${p.numero}`,
      pedido_id: p.id,
      cliente_id: p.cliente_id,
      cliente_nome: p.cliente_nome,
      nota,
      comentario: escolher(COMENTARIOS[nota]),
      criado_em: em,
      resposta: responde
        ? nota >= 4
          ? `Muito obrigado, ${primeiroNome}! Ficamos felizes que gostou. Volte sempre!`
          : `Oi, ${primeiroNome}. Sentimos muito pela experiência. Já conversamos com a equipe para melhorar. Conte com a gente!`
        : null,
      respondido_em: responde ? addMinutes(em, inteiro(30, 600)) : null,
    });
  }

  /* ---------------- Fiado ---------------- */

  const fiado: LancamentoFiado[] = [];
  for (const c of clientes.filter((x) => x.limite_fiado > 0)) {
    let saldo = 0;
    for (const p of pedidos.filter((x) => x.cliente_id === c.id && x.forma_pagamento === "Fiado" && x.status !== "cancelado")) {
      fiado.push({ id: `fia-${p.numero}`, cliente_id: c.id, tipo: "compra", valor: p.total, descricao: `Pedido #${p.numero}`, pedido_id: p.id, forma_pagamento: null, em: p.criado_em });
      saldo = round2(saldo + p.total);
      if (chance(0.4)) {
        const em = addMinutes(startOfDay(addDays(p.criado_em, inteiro(2, 10))), 14 * 60 + inteiro(0, 120));
        if (em < agora) {
          const valor = round2(saldo * escolher([1, 0.5, 1]));
          saldo = round2(saldo - valor);
          fiado.push({ id: `fia-pg-${p.numero}`, cliente_id: c.id, tipo: "pagamento", valor, descricao: "Pagamento", pedido_id: null, forma_pagamento: escolher(["Pix", "Dinheiro"]), em });
        }
      }
    }
  }
  fiado.sort((a, b) => a.em.getTime() - b.em.getTime());

  /* ---------------- Caixa ---------------- */

  const sessoesCaixa: SessaoCaixa[] = [];
  for (let d = 13; d >= 0; d--) {
    const dia = subDays(hoje, d);
    const expediente = loja.horarios[dia.getDay()];
    if (!expediente.aberto) continue;
    const aberto_em = addMinutes(dia, paraMin(expediente.abre) - 15 + inteiro(0, 10));
    if (aberto_em > agora) continue;
    const fechado_em = d > 0 ? addMinutes(dia, paraMin(expediente.fecha) + 15 + inteiro(0, 15)) : null;
    const limite = fechado_em ?? agora;
    const operador = escolher(["func-1", "func-3"]);
    const valor_inicial = escolher([150, 200]);

    const movimentos: MovimentoCaixa[] = [];
    // Dinheiro na gaveta num dado momento (para a sangria nunca passar do que existe).
    const dinheiroAte = (momento: Date) =>
      valor_inicial +
      pedidos
        .filter((p) => p.forma_pagamento === "Dinheiro" && p.status !== "cancelado" && p.criado_em >= aberto_em && p.criado_em <= momento)
        .reduce((s, p) => s + p.total, 0) +
      movimentos.reduce((s, m) => s + (m.tipo === "suprimento" ? m.valor : -m.valor), 0);
    const mov = (tipo: MovimentoCaixa["tipo"], hora: number, valor: number, motivo: string) => {
      const em = addMinutes(dia, hora * 60 + inteiro(0, 59));
      if (em >= limite) return;
      if (tipo === "sangria") {
        // Deixa pelo menos R$ 50 de troco e retira em múltiplos de R$ 50.
        valor = Math.min(valor, Math.floor((dinheiroAte(em) - 50) / 50) * 50);
        if (valor < 50) return;
      }
      movimentos.push({ id: `mov-${d}-${movimentos.length}`, tipo, valor, motivo, em, funcionario_id: operador });
    };
    if (chance(0.2)) mov("suprimento", 12, 50, "Reforço de troco");
    if (chance(0.6)) mov("sangria", 15, escolher([100, 150, 200]), "Retirada para depósito");
    if (chance(0.5)) mov("sangria", 19, escolher([100, 200]), "Pagamento de fornecedor");

    let valor_contado: number | null = null;
    let observacao: string | null = null;
    if (fechado_em) {
      const dinheiro = pedidos
        .filter((p) => p.forma_pagamento === "Dinheiro" && p.status !== "cancelado" && p.criado_em >= aberto_em && p.criado_em <= fechado_em)
        .reduce((s, p) => s + p.total, 0);
      const mvt = movimentos.reduce((s, m) => s + (m.tipo === "suprimento" ? m.valor : -m.valor), 0);
      const diferenca = chance(0.25) ? escolher([-5, -2.5, 2, 3.5]) : 0;
      valor_contado = round2(valor_inicial + dinheiro + mvt + diferenca);
      if (diferenca) observacao = "Diferença de troco";
    }

    sessoesCaixa.push({
      id: `cx-${d}`,
      aberto_em,
      aberto_por: operador,
      valor_inicial,
      movimentos,
      fechado_em,
      fechado_por: fechado_em ? operador : null,
      valor_contado,
      observacao,
    });
  }

  /* ---------------- Notificações e atividades ---------------- */

  const ultimos = pedidos.filter((p) => p.criado_em >= hoje).slice(-3).reverse();
  const notificacoes: Notificacao[] = ultimos.map((p, i) => ({
    id: `not-${p.numero}`,
    tipo: "pedido",
    titulo: `Novo pedido #${p.numero}`,
    descricao: `${p.cliente_nome} · ${formatCurrency(p.total)}`,
    em: p.criado_em,
    lida: i > 0,
    link: "/gestao-pedidos",
  }));
  const ultimaAvaliacao = avaliacoes[avaliacoes.length - 1];
  if (ultimaAvaliacao) {
    notificacoes.push({
      id: `not-${ultimaAvaliacao.id}`,
      tipo: "avaliacao",
      titulo: `Nova avaliação: ${ultimaAvaliacao.nota} ${ultimaAvaliacao.nota === 1 ? "estrela" : "estrelas"}`,
      descricao: ultimaAvaliacao.comentario ?? ultimaAvaliacao.cliente_nome,
      em: ultimaAvaliacao.criado_em,
      lida: true,
      link: "/avaliacoes",
    });
  }
  notificacoes.sort((a, b) => b.em.getTime() - a.em.getTime());

  const atividades: Atividade[] = [];
  for (const s of sessoesCaixa) {
    atividades.push({ id: `atv-ab-${s.id}`, em: s.aberto_em, funcionario_id: s.aberto_por, descricao: `Abriu o caixa com ${formatCurrency(s.valor_inicial)}` });
    if (s.fechado_em) atividades.push({ id: `atv-fe-${s.id}`, em: s.fechado_em, funcionario_id: s.fechado_por, descricao: "Fechou o caixa" });
  }
  const emFalta = produtos.find((p) => !p.ativo);
  if (emFalta) atividades.push({ id: "atv-prod-falta", em: addMinutes(subDays(hoje, 3), 11 * 60), funcionario_id: "func-1", descricao: `Pausou o produto ${emFalta.nome}` });
  atividades.push({ id: "atv-cup-4", em: addMinutes(subDays(hoje, 20), 9 * 60 + 40), funcionario_id: "func-1", descricao: "Criou o cupom QUARTA15" });
  atividades.push({ id: "atv-zona-5", em: addMinutes(subDays(hoje, 8), 16 * 60), funcionario_id: "func-2", descricao: "Desativou entregas para Cohab Massangano" });
  atividades.sort((a, b) => b.em.getTime() - a.em.getTime());

  return {
    loja,
    funcionarios,
    categorias,
    produtos,
    clientes,
    pedidos,
    sessoesCaixa,
    cupons,
    avaliacoes,
    fiado,
    zonas,
    entregadores,
    configEntrega,
    config: { ...CONFIG_PADRAO, formas_pagamento: [...CONFIG_PADRAO.formas_pagamento] },
    notificacoes,
    atividades,
  };
}
