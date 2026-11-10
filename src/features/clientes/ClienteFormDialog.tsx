import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { CurrencyInput, Field, Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { novoId } from "@/lib/id";
import { round2 } from "@/lib/pedidos";
import { useAppStore } from "@/store/useAppStore";
import type { Cliente } from "@/types";
import { mascaraTelefone, soDigitos, telefoneValido } from "./telefone";

const NENHUM = "__nenhum__";
const OUTRO = "__outro__";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Cliente a editar; null/undefined = novo cliente. */
  cliente?: Cliente | null;
  onSaved?: (c: Cliente) => void;
}

export function ClienteFormDialog({ open, onOpenChange, cliente, onSaved }: ClienteFormDialogProps) {
  const zonas = useAppStore((s) => s.zonas);
  const clientes = useAppStore((s) => s.clientes);
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairroSel, setBairroSel] = useState(NENHUM);
  const [bairroOutro, setBairroOutro] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [limite, setLimite] = useState<number | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const naZona = cliente?.bairro && zonas.some((z) => z.bairro === cliente.bairro);
    setNome(cliente?.nome ?? "");
    setTelefone(cliente?.telefone ?? "");
    setEmail(cliente?.email ?? "");
    setEndereco(cliente?.endereco ?? "");
    setBairroSel(!cliente?.bairro ? NENHUM : naZona ? cliente.bairro : OUTRO);
    setBairroOutro(cliente?.bairro && !naZona ? cliente.bairro : "");
    setObservacoes(cliente?.observacoes ?? "");
    setLimite(cliente && cliente.limite_fiado > 0 ? cliente.limite_fiado : null);
    setErros({});
  }, [open, cliente, zonas]);

  /** Some o erro do campo assim que ele é editado. */
  const editar = (campo: string, set: (v: string) => void) => (v: string) => {
    set(v);
    if (erros[campo]) setErros(({ [campo]: _, ...resto }) => resto);
  };

  const digitos = soDigitos(telefone);
  const duplicado =
    digitos.length >= 10 ? clientes.find((c) => c.id !== cliente?.id && soDigitos(c.telefone) === digitos) : undefined;

  const salvarCliente = () => {
    const e: Record<string, string> = {};
    if (nome.trim().length < 3) e.nome = "Informe o nome do cliente.";
    if (!telefoneValido(telefone)) e.telefone = "Telefone com DDD, ex.: (87) 99999-9999.";
    if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = "E-mail inválido.";
    if (bairroSel === OUTRO && !bairroOutro.trim()) e.bairro = "Informe o bairro.";
    setErros(e);
    if (Object.keys(e).length) return;

    const bairro = bairroSel === NENHUM ? null : bairroSel === OUTRO ? bairroOutro.trim() : bairroSel;
    const salvo: Cliente = {
      id: cliente?.id ?? novoId("cli"),
      nome: nome.trim(),
      telefone: mascaraTelefone(telefone),
      email: email.trim() || null,
      endereco: endereco.trim() || null,
      bairro,
      observacoes: observacoes.trim() || null,
      limite_fiado: round2(limite ?? 0),
      criado_em: cliente?.criado_em ?? new Date(),
    };
    salvar("clientes", salvo);
    registrarAtividade(cliente ? `Editou o cliente ${salvo.nome}` : `Cadastrou o cliente ${salvo.nome}`);
    toast.success(cliente ? "Cliente atualizado" : "Cliente cadastrado", { description: salvo.nome });
    onOpenChange(false);
    onSaved?.(salvo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="form-cliente"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              salvarCliente();
            }}
          >
            <Field label="Nome *" htmlFor="cli-nome" error={erros.nome} className="sm:col-span-2">
              <Input id="cli-nome" value={nome} onChange={(e) => editar("nome", setNome)(e.target.value)} maxLength={80} autoFocus />
            </Field>
            <Field
              label="Telefone *"
              htmlFor="cli-tel"
              error={erros.telefone}
              hint={duplicado ? <span className="text-[#A85B12]">Atenção: {duplicado.nome} já usa este telefone.</span> : undefined}
            >
              <Input
                id="cli-tel"
                inputMode="tel"
                placeholder="(87) 99999-9999"
                value={telefone}
                onChange={(e) => editar("telefone", setTelefone)(mascaraTelefone(e.target.value))}
              />
            </Field>
            <Field label="E-mail" htmlFor="cli-email" error={erros.email}>
              <Input id="cli-email" type="email" value={email} onChange={(e) => editar("email", setEmail)(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Endereço" htmlFor="cli-end" className="sm:col-span-2">
              <Input
                id="cli-end"
                placeholder="Rua, número, complemento"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label="Bairro" error={erros.bairro}>
              <Select value={bairroSel} onValueChange={setBairroSel}>
                <SelectTrigger aria-label="Bairro">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NENHUM}>Não informado</SelectItem>
                  {zonas.map((z) => (
                    <SelectItem key={z.id} value={z.bairro}>
                      {z.bairro}
                      {!z.ativa ? " (sem entrega)" : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value={OUTRO}>Outro bairro…</SelectItem>
                </SelectContent>
              </Select>
              {bairroSel === OUTRO && (
                <Input
                  aria-label="Nome do bairro"
                  placeholder="Nome do bairro"
                  value={bairroOutro}
                  onChange={(e) => editar("bairro", setBairroOutro)(e.target.value)}
                  maxLength={60}
                />
              )}
            </Field>
            <Field label="Limite de fiado" htmlFor="cli-limite" hint="Deixe vazio para não liberar compras fiado.">
              <CurrencyInput id="cli-limite" value={limite} onChange={setLimite} />
            </Field>
            <Field label="Observações" htmlFor="cli-obs" className="sm:col-span-2">
              <Textarea
                id="cli-obs"
                rows={2}
                placeholder="Ex.: prefere sem cebola, ponto de referência…"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                maxLength={300}
              />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cliente">
            {cliente ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
