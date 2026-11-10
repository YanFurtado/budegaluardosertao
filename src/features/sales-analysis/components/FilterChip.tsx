import { useState } from "react";
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { describeFilter, FILTER_DEFS, isFilterEmpty, type ActiveFilter } from "../filters";

interface FilterChipProps {
  filter: ActiveFilter;
  onChange: (filter: ActiveFilter) => void;
  onRemove: () => void;
  /** Abre o editor assim que o chip aparece (filtro recém-adicionado). */
  autoOpen?: boolean;
}

export function FilterChip({ filter, onChange, onRemove, autoOpen }: FilterChipProps) {
  const [open, setOpen] = useState(!!autoOpen);
  const [draft, setDraft] = useState<ActiveFilter>(filter);
  const def = FILTER_DEFS[filter.key];
  const empty = isFilterEmpty(filter);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(filter);
    setOpen(next);
    // Fechou sem aplicar nenhum valor: o chip some.
    if (!next && empty) onRemove();
  };

  const apply = () => {
    setOpen(false);
    if (isFilterEmpty(draft)) onRemove();
    else onChange(draft);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div
        className={cn(
          "inline-flex h-9 max-w-full items-center rounded-full border bg-white pl-3 pr-1 text-[13px] transition-colors",
          open ? "border-chart-primary ring-2 ring-chart-primary/20" : "border-line hover:border-gray-300",
        )}
      >
        <PopoverTrigger asChild>
          <button type="button" className="min-w-0 truncate pr-1 text-left focus-visible:outline-none">
            <span className="text-ink-muted">{def.label}:</span>{" "}
            <span className="font-semibold">{describeFilter(filter)}</span>
          </button>
        </PopoverTrigger>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover filtro ${def.label}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-gray-100 hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <PopoverContent className="w-72 p-3">
        <p className="mb-2 text-[13px] font-semibold">{def.label}</p>
        <FilterEditor draft={draft} setDraft={setDraft} />
        <div className="mt-3 flex justify-between gap-2 border-t border-line pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setDraft(
                "values" in draft
                  ? { ...draft, values: [] }
                  : "min" in draft
                    ? { ...draft, min: null, max: null }
                    : { ...draft, from: "", to: "" },
              )
            }
          >
            Limpar
          </Button>
          <Button size="sm" onClick={apply}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterEditor({ draft, setDraft }: { draft: ActiveFilter; setDraft: (f: ActiveFilter) => void }) {
  const def = FILTER_DEFS[draft.key];

  if ("values" in draft && def.kind === "categorical") {
    const toggle = (v: string) =>
      setDraft({
        ...draft,
        values: draft.values.includes(v) ? draft.values.filter((x) => x !== v) : [...draft.values, v],
      });
    return (
      <div className="flex max-h-64 flex-col overflow-y-auto">
        {def.options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 hover:bg-gray-50">
            <input
              type="checkbox"
              className="size-4 rounded border-line accent-[#6CB2EB]"
              checked={draft.values.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    );
  }

  if ("min" in draft) {
    const parse = (s: string) => (s === "" ? null : Math.max(0, Number(s.replace(",", "."))));
    return (
      <div className="grid grid-cols-2 gap-3">
        {(["min", "max"] as const).map((k) => (
          <label key={k} className="flex flex-col gap-1 text-[12px] text-ink-muted">
            {k === "min" ? "Mínimo (R$)" : "Máximo (R$)"}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder={k === "min" ? "0,00" : "Sem limite"}
              className="input"
              value={draft[k] ?? ""}
              onChange={(e) => setDraft({ ...draft, [k]: parse(e.target.value) })}
            />
          </label>
        ))}
      </div>
    );
  }

  if ("from" in draft) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {(["from", "to"] as const).map((k) => (
          <label key={k} className="flex flex-col gap-1 text-[12px] text-ink-muted">
            {k === "from" ? "De" : "Até"}
            <input
              type="time"
              className="input"
              value={draft[k]}
              onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
    );
  }

  return null;
}
