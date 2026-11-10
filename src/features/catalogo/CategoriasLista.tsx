import { ArrowDown, ArrowUp, MoreVertical, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Categoria } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export const TODAS = "todas";

interface CategoriasListaProps {
  categorias: Categoria[]; // já ordenadas
  contagem: Map<string, number>;
  total: number;
  selecionada: string;
  onSelecionar: (id: string) => void;
  onNova: () => void;
  onEditar: (c: Categoria) => void;
  onExcluir: (c: Categoria) => void;
}

/** Lista de categorias com seleção e ações (ordem, ativar, editar, excluir). */
export function CategoriasLista({
  categorias,
  contagem,
  total,
  selecionada,
  onSelecionar,
  onNova,
  onEditar,
  onExcluir,
}: CategoriasListaProps) {
  const salvar = useAppStore((s) => s.salvar);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);

  const mover = (idx: number, dir: -1 | 1) => {
    const a = categorias[idx];
    const b = categorias[idx + dir];
    if (!a || !b) return;
    salvar("categorias", { ...a, ordem: b.ordem });
    salvar("categorias", { ...b, ordem: a.ordem });
  };

  const alternar = (c: Categoria) => {
    salvar("categorias", { ...c, ativa: !c.ativa });
    registrarAtividade(`${c.ativa ? "Desativou" : "Ativou"} a categoria ${c.nome}`);
    toast.success(c.ativa ? `${c.nome} desativada` : `${c.nome} ativada`);
  };

  const item = (id: string, nome: string, qtd: number, ativa = true) => (
    <button
      type="button"
      onClick={() => onSelecionar(id)}
      aria-current={selecionada === id}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-left transition-colors",
        selecionada === id ? "bg-chart-primary/10 font-semibold text-primary" : "hover:bg-gray-100",
        !ativa && selecionada !== id && "text-ink-muted",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{nome}</span>
      {!ativa && <Badge tom="gray">Inativa</Badge>}
      <span className="text-[12px] tabular-nums text-ink-muted">{qtd}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-0.5">
      {item(TODAS, "Todos os produtos", total)}
      <div className="my-1 h-px bg-line" />
      {categorias.map((c, idx) => (
        <div key={c.id} className="group flex items-center gap-1">
          {item(c.id, c.nome, contagem.get(c.id) ?? 0, c.ativa)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-gray-100 hover:text-ink"
                aria-label={`Ações da categoria ${c.nome}`}
              >
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={idx === 0} onSelect={() => mover(idx, -1)}>
                <ArrowUp /> Mover para cima
              </DropdownMenuItem>
              <DropdownMenuItem disabled={idx === categorias.length - 1} onSelect={() => mover(idx, 1)}>
                <ArrowDown /> Mover para baixo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onEditar(c)}>
                <Pencil /> Editar nome
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => alternar(c)}>
                <Power /> {c.ativa ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-negative [&_svg]:text-negative" onSelect={() => onExcluir(c)}>
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      <Button variant="outline" size="sm" className="mt-2 border-dashed" onClick={onNova}>
        <Plus /> Nova categoria
      </Button>
    </div>
  );
}
