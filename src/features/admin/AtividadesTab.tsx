import { useState } from "react";
import type { Atividade } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { formatDateTime } from "@/lib/format";
import { nomeFuncionario, useAppStore } from "@/store/useAppStore";

const SISTEMA = "__sistema";
const TODOS = "__todos";

export function AtividadesTab() {
  const atividades = useAppStore((s) => s.atividades);
  const funcionarios = useAppStore((s) => s.funcionarios);
  const [busca, setBusca] = useState("");
  const [quem, setQuem] = useState(TODOS);

  const nome = (a: Atividade) => (a.funcionario_id ? nomeFuncionario(funcionarios, a.funcionario_id) : "Sistema");

  const linhas = atividades.filter(
    (a) =>
      (quem === TODOS || (quem === SISTEMA ? !a.funcionario_id : a.funcionario_id === quem)) &&
      (contem(a.descricao, busca) || contem(nome(a), busca)),
  );

  const columns: Column<Atividade>[] = [
    { key: "em", header: "Data e hora", sortValue: (a) => a.em.getTime(), render: (a) => formatDateTime(a.em) },
    { key: "quem", header: "Quem", sortValue: (a) => nome(a), render: (a) => <span className="font-semibold">{nome(a)}</span> },
    { key: "descricao", header: "O que fez", className: "min-w-[240px] whitespace-normal", render: (a) => a.descricao },
  ];

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="card-title">Registro de atividades</h2>
          <p className="card-subtitle">Ações feitas pela equipe no painel (as mais recentes primeiro).</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar atividade" className="sm:w-56" />
          <Select value={quem} onValueChange={setQuem}>
            <SelectTrigger className="sm:w-48" aria-label="Filtrar por pessoa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Toda a equipe</SelectItem>
              {funcionarios.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
              <SelectItem value={SISTEMA}>Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={linhas}
        rowKey={(a) => a.id}
        defaultSort={{ key: "em", dir: "desc" }}
        pageSize={25}
        emptyMessage="Nenhuma atividade encontrada"
      />
    </section>
  );
}
