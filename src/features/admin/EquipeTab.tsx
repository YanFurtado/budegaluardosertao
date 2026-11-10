import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import type { Funcionario } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { iniciais } from "@/lib/loja";
import { labelCargo, PERMISSOES } from "@/lib/permissoes";
import { useAppStore } from "@/store/useAppStore";
import { FuncionarioDialog } from "./FuncionarioDialog";
import { ehUltimoAdmin, TOM_CARGO } from "./regras";

const iconBtn =
  "flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-gray-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export function EquipeTab() {
  const funcionarios = useAppStore((s) => s.funcionarios);
  const usuarioLogadoId = useAppStore((s) => s.usuarioLogadoId);
  const remover = useAppStore((s) => s.remover);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);

  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [excluir, setExcluir] = useState<Funcionario | null>(null);
  const [confirmAberto, setConfirmAberto] = useState(false);

  const abrir = (f: Funcionario | null) => {
    setEditando(f);
    setDialogAberto(true);
  };

  const motivoBloqueioExclusao = (f: Funcionario) =>
    f.id === usuarioLogadoId
      ? "Você não pode excluir o próprio usuário"
      : ehUltimoAdmin(f, funcionarios)
        ? "É o único administrador ativo"
        : null;

  const linhas = funcionarios.filter((f) => contem(f.nome, busca) || contem(f.email, busca));
  const total = PERMISSOES.length;

  const columns: Column<Funcionario>[] = [
    {
      key: "nome",
      header: "Nome",
      sortValue: (f) => f.nome,
      render: (f) => (
        <span className="inline-flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chart-primary/15 text-[11px] font-bold text-primary">
            {iniciais(f.nome)}
          </span>
          <span className="font-semibold">{f.nome}</span>
          {f.id === usuarioLogadoId && <Badge tom="blue">você</Badge>}
        </span>
      ),
    },
    { key: "email", header: "E-mail", sortValue: (f) => f.email, render: (f) => <span className="text-ink-muted">{f.email}</span> },
    { key: "cargo", header: "Cargo", sortValue: (f) => labelCargo(f.cargo), render: (f) => <Badge tom={TOM_CARGO[f.cargo]}>{labelCargo(f.cargo)}</Badge> },
    {
      key: "permissoes",
      header: "Permissões",
      align: "right",
      sortValue: (f) => f.permissoes.length,
      render: (f) => (
        <span title={f.permissoes.map((p) => PERMISSOES.find((x) => x.value === p)?.label).join(", ")}>
          {f.permissoes.length} de {total}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (f) => (f.ativo ? 0 : 1),
      render: (f) => <Badge tom={f.ativo ? "green" : "gray"}>{f.ativo ? "Ativo" : "Inativo"}</Badge>,
    },
    {
      key: "acoes",
      // `relative` mantém o texto escondido dentro da área rolável da tabela (senão ele alarga a página no celular).
      header: (
        <span className="relative">
          <span className="sr-only">Ações</span>
        </span>
      ),
      align: "right",
      render: (f) => {
        const bloqueio = motivoBloqueioExclusao(f);
        return (
          <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={iconBtn} onClick={() => abrir(f)} aria-label={`Editar ${f.nome}`} title="Editar">
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              className={iconBtn}
              disabled={!!bloqueio}
              onClick={() => {
                setExcluir(f);
                setConfirmAberto(true);
              }}
              aria-label={`Excluir ${f.nome}`}
              title={bloqueio ?? "Excluir"}
            >
              <Trash2 className="size-4" />
            </button>
          </span>
        );
      },
    },
  ];

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="card-title">Equipe</h2>
          <p className="card-subtitle">
            {funcionarios.filter((f) => f.ativo).length} ativos de {funcionarios.length}. Cada pessoa só vê as áreas permitidas.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou e-mail" className="sm:w-64" />
          <Button onClick={() => abrir(null)}>
            <UserPlus /> Novo usuário
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={linhas}
        rowKey={(f) => f.id}
        onRowClick={abrir}
        defaultSort={{ key: "nome", dir: "asc" }}
        emptyMessage="Ninguém encontrado"
      />

      <FuncionarioDialog open={dialogAberto} onOpenChange={setDialogAberto} funcionario={editando} />

      <ConfirmDialog
        open={confirmAberto}
        onOpenChange={setConfirmAberto}
        title={excluir ? `Excluir ${excluir.nome}?` : ""}
        description="A pessoa perde o acesso ao painel. Os pedidos atendidos por ela continuam no histórico. Se ela só se afastou, prefira desativar o usuário."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (!excluir || motivoBloqueioExclusao(excluir)) return;
          remover("funcionarios", excluir.id);
          registrarAtividade(`Removeu ${excluir.nome} da equipe`);
          toast.success("Usuário excluído");
        }}
      />
    </section>
  );
}
