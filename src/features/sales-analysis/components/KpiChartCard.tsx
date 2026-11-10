import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCurrencyShort, formatDayMonth, formatInteger, formatPercent } from "@/lib/format";
import {
  GROUP_BY_OPTIONS,
  GROUP_BY_SHORT,
  METRIC_LABELS,
  variation,
  type GroupBy,
  type Kpis,
  type Metric,
  type SeriesPoint,
} from "../aggregate";
import type { DateRange } from "../dates";
import { EmptyState } from "@/components/shared/EmptyState";

const COLOR_CURRENT = "#6CB2EB";
const COLOR_PREVIOUS = "#FED7AA";
const METRICS: Metric[] = ["faturamento", "pedidos", "ticket"];

const formatMetric = (metric: Metric, v: number) => (metric === "pedidos" ? formatInteger(v) : formatCurrency(v));
const periodText = (r: DateRange) => `${formatDayMonth(r.start)} a ${formatDayMonth(r.end)}`;

interface KpiChartCardProps {
  loading: boolean;
  current: Kpis;
  previous: Kpis;
  series: SeriesPoint[];
  metric: Metric;
  onMetricChange: (m: Metric) => void;
  groupBy: GroupBy;
  onGroupByChange: (g: GroupBy) => void;
  range: DateRange;
  previousRange: DateRange;
}

export function KpiChartCard({
  loading,
  current,
  previous,
  series,
  metric,
  onMetricChange,
  groupBy,
  onGroupByChange,
  range,
  previousRange,
}: KpiChartCardProps) {
  const isEmpty = current.pedidos === 0 && previous.pedidos === 0;
  const legendCurrent = `${METRIC_LABELS[metric]} ${GROUP_BY_SHORT[groupBy]} (${periodText(range)})`;
  const legendPrevious = `${METRIC_LABELS[metric]} ${GROUP_BY_SHORT[groupBy]} (${periodText(previousRange)})`;
  const bucketIsShared = groupBy === "hora" || groupBy === "dia_semana";
  const showDots = series.length <= 40;

  return (
    <section className="card overflow-hidden">
      {/* KPIs em abas */}
      <div role="tablist" aria-label="Métrica do gráfico" className="grid grid-cols-3">
        {METRICS.map((m, i) => {
          const active = m === metric;
          const v = variation(current[m], previous[m]);
          return (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onMetricChange(m)}
              className={cn(
                "flex min-w-0 flex-col items-start gap-1 px-3 py-3 text-left transition-colors sm:px-5 sm:py-4",
                active ? "bg-white" : "border-b border-line bg-gray-100 hover:bg-gray-50",
                i > 0 && "border-l border-line",
              )}
            >
              <span className={cn("text-[13px]", active ? "font-semibold text-ink" : "text-ink-muted")}>
                {METRIC_LABELS[m]}
              </span>
              {loading ? (
                <Skeleton className="h-6 w-24 sm:w-32" />
              ) : (
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[16px] font-bold tabular-nums text-ink sm:text-[20px]">
                    {formatMetric(m, current[m])}
                  </span>
                  <Variation value={v} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-2 flex justify-end">
          <Select value={groupBy} onValueChange={(g) => onGroupByChange(g as GroupBy)}>
            <SelectTrigger className="w-[220px]" aria-label="Agrupamento do gráfico">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {GROUP_BY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-[300px]">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : isEmpty ? (
            <EmptyState className="h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#F0F1F3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  minTickGap={6}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={metric === "pedidos" ? 36 : 72}
                  allowDecimals={metric !== "pedidos"}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickFormatter={(v: number) => (metric === "pedidos" ? formatInteger(v) : formatCurrencyShort(v))}
                />
                <Tooltip
                  cursor={{ stroke: "#D1D5DB", strokeDasharray: "4 4" }}
                  content={(props: TooltipProps<number, string>) => (
                    <ChartTooltip
                      {...props}
                      metric={metric}
                      bucketIsShared={bucketIsShared}
                      currentPeriod={periodText(range)}
                      previousPeriod={periodText(previousRange)}
                    />
                  )}
                />
                <Line
                  type="linear"
                  dataKey="previous"
                  name={legendPrevious}
                  stroke={COLOR_PREVIOUS}
                  strokeWidth={2}
                  dot={showDots ? { r: 4, fill: COLOR_PREVIOUS, stroke: "#fff", strokeWidth: 1.5 } : false}
                  activeDot={{ r: 5, fill: COLOR_PREVIOUS, stroke: "#fff", strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="current"
                  name={legendCurrent}
                  stroke={COLOR_CURRENT}
                  strokeWidth={2}
                  dot={showDots ? { r: 4, fill: COLOR_CURRENT, stroke: "#fff", strokeWidth: 1.5 } : false}
                  activeDot={{ r: 5, fill: COLOR_CURRENT, stroke: "#fff", strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legenda */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-[12px] text-ink-muted">
          <LegendItem color={COLOR_CURRENT} label={legendCurrent} />
          <LegendItem color={COLOR_PREVIOUS} label={legendPrevious} />
        </div>
      </div>
    </section>
  );
}

function Variation({ value }: { value: number | null }) {
  if (value === null)
    return (
      <span className="text-[12px] text-ink-muted" title="Sem dados no período anterior">
        —
      </span>
    );
  if (Math.abs(value) < 0.005) return <span className="text-[12px] font-semibold text-ink-muted">0%</span>;
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center text-[12px] font-semibold tabular-nums sm:text-[13px]",
        up ? "text-positive" : "text-negative",
      )}
      aria-label={`${up ? "Aumento" : "Queda"} de ${formatPercent(Math.abs(value))} em relação ao período anterior`}
    >
      {up ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
      {formatPercent(Math.abs(value))}
    </span>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="22" height="10" aria-hidden>
        <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="2" />
        <circle cx="11" cy="5" r="4" fill={color} stroke="#fff" strokeWidth="1.5" />
      </svg>
      {label}
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  metric,
  bucketIsShared,
  currentPeriod,
  previousPeriod,
}: TooltipProps<number, string> & {
  metric: Metric;
  bucketIsShared: boolean;
  currentPeriod: string;
  previousPeriod: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as SeriesPoint;
  const rows = [
    { color: COLOR_CURRENT, label: bucketIsShared ? currentPeriod : point.currentLabel, value: point.current },
    { color: COLOR_PREVIOUS, label: bucketIsShared ? previousPeriod : point.previousLabel, value: point.previous },
  ];
  return (
    <div className="min-w-[180px] rounded-md border border-line bg-white px-3 py-2 text-[12px] shadow-lg">
      <p className="mb-1.5 font-semibold text-ink">
        {METRIC_LABELS[metric]}
        {bucketIsShared && ` · ${point.label}`}
      </p>
      {rows.map((r) => (
        <div key={r.color} className="flex items-center justify-between gap-4 py-0.5">
          <span className="inline-flex items-center gap-2 text-ink-muted">
            <span className="size-2.5 rounded-full" style={{ background: r.color }} />
            {r.label}
          </span>
          <span className="font-semibold tabular-nums text-ink">
            {r.value === null ? "sem pedidos" : formatMetric(metric, r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
