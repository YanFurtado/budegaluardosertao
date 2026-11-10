import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Categoria } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { normalizar } from "@/components/shared/SearchInput";
import { useAppStore } from "@/store/useAppStore";
import { novoId } from "@/lib/id";

interface CategoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = nova categoria. */
  categoria: Categoria | null;
  categorias: Categoria[];
}

export function CategoriaDialog({ open, onOpenChange, categoria, categorias }: CategoriaDialogProps) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [nome, setNome] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNome(categoria?.nome ?? "");
    setAtiva(categoria?.ativa ?? true);
    setErro(null);
  }, [open, categoria]);

  const onSalvar = () => {
    const limpo = nome.trim();
    if (!limpo) return setErro("Informe o nome da categoria.");
    const repetida = categorias.some((c) => c.id !== categoria?.id && normalizar(c.nome) === normalizar(limpo));
    if (repetida) return setErro("Já existe uma categoria com esse nome.");

    const item: Categoria = {
      id: categoria?.id ?? novoId("cat"),
      nome: limpo,
      ordem: categoria?.ordem ?? categorias.reduce((m, c) => Math.max(m, c.ordem), 0) + 1,
      ativa,
    };
    salvar("categorias", item);
    registrarAtividade(`${categoria ? "Editou" : "Criou"} a categoria ${limpo}`);
    toast.success(categoria ? "Categoria atualizada" : "Categoria criada");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label="Nome *" htmlFor="cat-nome" error={erro}>
            <Input
              id="cat-nome"
              value={nome}
              maxLength={50}
              autoFocus
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSalvar()}
            />
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
            <span>
              <span className="block font-semibold">Categoria ativa</span>
              <span className="block text-[12px] text-ink-muted">Inativa, os produtos dela somem da página da loja.</span>
            </span>
            <Switch checked={ativa} onCheckedChange={setAtiva} aria-label="Categoria ativa" />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar}>{categoria ? "Salvar" : "Criar categoria"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
