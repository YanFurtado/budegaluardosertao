import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type PieLabelRenderProps, type TooltipProps } from "recharts";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatInteger, formatPercent } from "@/lib/format";
import type { SegmentRow } from "../aggregate";
import { SEGMENT_GROUPS, type SegmentGroup } from "../segments";
import { CardHeader } from "@/components/shared/CardHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";

const RADIAN = Math.PI / 180;

/** Escolhe texto branco ou escuro, o que tiver mais contraste com a fatia. */
function labelColorFor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const vsWhite = 1.05 / (L + 0.05);
  const vsInk = (L + 0.05) / (0.0262 + 0.05); // #1F2937
  return vsWhite >= vsInk ? "#FFFFFF" : "#1F2937";
}

interface SegmentAnalysisCardProps {
  loading: boolean;
  group: SegmentGroup;
  onGroupChange: (g: SegmentGroup) => void;
  rows: SegmentRow[];
  totalRevenue: number;
}

export function SegmentAnalysisCard({ loading, group, onGroupChange, rows, totalRevenue }: SegmentAnalysisCardProps) {
  const groupDef = SEGMENT_GROUPS.find((g) => g.value === group)!;
  const pieRows = rows.filter((r) => r.share > 0);

  const columns: Column<SegmentRow>[] = [
    {
      key: "segment",
      header: groupDef.column,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
          {r.segment}
        </span>
      ),
    },
    { key: "faturamento", header: "Faturamento", align: "right", sortValue: (r) => r.faturamento, render: (r) => formatCurrency(r.faturamento) },
    { key: "pedidos", header: "Pedidos", align: "right", render: (r) => formatInteger(r.pedidos) },
    { key: "ticket", header: "Ticket médio", align: "right", render: (r) => formatCurrency(r.ticket) },
  ];

  const renderLabel = (p: PieLabelRenderProps) => {
    const share = (p.payload as SegmentRow).share;
    if (share < 0.05) return null;
    const inner = Number(p.innerRadius);
    const outer = Number(p.outerRadius);
    const r = inner + (outer - inner) / 2;
    const x = Number(p.cx) + r * Math.cos(-Number(p.midAngle) * RADIAN);
    const y = Number(p.cy) + r * Math.sin(-Number(p.midAngle) * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={labelColorFor((p.payload as SegmentRow).color)}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
      >
        {formatPercent(share)}
      </text>
    );
  };

  return (
    <section className="card p-4 sm:p-5">
      <CardHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            Análise dos pedidos por
            <SelectPrimitive.Root value={group} onValueChange={(v) => onGroupChange(v as SegmentGroup)}>
              <SelectPrimitive.Trigger
                aria-label="Grupo de segmentação"
                className="inline-flex items-center gap-1 rounded border-b-2 border-dashed border-chart-primary px-0.5 font-semibold text-primary outline-none hover:bg-chart-primary/10 focus-visible:ring-2 focus-visible:ring-chart-primary/30"
              >
                <SelectPrimitive.Value />
                <ChevronDown className="size-4" />
              </SelectPrimitive.Trigger>
              <SelectContent className="min-w-[220px]">
                {SEGMENT_GROUPS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectPrimitive.Root>
          </span>
        }
        subtitle="Escolha um grupo de segmentação acima e analise seus pedidos com base nos segmentos do grupo"
      />

      {!loading && rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid items-center gap-6 lg:grid-cols-[260px_1fr]">
          <div className="relative mx-auto size-[240px]">
            {loading ? (
              <Skeleton className="size-full rounded-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieRows}
                      dataKey="faturamento"
                      nameKey="segment"
                      innerRadius={62}
                      outerRadius={112}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      labelLine={false}
                      label={renderLabel}
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive={false}
                    >
                      {pieRows.map((r) => (
                        <Cell key={r.segment} fill={r.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[12px] text-ink-muted">Faturamento</span>
                  <span className="text-[14px] font-bold tabular-nums">{formatCurrency(totalRevenue)}</span>
                </div>
              </>
            )}
          </div>

          <DataTable
            key={group}
            columns={columns}
            rows={rows}
            rowKey={(r) => r.segment}
            loading={loading}
            defaultSort={{ key: "faturamento", dir: "desc" }}
          />
        </div>
      )}
    </section>
  );
}

function PieTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as SegmentRow;
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-[12px] shadow-lg">
      <p className="mb-1 inline-flex items-center gap-2 font-semibold">
        <span className="size-2.5 rounded-full" style={{ background: row.color }} />
        {row.segment}
      </p>
      <p className="tabular-nums text-ink-muted">
        {formatCurrency(row.faturamento)} · {formatPercent(row.share, 1)} · {formatInteger(row.pedidos)} pedidos
      </p>
    </div>
  );
}
