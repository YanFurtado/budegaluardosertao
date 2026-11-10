/**
 * Extrai uma vez os dados reais da página antiga da loja (docs/legado/budega-luar-do-sertao.html):
 *   - public/produtos/<chave>.webp  (fotos dos produtos)
 *   - public/logo-budega.webp       (logo)
 *   - src/data/lojaReal.json        (loja, categorias e produtos, sem imagens embutidas)
 *
 * Uso: node scripts/extrair-vitrine.mjs [caminho-do-html]
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const HTML = path.resolve(process.argv[2] ?? path.join(RAIZ, "docs", "legado", "budega-luar-do-sertao.html"));

const linhas = fs.readFileSync(HTML, "utf8").split(/\r?\n/);
const pegar = (prefixo) => {
  const l = linhas.find((x) => x.startsWith(prefixo));
  if (!l) throw new Error(`Linha "${prefixo}" não encontrada em ${HTML}`);
  return JSON.parse(l.slice(prefixo.length).trim().replace(/;$/, ""));
};
const DATA = pegar("const DATA =");
const IMG = pegar("const IMG =");

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const limpar = (s) => String(s ?? "").replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();

const [maisVendidos, ...cats] = DATA.cats;
if (norm(maisVendidos.name) !== "mais vendidos") throw new Error("A primeira categoria deveria ser 'Mais Vendidos'.");

/* Categoria dos itens que só aparecem em "Mais Vendidos" (escolhida pelo nome do produto). */
const CATEGORIA_DOS_MAIS_VENDIDOS = {
  3172003: "Queijos", // Queijo Coalho Bom de Assar e Pouco Sal 600g
  3172005: "Queijos", // Queijo Manteiga Artesanal de Caicó 600g
  5476599: "Queijos", // Raspa de Tacho de Caicó 600g
  3172037: "Queijos", // Queijo Coalho Furadinho 600g
  3905799: "Queijos", // Queijo Coalho Zero Lactose 500g
  3638824: "Queijos", // Queijo de Cabra Feta 350g
  4625821: "Minas Gerais", // Mini kit 4 Queijos Provolone de Minas
  3172200: "Minas Gerais", // Kit 4 Queijos Minas
  5484943: "Minas Gerais", // Kit 4 Queijos Minas (Cópia)
  3172010: "Minas Gerais", // Kit Trança de Minas
  3365144: "Minas Gerais", // Kit 4 Queijos Minas Provoleto
  5128106: "Minas Gerais", // Kit 3 Queijos e 1 Salame
  4615433: "Bolachas e Biscoitos", // Bolacha Queijo Nacho 300g
  4615436: "Bolachas e Biscoitos", // Bolacha Queijo 300g
  4615441: "Bolachas e Biscoitos", // Bolacha Alho 300g
  4615445: "Bolachas e Biscoitos", // Bolacha Passa Raiva 300g
  4621179: "Bolachas e Biscoitos", // Bolacha Tareco 300g
  5430708: "Bolachas e Biscoitos", // Bolo de Goma / Sequilhos (Cópia)
  3172220: "Doces e Bolos", // Maragogi Doce 300g
  3172238: "Doces e Bolos", // Bolo de Rolo 400g
  3777026: "Doces e Bolos", // Bolo de Rolo 1kg
  5052107: "Doces e Bolos", // Bolo de Rolo 250g
  3172041: "Doces e Bolos", // Bala de Doce de Leite
  3638808: "Galinha, linguiça, Pão de Queijo, Carnes e Peixes", // Galinha Caipira
  5399802: "Galinha, linguiça, Pão de Queijo, Carnes e Peixes", // Linguiça artesanal 1kg
  5127181: "Galinha, linguiça, Pão de Queijo, Carnes e Peixes", // Pão de Queijo Mineiro 900g
};

/* ---------------- Categorias ---------------- */
const categorias = cats.map((c, i) => ({ id: `cat-${slug(c.name)}`, nome: limpar(c.name), ordem: i + 1 }));
const idCategoria = new Map(cats.map((c, i) => [norm(c.name), categorias[i].id]));

/* ---------------- Produtos (sem repetidos) ---------------- */
const porNome = new Map(); // nome normalizado -> produto
const relatorio = { repetidos: [], soMaisVendidos: [], copias: [] };

const novoProduto = (item, categoria_id, destaque) => ({
  id: `prod-${item.id}`,
  categoria_id,
  nome: limpar(item.n),
  descricao: limpar(item.d),
  preco: item.p,
  preco_promocional: item.pp ?? null,
  ativo: !item.out,
  destaque,
  imagem: item.k,
});

// 1º as categorias normais (mantém a 1ª ocorrência de cada nome)
cats.forEach((c) => {
  for (const item of c.items) {
    const k = norm(item.n);
    const ja = porNome.get(k);
    if (ja) {
      ja.ativo ||= !item.out;
      relatorio.repetidos.push(`${limpar(item.n)} (também em "${limpar(c.name)}")`);
      continue;
    }
    porNome.set(k, novoProduto(item, idCategoria.get(norm(c.name)), false));
  }
});

