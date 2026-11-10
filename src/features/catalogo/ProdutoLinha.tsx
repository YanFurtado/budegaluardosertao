import { Copy, Pencil, Star, Trash2 } from "lucide-react";
import type { Produto } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { iniciais } from "@/lib/loja";

/** Cores dos blocos de iniciais — acompanham a categoria (mesma ordem sempre). */
const TILES = [
  "bg-[#E6F1FB] text-[#21639C]",
  "bg-[#FFF1E0] text-[#A85B12]",
  "bg-[#E0F4F2] text-[#1C7A72]",
  "bg-[#F1EAFB] text-[#6B3FB0]",
  "bg-[#FBF3D9] text-[#866A0E]",
  "bg-gray-100 text-gray-700",
];

const iconBtn =
  "flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40";

interface ProdutoLinhaProps {
  produto: Produto;
  /** Índice da categoria (para a cor do bloco). */
  corIndice: number;
  /** Nome da categoria — mostrado quando a lista mistura categorias. */
  categoriaNome?: string;
  onAlternar: () => void;
  onEditar: () => void;
  onDuplicar: () => void;
  onExcluir: () => void;
}

export function ProdutoLinha({
  produto: p,
  corIndice,
  categoriaNome,
  onAlternar,
  onEditar,
  onDuplicar,
  onExcluir,
}: ProdutoLinhaProps) {
  const tile = TILES[corIndice >= 0 ? corIndice % (TILES.length - 1) : TILES.length - 1];

  return (
    <li className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap", !p.ativo && "bg-gray-50/70")}>
      <div className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto">
        {p.imagem_url ? (
          <img
            src={p.imagem_url}
            alt=""
            loading="lazy"
            className={cn("size-11 shrink-0 rounded-md border border-line object-cover", !p.ativo && "opacity-50 grayscale")}
          />
        ) : (
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-md text-[14px] font-bold",
              tile,
              !p.ativo && "opacity-50",
            )}
            aria-hidden
          >
            {iniciais(p.nome)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn("flex items-center gap-1.5 font-semibold", !p.ativo && "text-ink-muted")}>
            <span className="truncate">{p.nome}</span>
            {p.destaque && (
              <Star className="size-3.5 shrink-0 fill-[#F29A3F] text-[#F29A3F]" aria-label="Produto em destaque" />
            )}
            {!p.ativo && <Badge tom="gray">Pausado</Badge>}
          </p>
          <p className="truncate text-[12px] text-ink-muted">{p.descricao || "Sem descrição"}</p>
          {categoriaNome && <p className="truncate text-[11px] font-semibold text-ink-muted">{categoriaNome}</p>}
        </div>
      </div>

      <div className="ml-14 flex flex-col items-start tabular-nums sm:ml-0 sm:w-28 sm:items-end">
        {p.preco_promocional !== null ? (
          <>
            <span className="text-[12px] text-ink-muted line-through">{formatCurrency(p.preco)}</span>
            <span className="font-bold text-[#1F7A45]">{formatCurrency(p.preco_promocional)}</span>
          </>
        ) : (
          <span className="font-bold">{formatCurrency(p.preco)}</span>
        )}
      </div>

      <label className="ml-auto flex items-center gap-2 text-[12px] text-ink-muted sm:ml-0">
        <span className="hidden lg:inline">Disponível</span>
        <Switch checked={p.ativo} onCheckedChange={onAlternar} aria-label={`Disponível: ${p.nome}`} />
      </label>

      <div className="flex items-center">
        <button type="button" className={iconBtn} onClick={onEditar} aria-label={`Editar ${p.nome}`} title="Editar">
          <Pencil className="size-4" />
        </button>
        <button type="button" className={iconBtn} onClick={onDuplicar} aria-label={`Duplicar ${p.nome}`} title="Duplicar">
          <Copy className="size-4" />
        </button>
        <button
          type="button"
          className={cn(iconBtn, "hover:bg-negative-soft hover:text-negative")}
          onClick={onExcluir}
          aria-label={`Excluir ${p.nome}`}
          title="Excluir"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
