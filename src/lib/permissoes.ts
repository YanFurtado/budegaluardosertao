import type { Cargo, Permissao } from "@/types";

export const PERMISSOES: { value: Permissao; label: string; descricao: string }[] = [
  { value: "pedidos", label: "Pedidos", descricao: "Gestão e histórico de pedidos" },
  { value: "caixa", label: "Caixa", descricao: "Abrir, movimentar e fechar o caixa" },
  { value: "desempenho", label: "Desempenho", descricao: "Análise das vendas" },
  { value: "catalogo", label: "Catálogo", descricao: "Produtos e categorias" },
  { value: "clientes", label: "Clientes", descricao: "Clientes e avaliações" },
  { value: "fiado", label: "Fiado", descricao: "Contas a prazo dos clientes" },
  { value: "marketing", label: "Marketing", descricao: "Cupons e descontos" },
  { value: "configuracoes", label: "Configurações", descricao: "Empresa, delivery, apps e ajustes" },
  { value: "equipe", label: "Equipe", descricao: "Usuários e permissões (Administrativo)" },
];

export const CARGOS: { value: Cargo; label: string; permissoesPadrao: Permissao[] }[] = [
  { value: "administrador", label: "Administrador", permissoesPadrao: PERMISSOES.map((p) => p.value) },
  {
    value: "gerente",
    label: "Gerente",
    permissoesPadrao: ["pedidos", "caixa", "desempenho", "catalogo", "clientes", "fiado", "marketing"],
  },
  { value: "atendente", label: "Atendente", permissoesPadrao: ["pedidos", "caixa", "clientes"] },
  { value: "cozinha", label: "Cozinha", permissoesPadrao: ["pedidos"] },
];

export const labelCargo = (c: Cargo) => CARGOS.find((x) => x.value === c)?.label ?? c;
