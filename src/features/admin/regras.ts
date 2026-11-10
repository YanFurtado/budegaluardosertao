import type { Cargo, Funcionario } from "@/types";
import type { Tom } from "@/lib/pedidos";

/** Administradores ativos — a loja precisa manter pelo menos um. */
export const adminsAtivos = (funcionarios: Funcionario[]) =>
  funcionarios.filter((f) => f.ativo && f.cargo === "administrador");

/** É o único administrador ativo? (não pode ser desativado, excluído, rebaixado nem perder "equipe"). */
export function ehUltimoAdmin(f: Funcionario | null | undefined, funcionarios: Funcionario[]) {
  if (!f) return false;
  const admins = adminsAtivos(funcionarios);
  return admins.length === 1 && admins[0].id === f.id;
}

export const TOM_CARGO: Record<Cargo, Tom> = {
  administrador: "purple",
  gerente: "blue",
  atendente: "teal",
  cozinha: "orange",
};
