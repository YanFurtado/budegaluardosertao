import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Cargo, Funcionario, Permissao } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CARGOS, PERMISSOES } from "@/lib/permissoes";
import { novoId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { emailValido, mascaraTelefone } from "@/features/empresa/mascaras";
import { ehUltimoAdmin } from "./regras";

interface FuncionarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = novo usuário. */
  funcionario: Funcionario | null;
}

interface Form {
  nome: string;
  email: string;
  telefone: string;
  cargo: Cargo;
  permissoes: Permissao[];
  ativo: boolean;
}

const vazio: Form = {
  nome: "",
  email: "",
  telefone: "",
  cargo: "atendente",
  permissoes: [...CARGOS.find((c) => c.value === "atendente")!.permissoesPadrao],
  ativo: true,
};

export function FuncionarioDialog({ open, onOpenChange, funcionario }: FuncionarioDialogProps) {
  const funcionarios = useAppStore((s) => s.funcionarios);
  const usuarioLogadoId = useAppStore((s) => s.usuarioLogadoId);
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);

  const [form, setForm] = useState<Form>(vazio);
  const [erros, setErros] = useState<Partial<Record<keyof Form, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErros({});
    setForm(
      funcionario
        ? {
            nome: funcionario.nome,
            email: funcionario.email,
            telefone: funcionario.telefone,
            cargo: funcionario.cargo,
            permissoes: [...funcionario.permissoes],
            ativo: funcionario.ativo,
          }
        : { ...vazio, permissoes: [...vazio.permissoes] },
    );
  }, [open, funcionario]);

  const ehVoce = !!funcionario && funcionario.id === usuarioLogadoId;
  const ultimoAdmin = ehUltimoAdmin(funcionario, funcionarios);
  const travaEquipe = ultimoAdmin || ehVoce;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined }));
  };

  const mudarCargo = (cargo: Cargo) => {
    const padrao = [...CARGOS.find((c) => c.value === cargo)!.permissoesPadrao];
    // Quem não pode perder "equipe" continua com ela.
    if (travaEquipe && !padrao.includes("equipe")) padrao.push("equipe");
    setForm((f) => ({ ...f, cargo, permissoes: padrao }));
  };

  const alternarPermissao = (p: Permissao) =>
    setForm((f) => ({
      ...f,
      permissoes: f.permissoes.includes(p) ? f.permissoes.filter((x) => x !== p) : [...f.permissoes, p],
    }));

  const enviar = () => {
    const e: typeof erros = {};
    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    if (!nome) e.nome = "Informe o nome.";
    if (!email) e.email = "Informe o e-mail (usado para entrar).";
    else if (!emailValido(email)) e.email = "E-mail inválido.";
    else if (funcionarios.some((f) => f.id !== funcionario?.id && f.email.toLowerCase() === email))
      e.email = "Já existe alguém da equipe com esse e-mail.";
    if (form.permissoes.length === 0) e.permissoes = "Marque pelo menos uma permissão.";
    setErros(e);
    if (Object.keys(e).length) return;

    // Ordem das permissões igual à lista oficial
    const permissoes = PERMISSOES.map((p) => p.value).filter((p) => form.permissoes.includes(p));
    const item: Funcionario = funcionario
      ? { ...funcionario, nome, email, telefone: form.telefone, cargo: form.cargo, permissoes, ativo: form.ativo }
      : {
          id: novoId("func"),
          nome,
          email,
          telefone: form.telefone,
          cargo: form.cargo,
          permissoes,
          ativo: form.ativo,
          criado_em: new Date(),
        };
    salvar("funcionarios", item);
    registrarAtividade(funcionario ? `Editou o usuário ${nome}` : `Adicionou ${nome} à equipe`);
    toast.success(funcionario ? "Usuário atualizado" : "Usuário adicionado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{funcionario ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {funcionario ? "Altere dados, cargo e o que a pessoa pode acessar." : "A pessoa entra no painel com o e-mail cadastrado."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome *" htmlFor="func-nome" error={erros.nome}>
              <Input id="func-nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} maxLength={60} autoFocus />
            </Field>
            <Field label="E-mail *" htmlFor="func-email" error={erros.email}>
              <Input id="func-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Telefone" htmlFor="func-tel">
              <Input
                id="func-tel"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => set("telefone", mascaraTelefone(e.target.value))}
              />
            </Field>
            <Field
              label="Cargo"
              hint={ultimoAdmin ? "É o único administrador ativo: o cargo não pode mudar." : "Trocar o cargo aplica as permissões padrão dele."}
            >
              <Select value={form.cargo} onValueChange={(v) => mudarCargo(v as Cargo)} disabled={ultimoAdmin}>
                <SelectTrigger aria-label="Cargo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-[12px] font-semibold">Permissões</legend>
            <div className="grid gap-1 rounded-md border border-line p-1 sm:grid-cols-2">
              {PERMISSOES.map((p) => {
                const travada = p.value === "equipe" && travaEquipe;
                return (
                  <label
                    key={p.value}
                    className={cn(
                      "flex items-start gap-2.5 rounded px-2 py-2",
                      travada ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50",
                    )}
                    title={travada ? (ultimoAdmin ? "O último administrador precisa manter esta permissão" : "Você não pode remover o próprio acesso à equipe") : undefined}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-[#2F7DBF]"
                      checked={form.permissoes.includes(p.value)}
                      disabled={travada}
                      onChange={() => alternarPermissao(p.value)}
                    />
                    <span>
                      <span className="block font-semibold">{p.label}</span>
                      <span className="block text-[12px] text-ink-muted">{p.descricao}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {erros.permissoes && <p className="mt-1 text-[12px] text-negative">{erros.permissoes}</p>}
          </fieldset>

          <label className="flex items-center gap-3 rounded-md border border-line p-3">
            <Switch
              checked={form.ativo}
              onCheckedChange={(v) => set("ativo", v)}
              disabled={(ehVoce || ultimoAdmin) && form.ativo}
              aria-label="Usuário ativo"
            />
            <span>
              <span className="block font-semibold">{form.ativo ? "Ativo" : "Inativo"}</span>
              <span className="block text-[12px] text-ink-muted">
                {ehVoce
                  ? "Você não pode desativar o próprio usuário."
                  : ultimoAdmin
                    ? "É o único administrador ativo e não pode ser desativado."
                    : "Usuários inativos não conseguem entrar no painel."}
              </span>
            </span>
          </label>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={enviar}>{funcionario ? "Salvar alterações" : "Adicionar usuário"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
