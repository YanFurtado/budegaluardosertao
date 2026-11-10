import { useEffect, useMemo, useState } from "react";
import { startOfDay, subDays } from "date-fns";
import { Info, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { Entregador } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { normalizar } from "@/components/shared/SearchInput";
import { cn } from "@/lib/utils";
import { formatInteger } from "@/lib/format";
import { novoId } from "@/lib/id";
import { useAppStore } from "@/store/useAppStore";

const iconBtn =
  "flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40";

interface Linha {
  e: Entregador;
  hoje: number;
  semana: number;
}

export function EntregadoresTab() {
  const entregadores = useAppStore((s) => s.entregadores);
  const pedidos = useAppStore((s) => s.pedidos);
  const salvar = useAppStore((s) => s.salvar);
  const remover = useAppStore((s) => s.remover);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Entregador | null>(null);
  const [excluir, setExcluir] = useState<Entregador | null>(null);

  const linhas: Linha[] = useMemo(() => {
    const hoje = startOfDay(new Date());
    const semana = subDays(hoje, 6);
    return entregadores.map((e) => {
      const deles = pedidos.filter((p) => p.responsavel_entrega === e.nome && p.status !== "cancelado");
      return {
        e,
        hoje: deles.filter((p) => p.criado_em >= hoje).length,
        semana: deles.filter((p) => p.criado_em >= semana).length,
      };
    });
  }, [entregadores, pedidos]);

  const abrir = (e: Entregador | null) => {
    setEditando(e);
    setAberto(true);
  };

  const alternar = (e: Entregador) => {
    salvar("entregadores", { ...e, ativo: !e.ativo });
    registrarAtividade(`${e.ativo ? "Desativou" : "Ativou"} o entregador ${e.nome}`);
    toast.success(e.ativo ? `${e.nome} desativado` : `${e.nome} ativado`);
  };

  const columns: Column<Linha>[] = [
    {
      key: "nome",
      header: "Entregador",
      sortValue: (l) => l.e.nome,
      render: (l) => <span className={cn("font-semibold", !l.e.ativo && "text-ink-muted")}>{l.e.nome}</span>,
    },
    { key: "telefone", header: "Telefone", render: (l) => l.e.telefone || "—" },
    {
      key: "tipo",
      header: "Tipo",
      render: (l) => (l.e.tipo === "proprio" ? <Badge tom="blue">Próprio</Badge> : <Badge tom="purple">Parceiro</Badge>),
    },
    { key: "hoje", header: "Entregas hoje", align: "right", sortValue: (l) => l.hoje, render: (l) => formatInteger(l.hoje) },
    { key: "semana", header: "Últimos 7 dias", align: "right", sortValue: (l) => l.semana, render: (l) => formatInteger(l.semana) },
    {
      key: "ativo",
      header: "Ativo",
      align: "center",
      render: (l) => (
        <span className="relative inline-flex">
          <Switch checked={l.e.ativo} onCheckedChange={() => alternar(l.e)} aria-label={`${l.e.nome} ativo`} />
        </span>
      ),
    },
    {
      key: "acoes",
      header: (
        <span className="relative">
          <span className="sr-only">Ações</span>
        </span>
      ),
      align: "right",
      render: (l) => (
        <div className="flex justify-end">
          <button type="button" className={iconBtn} onClick={() => abrir(l.e)} aria-label={`Editar ${l.e.nome}`} title="Editar">
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            className={cn(iconBtn, "hover:bg-negative-soft hover:text-negative")}
            onClick={() => setExcluir(l.e)}
            aria-label={`Excluir ${l.e.nome}`}
            title="Excluir"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-start gap-1.5 text-ink-muted">
          <Info className="mt-0.5 size-4 shrink-0" />
          Os pedidos ficam ligados ao nome do entregador. Renomear não altera os pedidos antigos.
        </p>
        <Button onClick={() => abrir(null)}>
          <Plus /> Novo entregador
        </Button>
      </div>
      {linhas.length === 0 ? (
        <EmptyState icon={UserRound} message="Nenhum entregador cadastrado" />
      ) : (
        <DataTable columns={columns} rows={linhas} rowKey={(l) => l.e.id} defaultSort={{ key: "semana", dir: "desc" }} />
      )}

      <EntregadorDialog open={aberto} onOpenChange={setAberto} entregador={editando} entregadores={entregadores} />

      <ConfirmDialog
        open={!!excluir}
        onOpenChange={(o) => !o && setExcluir(null)}
        title={`Excluir ${excluir?.nome ?? "entregador"}?`}
        description="As entregas já feitas continuam no histórico com o nome dele."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (!excluir) return;
          remover("entregadores", excluir.id);
          registrarAtividade(`Excluiu o entregador ${excluir.nome}`);
          toast.success("Entregador excluído");
        }}
      />
    </div>
  );
}

function EntregadorDialog({
  open,
  onOpenChange,
  entregador,
  entregadores,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entregador: Entregador | null;
  entregadores: Entregador[];
}) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<Entregador["tipo"]>("proprio");
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNome(entregador?.nome ?? "");
    setTelefone(entregador?.telefone ?? "");
    setTipo(entregador?.tipo ?? "proprio");
    setAtivo(entregador?.ativo ?? true);
    setErro(null);
  }, [open, entregador]);

  const onSalvar = () => {
    const limpo = nome.trim();
    if (!limpo) return setErro("Informe o nome.");
    if (entregadores.some((e) => e.id !== entregador?.id && normalizar(e.nome) === normalizar(limpo)))
      return setErro("Já existe um entregador com esse nome.");
    salvar("entregadores", { id: entregador?.id ?? novoId("ent"), nome: limpo, telefone: telefone.trim(), tipo, ativo });
    registrarAtividade(`${entregador ? "Editou" : "Cadastrou"} o entregador ${limpo}`);
    toast.success(entregador ? "Entregador atualizado" : "Entregador cadastrado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{entregador ? "Editar entregador" : "Novo entregador"}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field
            label="Nome *"
            htmlFor="ent-nome"
            error={erro}
            hint={entregador ? "Pedidos antigos continuam com o nome anterior." : undefined}
          >
            <Input id="ent-nome" value={nome} maxLength={60} autoFocus onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Telefone" htmlFor="ent-tel">
            <Input id="ent-tel" type="tel" placeholder="(87) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <Select value={tipo} onValueChange={(v) => setTipo(v as Entregador["tipo"])}>
              <SelectTrigger aria-label="Tipo de entregador">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proprio">Próprio (equipe da loja)</SelectItem>
                <SelectItem value="parceiro">Parceiro (empresa terceirizada)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
            <span className="font-semibold">Disponível para entregas</span>
            <Switch checked={ativo} onCheckedChange={setAtivo} aria-label="Disponível para entregas" />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar}>{entregador ? "Salvar" : "Cadastrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
