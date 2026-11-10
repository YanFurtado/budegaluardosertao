import { useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { DATE_PRESETS, sameRange, type DateRange } from "@/lib/dateRange";

const WEEK_HEADER = ["D", "S", "T", "Q", "Q", "S", "S"];

function withTime(day: Date, hhmm: string, endOfMinute: boolean) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h || 0, m || 0, endOfMinute ? 59 : 0, endOfMinute ? 999 : 0);
  return d;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [month, setMonth] = useState(() => startOfMonth(value.start));

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStart(startOfDay(value.start));
      setEnd(startOfDay(value.end));
      setStartTime(format(value.start, "HH:mm"));
      setEndTime(format(value.end, "HH:mm"));
      setMonth(startOfMonth(value.end));
      setHover(null);
    }
    setOpen(next);
  };

  const pickDay = (day: Date) => {
    if (!start || end) {
      setStart(day);
      setEnd(null);
    } else if (isBefore(day, start)) {
      setStart(day);
    } else {
      setEnd(day);
    }
  };

  const draftStart = start ? withTime(start, startTime, false) : null;
  const draftEnd = start ? withTime(end ?? start, endTime, true) : null;
  const invalid = !draftStart || !draftEnd || draftEnd < draftStart;

  const apply = () => {
    if (invalid) return;
    onChange({ start: draftStart!, end: draftEnd! });
    setOpen(false);
  };

  const applyPreset = (range: DateRange) => {
    onChange(range);
    setOpen(false);
  };

  // Grade do mês
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = gridStart; !isAfter(d, gridEnd); d = addDays(d, 1)) days.push(d);

  const rangeEnd = end ?? (start && hover && !isBefore(hover, start) ? hover : null);
  const inRange = (d: Date) => !!start && !!rangeEnd && isAfter(d, start) && isBefore(d, rangeEnd);

  const now = new Date();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="input inline-flex w-full items-center gap-2 text-left tabular-nums hover:border-gray-300 sm:w-auto"
          aria-label="Selecionar intervalo de data e hora"
        >
          <CalendarDays className="size-4 shrink-0 text-ink-muted" />
          <span className="truncate">
            {formatDateTime(value.start)} ~ {formatDateTime(value.end)}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="flex w-auto max-w-[calc(100vw-24px)] flex-col p-0 sm:flex-row">
        {/* Atalhos */}
        <div className="flex gap-1 overflow-x-auto border-b border-line p-2 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r">
          {DATE_PRESETS.map((p) => {
            const r = p.get(now);
            const active = sameRange(r, value);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(r)}
                className={cn(
                  "whitespace-nowrap rounded px-3 py-2 text-left text-[13px] transition-colors hover:bg-gray-100",
                  active && "bg-chart-primary/10 font-semibold text-primary",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Calendário */}
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setMonth(subMonths(month, 1))} aria-label="Mês anterior">
              <ChevronLeft />
            </Button>
            <span className="text-[13px] font-semibold">
              {format(month, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())}
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setMonth(addMonths(month, 1))} aria-label="Próximo mês">
              <ChevronRight />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-ink-muted">
            {WEEK_HEADER.map((d, i) => (
              <span key={i} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
            {days.map((d) => {
              const isStart = !!start && isSameDay(d, start);
              const isEnd = !!rangeEnd && isSameDay(d, rangeEnd);
              const between = inRange(d);
              return (
                <div
                  key={d.toISOString()}
                  className={cn(
                    "py-0.5",
                    between && "bg-chart-primary/15",
                    isStart && rangeEnd && !isEnd && "rounded-l-full bg-gradient-to-r from-transparent from-50% to-chart-primary/15 to-50%",
                    isEnd && start && !isStart && "rounded-r-full bg-gradient-to-l from-transparent from-50% to-chart-primary/15 to-50%",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => pickDay(d)}
                    onMouseEnter={() => setHover(d)}
                    aria-pressed={isStart || isEnd}
                    aria-label={format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    className={cn(
                      "mx-auto flex size-8 items-center justify-center rounded-full text-[13px] tabular-nums transition-colors",
                      !isSameMonth(d, month) && "text-gray-300",
                      !(isStart || isEnd) && "hover:bg-gray-100",
                      isToday(d) && !(isStart || isEnd) && "font-bold text-primary",
                      (isStart || isEnd) && "bg-chart-primary font-semibold text-white",
                    )}
                  >
                    {format(d, "d")}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
            <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
              Início {start && <span className="text-ink">{format(start, "dd/MM/yyyy")}</span>}
              <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
              Fim {start && <span className="text-ink">{format(end ?? start, "dd/MM/yyyy")}</span>}
              <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>

          {invalid && start && <p className="mt-2 text-[12px] text-negative">O fim precisa ser depois do início.</p>}

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={apply} disabled={invalid}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
