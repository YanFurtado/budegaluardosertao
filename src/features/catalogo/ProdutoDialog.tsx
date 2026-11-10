import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUp, ShoppingBasket, Trash2 } from "lucide-react";
import type { Categoria, Produto } from "@/types";
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
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useAppStore";
import { novoId } from "@/lib/id";
import { round2 } from "@/lib/pedidos";
import { comprimirImagem } from "@/lib/imagem";

interface ProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = novo produto. */
  produto: Produto | null;
  categorias: Categoria[];
  /** Categoria pré-selecionada ao criar. */
  categoriaInicial?: string;
}

interface Form {
  nome: string;
  categoria_id: string;
  descricao: string;
  preco: number | null;
  preco_promocional: number | null;
  destaque: boolean;
  ativo: boolean;
  imagem_url: string | null;
}

type Erros = Partial<Record<keyof Form, string>>;

export function ProdutoDialog({ open, onOpenChange, produto, categorias, categoriaInicial }: ProdutoDialogProps) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const [form, setForm] = useState<Form>(vazio(categoriaInicial ?? categorias[0]?.id ?? ""));
  const [erros, setErros] = useState<Erros>({});
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErros({});
    setForm(
      produto
        ? {
            nome: produto.nome,
            categoria_id: produto.categoria_id,
            descricao: produto.descricao,
            preco: produto.preco,
            preco_promocional: produto.preco_promocional,
            destaque: produto.destaque,
            ativo: produto.ativo,
            imagem_url: produto.imagem_url,
          }
        : vazio(categoriaInicial ?? categorias[0]?.id ?? ""),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, produto]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const escolherFoto = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setErros((e) => ({ ...e, imagem_url: undefined }));
    setEnviandoFoto(true);
    try {
      set("imagem_url", await comprimirImagem(arquivo, 480));
    } catch (err) {
      setErros((e) => ({ ...e, imagem_url: err instanceof Error ? err.message : "Não foi possível ler a imagem." }));
    } finally {
      setEnviandoFoto(false);
    }
  };

  const validar = (): Erros => {
    const e: Erros = {};
    if (!form.nome.trim()) e.nome = "Informe o nome do produto.";
    if (!form.categoria_id) e.categoria_id = "Escolha uma categoria.";
    if (form.preco === null || form.preco <= 0) e.preco = "Informe um preço maior que zero.";
    if (form.preco_promocional !== null) {
      if (form.preco_promocional <= 0) e.preco_promocional = "O preço promocional precisa ser maior que zero.";
      else if (form.preco !== null && form.preco_promocional >= form.preco)
        e.preco_promocional = "O preço promocional precisa ser menor que o preço normal.";
    }
    return e;
  };

  const onSalvar = () => {
    const e = validar();
    setErros(e);
    if (Object.keys(e).length) return;

    const item: Produto = {
      id: produto?.id ?? novoId("prod"),
      criado_em: produto?.criado_em ?? new Date(),
      nome: form.nome.trim(),
      categoria_id: form.categoria_id,
      descricao: form.descricao.trim(),
      preco: round2(form.preco!),
      preco_promocional: form.preco_promocional === null ? null : round2(form.preco_promocional),
      destaque: form.destaque,
      ativo: form.ativo,
      imagem_url: form.imagem_url,
    };
    salvar("produtos", item);
    registrarAtividade(`${produto ? "Editou" : "Criou"} o produto ${item.nome}`);
    toast.success(produto ? "Produto atualizado" : "Produto criado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>Os campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label="Nome *" htmlFor="prod-nome" error={erros.nome}>
            <Input id="prod-nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} maxLength={80} autoFocus />
          </Field>

          <Field label="Categoria *" error={erros.categoria_id}>
            <Select value={form.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
              <SelectTrigger aria-label="Categoria">
                <SelectValue placeholder="Escolha a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                    {!c.ativa && " (inativa)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Foto" error={erros.imagem_url}>
            <div className="flex items-center gap-3">
              <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-gray-50 text-ink-muted">
                {form.imagem_url ? (
                  <img src={form.imagem_url} alt="Foto do produto" className="size-full object-cover" />
                ) : (
                  <ShoppingBasket className="size-7 opacity-50" aria-label="Sem foto" />
                )}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled={enviandoFoto} onClick={() => fotoRef.current?.click()}>
                    <ImageUp /> {enviandoFoto ? "Preparando…" : form.imagem_url ? "Trocar foto" : "Enviar foto"}
                  </Button>
                  {form.imagem_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-negative hover:bg-negative-soft"
                      onClick={() => set("imagem_url", null)}
                    >
                      <Trash2 /> Remover
                    </Button>
                  )}
                </div>
                <p className="text-[12px] text-ink-muted">Foto quadrada fica melhor. Ela é reduzida automaticamente.</p>
              </div>
              <input
                ref={fotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Escolher foto do produto"
                onChange={(e) => {
                  void escolherFoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </Field>

          <Field label="Descrição" htmlFor="prod-desc" hint="Aparece na página da loja, abaixo do nome.">
            <Textarea
              id="prod-desc"
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              maxLength={400}
              rows={3}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço *" error={erros.preco}>
              <CurrencyInput value={form.preco} onChange={(v) => set("preco", v)} aria-label="Preço" />
            </Field>
            <Field label="Preço promocional" error={erros.preco_promocional} hint="Deixe vazio se não houver promoção.">
              <CurrencyInput
                value={form.preco_promocional}
                onChange={(v) => set("preco_promocional", v)}
                placeholder="Sem promoção"
                aria-label="Preço promocional"
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-line p-3">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Disponível para venda</span>
                <span className="block text-[12px] text-ink-muted">Desligado, aparece como "Em falta" na página da loja.</span>
              </span>
              <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} aria-label="Disponível para venda" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Destaque</span>
                <span className="block text-[12px] text-ink-muted">Aparece em "Mais Vendidos", no topo da página da loja.</span>
              </span>
              <Switch checked={form.destaque} onCheckedChange={(v) => set("destaque", v)} aria-label="Destaque" />
            </label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={enviandoFoto}>{produto ? "Salvar alterações" : "Criar produto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function vazio(categoria_id: string): Form {
  return {
    nome: "",
    categoria_id,
    descricao: "",
    preco: null,
    preco_promocional: null,
    destaque: false,
    ativo: true,
    imagem_url: null,
  };
}
