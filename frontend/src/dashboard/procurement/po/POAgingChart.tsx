import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const BUCKETS  = ['0 – 7 days', '8 – 14 days', '15 – 30 days', '31 – 60 days', '61 – 90 days', '90+ days'];
const BASE_PENDING    = [94, 72, 48, 31, 18, 9];
const BASE_APPROVED   = [210, 165, 118, 72, 34, 12];
const BASE_OVERDUE    = [8,  24,  38,  29, 18, 9];

const CAT_FACTOR: Record<string, number[]> = {
  'Raw Materials':        [1.3, 1.2, 1.1, 1.0, 0.9, 0.8],
  'IT & Software':        [0.9, 1.0, 1.2, 1.1, 1.0, 1.2],
  'Logistics':            [1.1, 1.0, 0.9, 1.2, 1.3, 1.0],
  'Professional Services':[0.8, 0.9, 1.1, 1.3, 1.2, 1.4],
  'Utilities':            [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  'Marketing':            [0.7, 0.8, 1.0, 1.2, 1.1, 1.3],
  'Office Supplies':      [1.2, 1.1, 0.9, 0.8, 0.7, 0.6],
};

const STATUS_COLORS: Record<string, string> = {
  Pending:  '#F59E0B',
  Approved: '#10B981',
  Overdue:  '#EF4444',
};

const POAgingChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const { pending, approved, overdue } = useMemo(() => {
    const factor = CAT_FACTOR[filters.category] ?? [1, 1, 1, 1, 1, 1];
    return {
      pending:  BASE_PENDING.map((v, i)  => Math.round(v * factor[i])),
      approved: BASE_APPROVED.map((v, i) => Math.round(v * factor[i])),
      overdue:  BASE_OVERDUE.map((v, i)  => Math.round(v * factor[i])),
    };
  }, [filters.category]);

  const option = useMemo<EChartsCoreOption>(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0A1525',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: [10, 14] as [number, number],
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 16,
      icon: 'circle',
    },
    grid: { top: 12, right: 16, bottom: 48, left: 44, containLabel: false },
    xAxis: {
      type: 'category',
      data: BUCKETS,
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick:  { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine:  { show: false },
      axisTick:  { show: false },
    },
    series: [
      {
        name: 'Approved',
        type: 'bar',
        stack: 'aging',
        data: approved,
        barMaxWidth: 40,
        itemStyle: { color: STATUS_COLORS.Approved, borderRadius: [0, 0, 0, 0] },
        emphasis: { itemStyle: { color: '#34D399' } },
      },
      {
        name: 'Pending',
        type: 'bar',
        stack: 'aging',
        data: pending,
        barMaxWidth: 40,
        itemStyle: { color: STATUS_COLORS.Pending },
        emphasis: { itemStyle: { color: '#FBBF24' } },
      },
      {
        name: 'Overdue',
        type: 'bar',
        stack: 'aging',
        data: overdue,
        barMaxWidth: 40,
        itemStyle: { color: STATUS_COLORS.Overdue, borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: '#F87171' } },
      },
    ],
  }), [pending, approved, overdue]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default POAgingChart;
