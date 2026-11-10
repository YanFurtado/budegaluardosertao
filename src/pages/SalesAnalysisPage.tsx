import { useMemo, useState } from "react";
import {
  ALL_COMPONENTS_ON,
  buildSeries,
  byEmployee,
  byNeighborhood,
  componentTotals,
  computeKpis,
  segmentBreakdown,
  type ComponentToggles,
  type GroupBy,
  type Metric,
  type RevenueComponent,
} from "@/features/sales-analysis/aggregate";
import { comparisonRange, DATE_PRESETS, suggestedGroupBy, type DateField, type DateRange } from "@/features/sales-analysis/dates";
import { isFilterEmpty, type ActiveFilter } from "@/features/sales-analysis/filters";
import type { SegmentGroup } from "@/features/sales-analysis/segments";
import { useSalesOrders } from "@/features/sales-analysis/useSalesOrders";
import { FiltersBar } from "@/features/sales-analysis/components/FiltersBar";
import { KpiChartCard } from "@/features/sales-analysis/components/KpiChartCard";
import { RevenueDetailsCard } from "@/features/sales-analysis/components/RevenueDetailsCard";
import { SegmentAnalysisCard } from "@/features/sales-analysis/components/SegmentAnalysisCard";
import { EmployeesCard } from "@/features/sales-analysis/components/EmployeesCard";
import { NeighborhoodsCard } from "@/features/sales-analysis/components/NeighborhoodsCard";
import { useAppStore } from "@/store/useAppStore";

export default function SalesAnalysisPage() {
  const [dateField, setDateField] = useState<DateField>("criacao");
  const [range, setRange] = useState<DateRange>(() => DATE_PRESETS[0].get(new Date()));
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [metric, setMetric] = useState<Metric>("faturamento");
  const [groupBy, setGroupBy] = useState<GroupBy>("hora");
  const [toggles, setToggles] = useState<ComponentToggles>(ALL_COMPONENTS_ON);
  const [segmentGroup, setSegmentGroup] = useState<SegmentGroup>("forma_pagamento");

  // Chips ainda sem valor não entram na consulta.
  const appliedFilters = filters.filter((f) => !isFilterEmpty(f));
  const { data, loading } = useSalesOrders({ range, dateField, filters: appliedFilters });

  const current = data?.current ?? [];
  const previous = data?.previous ?? [];
  const shownRange = data?.range ?? range;
  const previousRange = data?.previousRange ?? comparisonRange(range);

  const kpisCurrent = useMemo(() => computeKpis(current, toggles), [current, toggles]);
  const kpisPrevious = useMemo(() => computeKpis(previous, toggles), [previous, toggles]);
  const totals = useMemo(() => componentTotals(current), [current]);
  const series = useMemo(
    () =>
      buildSeries({ current, previous, range: shownRange, previousRange, groupBy, dateField, metric, toggles }),
    [current, previous, shownRange, previousRange, groupBy, dateField, metric, toggles],
  );
  const segments = useMemo(() => segmentBreakdown(current, segmentGroup, toggles), [current, segmentGroup, toggles]);
  const funcionarios = useAppStore((s) => s.funcionarios);
  const employees = useMemo(() => byEmployee(current, funcionarios), [current, funcionarios]);
  const neighborhoods = useMemo(() => byNeighborhood(current), [current]);

  const handleRangeChange = (r: DateRange) => {
    setRange(r);
    setGroupBy(suggestedGroupBy(r));
  };

  const toggleComponent = (key: RevenueComponent) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <FiltersBar
        dateField={dateField}
        onDateFieldChange={setDateField}
        range={range}
        onRangeChange={handleRangeChange}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <KpiChartCard
        loading={loading}
        current={kpisCurrent}
        previous={kpisPrevious}
        series={series}
        metric={metric}
        onMetricChange={setMetric}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        range={shownRange}
        previousRange={previousRange}
      />

      <RevenueDetailsCard
        loading={loading}
        totals={totals}
        toggles={toggles}
        onToggle={toggleComponent}
        onReset={() => setToggles(ALL_COMPONENTS_ON)}
        faturamento={kpisCurrent.faturamento}
      />

      <SegmentAnalysisCard
        loading={loading}
        group={segmentGroup}
        onGroupChange={setSegmentGroup}
        rows={segments}
        totalRevenue={kpisCurrent.faturamento}
      />

      <EmployeesCard loading={loading} rows={employees} />

      <NeighborhoodsCard loading={loading} rows={neighborhoods} />
    </div>
  );
}
