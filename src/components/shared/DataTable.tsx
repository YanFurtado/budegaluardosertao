import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Quando definido, a coluna fica ordenável (número ou texto). */
  sortValue?: (row: T) => number | string;
  align?: "left" | "right" | "center";
  className?: string;
}

export type SortState = { key: string; dir: "asc" | "desc" };

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  defaultSort?: SortState;
  skeletonRows?: number;
  /** Linha clicável (abre detalhes, por exemplo). */
  onRowClick?: (row: T) => void;
  /** Ativa paginação no rodapé. */
  pageSize?: number;
  emptyMessage?: string;
}

const alignClass = (a?: Column<unknown>["align"]) =>
  a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  defaultSort,
  skeletonRows = 4,
  onRowClick,
  pageSize,
  emptyMessage,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | undefined>(defaultSort);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const factor = sort!.dir === "asc" ? 1 : -1;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "pt-BR", { sensitivity: "base" });
      return cmp * factor;
    });
  }, [rows, columns, sort]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  useEffect(() => {
    if (page > pageCount - 1) setPage(0);
  }, [page, pageCount]);
  const visible = pageSize ? sorted.slice(page * pageSize, page * pageSize + pageSize) : sorted;

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));

  if (!loading && rows.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="overflow-hidden rounded-md border border-line">
      {/* relative: mantém elementos sr-only (absolute) dentro da área rolável */}
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-line">
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const ariaSort = active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortValue ? (ariaSort ?? "none") : undefined}
                    className={cn("whitespace-nowrap px-3 py-2.5 font-semibold text-ink", alignClass(col.align), col.className)}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40",
                          col.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {col.header}
                        {active ? (
                          sort!.dir === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUp className="size-3.5" />
                          )
                        ) : (
                          <ArrowDown className="size-3.5 opacity-30" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={i} className="border-t border-line">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-3">
                        <Skeleton className={cn("h-3.5", col.align === "right" ? "ml-auto w-16" : "w-28")} />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-t border-line transition-colors hover:bg-gray-50",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("whitespace-nowrap px-3 py-2.5 tabular-nums", alignClass(col.align), col.className)}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {pageSize && !loading && sorted.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-white px-3 py-2 text-[12px] text-ink-muted">
          <span>
            {page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} de {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-1 tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount - 1}
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