// 2º "Mais Vendidos": vira destaque; os que só existem ali ganham categoria pela tabela
const ordemDestaque = [];
for (const item of maisVendidos.items) {
  const k = norm(item.n);
  const ja = porNome.get(k);
  if (ja) {
    ja.destaque = true;
    ja.ativo ||= !item.out;
  } else {
    const nomeCat = CATEGORIA_DOS_MAIS_VENDIDOS[item.id];
    if (!nomeCat) throw new Error(`Sem categoria definida para "${item.n}" (${item.id}).`);
    const catId = idCategoria.get(norm(nomeCat));
    if (!catId) throw new Error(`Categoria "${nomeCat}" não existe.`);
    porNome.set(k, novoProduto(item, catId, true));
    relatorio.soMaisVendidos.push(`${limpar(item.n)} → ${nomeCat}`);
  }
  ordemDestaque.push(k);
}

// Ordem final: os mais vendidos primeiro (na ordem da vitrine), depois o resto na ordem das categorias
const vistos = new Set(ordemDestaque);
const lista = [...ordemDestaque.map((k) => porNome.get(k)), ...[...porNome.entries()].filter(([k]) => !vistos.has(k)).map(([, p]) => p)];
lista.forEach((p) => p.nome.includes("(Cópia)") && relatorio.copias.push(p.nome));

/* ---------------- Fotos ---------------- */
const pastaFotos = path.join(RAIZ, "public", "produtos");
fs.mkdirSync(pastaFotos, { recursive: true });
const salvarDataUrl = (dataUrl, destino) => {
  const m = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error(`Imagem inválida para ${destino}`);
  fs.writeFileSync(destino, Buffer.from(m[2], "base64"));
  return m[1];
};
let bytes = 0;
const produtos = lista.map(({ imagem, ...p }) => {
  if (!IMG[imagem]) return { ...p, imagem_url: null };
  const ext = salvarDataUrl(IMG[imagem], path.join(pastaFotos, `${imagem}.webp`));
  if (ext !== "webp") throw new Error(`Foto ${imagem} não é webp (${ext}).`);
  bytes += fs.statSync(path.join(pastaFotos, `${imagem}.webp`)).size;
  return { ...p, imagem_url: `/produtos/${imagem}.webp` };
});
salvarDataUrl(DATA.logo, path.join(RAIZ, "public", "logo-budega.webp"));

/* ---------------- Loja ---------------- */
const s = DATA.store;
const dig = s.phone_number.replace(/\D/g, ""); // 87981608255
const telefone = `(${dig.slice(0, 2)}) ${dig.slice(2, 7)}-${dig.slice(7)}`;
const DIAS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const rodapeCnpj = /CNPJ\s*([\d./-]+)/.exec(linhas.join("\n"))?.[1] ?? "";

const loja = {
  nome: "Budega Luar do Sertão",
  site: "",
  descricao: limpar(s.description),
  cnpj: rodapeCnpj,
  telefone,
  whatsapp: telefone,
  email: "",
  instagram: `@${String(s.instagram).toLowerCase()}`,
  endereco: `${limpar(s.street)}, ${s.address_number}`,
  bairro: limpar(s.neighborhood),
  cidade: limpar(s.city),
  uf: String(s.state).toUpperCase(),
  cep: "",
  logo_url: "/logo-budega.webp",
  cor_marca: String(s.color).toUpperCase(),
  horarios: DIAS.map((d) => {
    const faixa = s.business_hours?.[d]?.[0];
    return faixa ? { aberto: true, abre: faixa[0], fecha: faixa[1] } : { aberto: false, abre: "08:00", fecha: "18:00" };
  }),
  pausada: false,
};

const saida = {
  _origem: "Gerado por scripts/extrair-vitrine.mjs a partir da página antiga da loja. Não editar à mão.",
  loja,
  pedido_minimo: s.minimum_order_value ?? 0,
  pagamentos: DATA.payments,
  categorias,
  produtos,
};
fs.writeFileSync(path.join(RAIZ, "src", "data", "lojaReal.json"), JSON.stringify(saida, null, 2) + "\n");

console.log(`Categorias: ${categorias.length}`);
console.log(`Produtos: ${produtos.length} (${produtos.filter((p) => p.destaque).length} em destaque, ${produtos.filter((p) => !p.ativo).length} em falta)`);
console.log(`Fotos: ${produtos.filter((p) => p.imagem_url).length} arquivos, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Repetidos juntados (${relatorio.repetidos.length}):\n  ${relatorio.repetidos.join("\n  ")}`);
console.log(`Só em "Mais Vendidos" (${relatorio.soMaisVendidos.length}):\n  ${relatorio.soMaisVendidos.join("\n  ")}`);
console.log(`Nomes com "(Cópia)": ${relatorio.copias.join(" | ") || "nenhum"}`);
