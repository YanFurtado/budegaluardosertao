import { useState } from "react";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DATE_FIELD_OPTIONS, type DateField, type DateRange } from "../dates";
import { createEmptyFilter, FILTER_DEFS, FILTER_ORDER, type ActiveFilter, type FilterKey } from "../filters";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { FilterChip } from "./FilterChip";

interface FiltersBarProps {
  dateField: DateField;
  onDateFieldChange: (f: DateField) => void;
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  filters: ActiveFilter[];
  onFiltersChange: (filters: ActiveFilter[]) => void;
}

export function FiltersBar({
  dateField,
  onDateFieldChange,
  range,
  onRangeChange,
  filters,
  onFiltersChange,
}: FiltersBarProps) {
  const [justAdded, setJustAdded] = useState<FilterKey | null>(null);
  const available = FILTER_ORDER.filter((k) => !filters.some((f) => f.key === k));

  const addFilter = (key: FilterKey) => {
    setJustAdded(key);
    onFiltersChange([...filters, createEmptyFilter(key)]);
  };

  return (
    <section className="card flex flex-wrap items-center gap-2 p-3 sm:p-4">
      <Select value={dateField} onValueChange={(v) => onDateFieldChange(v as DateField)}>
        <SelectTrigger className="w-full sm:w-[250px]" aria-label="Tipo de data">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_FIELD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker value={range} onChange={onRangeChange} />

      {filters.map((f) => (
        <FilterChip
          key={f.key}
          filter={f}
          autoOpen={justAdded === f.key}
          onChange={(next) => onFiltersChange(filters.map((x) => (x.key === f.key ? next : x)))}
          onRemove={() => {
            if (justAdded === f.key) setJustAdded(null);
            onFiltersChange(filters.filter((x) => x.key !== f.key));
          }}
        />
      ))}

      {available.length > 0 && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-dashed text-ink-muted hover:text-ink">
              <Plus /> Filtro
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuLabel>Adicionar filtro</DropdownMenuLabel>
            {available.map((k) => (
              <DropdownMenuItem key={k} onSelect={() => addFilter(k)}>
                {FILTER_DEFS[k].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </section>
  );
}
