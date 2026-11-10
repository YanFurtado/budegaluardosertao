import { useMemo, useState } from "react";
import { BadgePercent, FolderTree, PauseCircle, Plus, Settings2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Categoria, Produto } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardHeader } from "@/components/shared/CardHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput, contem } from "@/components/shared/SearchInput";
import { StatCard } from "@/components/shared/StatCard";
import { cn } from "@/lib/utils";
import { formatInteger } from "@/lib/format";
import { novoId } from "@/lib/id";
import { useAppStore } from "@/store/useAppStore";
import { CategoriaDialog } from "@/features/catalogo/CategoriaDialog";
import { CategoriasLista, TODAS } from "@/features/catalogo/CategoriasLista";
import { ProdutoDialog } from "@/features/catalogo/ProdutoDialog";
import { ProdutoLinha } from "@/features/catalogo/ProdutoLinha";

export default function CatalogoPage() {
  const categoriasRaw = useAppStore((s) => s.categorias);
  const produtos = useAppStore((s) => s.produtos);
  const salvar = useAppStore((s) => s.salvar);
  const remover = useAppStore((s) => s.remover);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);

  const categorias = useMemo(() => [...categoriasRaw].sort((a, b) => a.ordem - b.ordem), [categoriasRaw]);
  const [selecionada, setSelecionada] = useState<string>(TODAS);
  const [busca, setBusca] = useState("");

  // Diálogos
  const [produtoAberto, setProdutoAberto] = useState(false);
  const [produtoEdit, setProdutoEdit] = useState<Produto | null>(null);
  const [categoriaAberta, setCategoriaAberta] = useState(false);
  const [categoriaEdit, setCategoriaEdit] = useState<Categoria | null>(null);
  const [gerenciarAberto, setGerenciarAberto] = useState(false);
  const [excluirProduto, setExcluirProduto] = useState<Produto | null>(null);
  const [excluirCategoria, setExcluirCategoria] = useState<Categoria | null>(null);

  const contagem = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of produtos) m.set(p.categoria_id, (m.get(p.categoria_id) ?? 0) + 1);
    return m;
  }, [produtos]);

  const indiceCategoria = (id: string) => categorias.findIndex((c) => c.id === id);
  const nomeCategoria = (id: string) => categorias.find((c) => c.id === id)?.nome ?? "Sem categoria";

  const buscando = busca.trim().length > 0;
  const lista = useMemo(() => {
    const base = buscando
      ? produtos.filter((p) => contem(p.nome, busca) || contem(p.descricao, busca))
      : selecionada === TODAS
        ? produtos
        : produtos.filter((p) => p.categoria_id === selecionada);
    return [...base].sort(
      (a, b) =>
        indiceCategoria(a.categoria_id) - indiceCategoria(b.categoria_id) || a.nome.localeCompare(b.nome, "pt-BR"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos, busca, buscando, selecionada, categorias]);

  const stats = {
    produtos: produtos.length,
    pausados: produtos.filter((p) => !p.ativo).length,
    promocao: produtos.filter((p) => p.preco_promocional !== null).length,
    categorias: categorias.length,
  };

  const categoriaAtual = categorias.find((c) => c.id === selecionada);
  const tituloLista = buscando ? `Resultados para "${busca.trim()}"` : (categoriaAtual?.nome ?? "Todos os produtos");
  const mostrarCategoria = buscando || selecionada === TODAS;

  /* ---------------- Ações ---------------- */

  const novoProduto = () => {
    if (!categorias.length) {
      toast.error("Crie uma categoria antes de cadastrar produtos.");
      return;
    }
    setProdutoEdit(null);
    setProdutoAberto(true);
  };

  const alternarProduto = (p: Produto) => {
    salvar("produtos", { ...p, ativo: !p.ativo });
    registrarAtividade(`${p.ativo ? "Pausou" : "Reativou"} o produto ${p.nome}`);
    toast.success(p.ativo ? `${p.nome} pausado` : `${p.nome} disponível novamente`);
  };

  const duplicar = (p: Produto) => {
    const copia: Produto = { ...p, id: novoId("prod"), nome: `${p.nome} (cópia)`, criado_em: new Date() };
    salvar("produtos", copia);
    registrarAtividade(`Duplicou o produto ${p.nome}`);
    toast.success("Produto duplicado", {
      action: {
        label: "Editar",
        onClick: () => {
          setProdutoEdit(copia);
          setProdutoAberto(true);
        },
      },
    });
  };

  const pedirExclusaoCategoria = (c: Categoria) => {
    const qtd = contagem.get(c.id) ?? 0;
    if (qtd > 0) {
      toast.error(`Não dá para excluir "${c.nome}"`, {
        description: `Ela tem ${qtd} ${qtd === 1 ? "produto" : "produtos"}. Mova ou exclua os produtos antes.`,
      });
      return;
    }
    setExcluirCategoria(c);
  };

  const listaCategorias = (
    <CategoriasLista
      categorias={categorias}
      contagem={contagem}
      total={produtos.length}
      selecionada={selecionada}
      onSelecionar={(id) => {
        setSelecionada(id);
        setBusca("");
        setGerenciarAberto(false);
      }}
      onNova={() => {
        setCategoriaEdit(null);
        setCategoriaAberta(true);
      }}
      onEditar={(c) => {
        setCategoriaEdit(c);
        setCategoriaAberta(true);
      }}
      onExcluir={pedirExclusaoCategoria}
    />
  );

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Produtos" value={formatInteger(stats.produtos)} icon={ShoppingBag} tom="blue" />
        <StatCard label="Pausados" value={formatInteger(stats.pausados)} icon={PauseCircle} tom="gray" />
        <StatCard label="Em promoção" value={formatInteger(stats.promocao)} icon={BadgePercent} tom="green" />
        <StatCard label="Categorias" value={formatInteger(stats.categorias)} icon={FolderTree} tom="orange" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[260px_1fr]">
        {/* Categorias (desktop) */}
        <section className="card hidden p-3 lg:block" aria-label="Categorias">
          <p className="card-title px-2 pb-2 pt-1">Categorias</p>
          {listaCategorias}
        </section>

        {/* Produtos */}
        <section className="card min-w-0 overflow-hidden">
          <div className="border-b border-line p-4 sm:p-5">
            <CardHeader
              title={tituloLista}
              subtitle={
                buscando
                  ? `${lista.length} ${lista.length === 1 ? "produto encontrado" : "produtos encontrados"} em todo o catálogo`
                  : categoriaAtual && !categoriaAtual.ativa
                    ? "Categoria inativa: estes produtos não aparecem na página da loja."
                    : `${lista.length} ${lista.length === 1 ? "produto" : "produtos"}`
              }
              actions={
                <Button onClick={novoProduto}>
                  <Plus /> Novo produto
                </Button>
              }
            />

            {/* Categorias (mobile): chips roláveis */}
            <div className="-mx-4 mb-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:hidden">
              {[{ id: TODAS, nome: "Todos", ativa: true }, ...categorias].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelecionada(c.id);
                    setBusca("");
                  }}
                  aria-pressed={selecionada === c.id && !buscando}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    selecionada === c.id && !buscando
                      ? "border-primary bg-chart-primary/10 text-primary"
                      : "border-line bg-white text-ink hover:bg-gray-50",
                    !c.ativa && "text-ink-muted",
                  )}
                >
                  {c.nome}
                  <span className="ml-1 font-normal text-ink-muted">
                    {c.id === TODAS ? produtos.length : (contagem.get(c.id) ?? 0)}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setGerenciarAberto(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
              >
                <Settings2 className="size-3.5" /> Categorias
              </button>
            </div>

            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar produto em todo o catálogo" />
          </div>

          {lista.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                message={buscando ? "Nenhum produto encontrado" : "Nenhum produto nesta categoria"}
                action={
                  !buscando && (
                    <Button variant="outline" size="sm" onClick={novoProduto}>
                      <Plus /> Novo produto
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lista.map((p) => (
                <ProdutoLinha
                  key={p.id}
                  produto={p}
                  corIndice={indiceCategoria(p.categoria_id)}
                  categoriaNome={mostrarCategoria ? nomeCategoria(p.categoria_id) : undefined}
                  onAlternar={() => alternarProduto(p)}
                  onEditar={() => {
                    setProdutoEdit(p);
                    setProdutoAberto(true);
                  }}
                  onDuplicar={() => duplicar(p)}
                  onExcluir={() => setExcluirProduto(p)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Gerenciar categorias (mobile) */}
      <Dialog open={gerenciarAberto} onOpenChange={setGerenciarAberto}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Categorias</DialogTitle>
          </DialogHeader>
          <DialogBody>{listaCategorias}</DialogBody>
        </DialogContent>
      </Dialog>

      <ProdutoDialog
        open={produtoAberto}
        onOpenChange={setProdutoAberto}
        produto={produtoEdit}
        categorias={categorias}
        categoriaInicial={selecionada !== TODAS ? selecionada : undefined}
      />

      <CategoriaDialog
        open={categoriaAberta}
        onOpenChange={setCategoriaAberta}
        categoria={categoriaEdit}
        categorias={categorias}
      />

      <ConfirmDialog
        open={!!excluirProduto}
        onOpenChange={(o) => !o && setExcluirProduto(null)}
        title={`Excluir ${excluirProduto?.nome ?? "produto"}?`}
        description="O produto sai do catálogo. Pedidos antigos continuam mostrando o nome do item normalmente."
        confirmLabel="Excluir produto"
        destructive
        onConfirm={() => {
          if (!excluirProduto) return;
          remover("produtos", excluirProduto.id);
          registrarAtividade(`Excluiu o produto ${excluirProduto.nome}`);
          toast.success("Produto excluído");
        }}
      />

      <ConfirmDialog
        open={!!excluirCategoria}
        onOpenChange={(o) => !o && setExcluirCategoria(null)}
        title={`Excluir a categoria ${excluirCategoria?.nome ?? ""}?`}
        description="A categoria está vazia e será removida do catálogo."
        confirmLabel="Excluir categoria"
        destructive
        onConfirm={() => {
          if (!excluirCategoria) return;
          remover("categorias", excluirCategoria.id);
          registrarAtividade(`Excluiu a categoria ${excluirCategoria.nome}`);
          if (selecionada === excluirCategoria.id) setSelecionada(TODAS);
          toast.success("Categoria excluída");
        }}
      />
    </div>
  );
}
