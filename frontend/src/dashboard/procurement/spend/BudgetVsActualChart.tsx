import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const ALL_DATA = [
  { category: 'Raw Materials',       budget: 900, actual: 850 },
  { category: 'IT & Software',       budget: 700, actual: 620 },
  { category: 'Logistics',           budget: 520, actual: 480 },
  { category: 'Prof. Services',      budget: 380, actual: 340 },
  { category: 'Utilities',           budget: 200, actual: 180 },
  { category: 'Marketing',           budget: 160, actual: 140 },
  { category: 'Office Supplies',     budget: 110, actual: 95  },
];

// Map from filter label → chart label
const CAT_MAP: Record<string, string> = {
  'Raw Materials':         'Raw Materials',
  'IT & Software':         'IT & Software',
  'Logistics':             'Logistics',
  'Professional Services': 'Prof. Services',
  'Utilities':             'Utilities',
  'Marketing':             'Marketing',
  'Office Supplies':       'Office Supplies',
};

const BudgetVsActualChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const data = useMemo(() =>
    filters.category === 'All Categories'
      ? ALL_DATA
      : ALL_DATA.filter(d => d.category === (CAT_MAP[filters.category] ?? filters.category)),
  [filters.category]);

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
      formatter: (params: any) => {
        const budget   = params.find((p: any) => p.seriesName === 'Budget');
        const actual   = params.find((p: any) => p.seriesName === 'Actual');
        const savings  = budget && actual ? budget.value - actual.value : 0;
        const savingsPct = budget ? ((savings / budget.value) * 100).toFixed(1) : '0';
        return `<div style="font-weight:600;margin-bottom:6px">${params[0]?.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Budget: <span style="color:#64748B;font-weight:700">$${budget?.value ?? 0}K</span><br/>
            Actual: <span style="color:#10B981;font-weight:700">$${actual?.value ?? 0}K</span><br/>
            ${savings >= 0
              ? `Savings: <span style="color:#34D399;font-weight:700">$${savings}K (${savingsPct}%)</span>`
              : `Overrun: <span style="color:#F87171;font-weight:700">$${Math.abs(savings)}K</span>`
            }
          </div>`;
      },
    },
    legend: {
      top: 0, right: 0,
      textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      itemWidth: 10, itemHeight: 10, itemGap: 16,
      icon: 'roundRect',
    },
    grid: { left: '3%', right: '3%', top: '12%', bottom: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.category),
      axisLabel: { color: '#94A3B8', fontSize: 9, rotate: 30, fontFamily: 'Inter, sans-serif' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif', formatter: (v: number) => `$${v}K` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'Budget',
        type: 'bar',
        barGap: '8%',
        barMaxWidth: 22,
        data: data.map(d => ({
          value: d.budget,
          itemStyle: {
            color: 'rgba(71,85,105,0.35)',
            borderColor: 'rgba(100,116,139,0.6)',
            borderWidth: 1,
            borderRadius: [4, 4, 0, 0],
          },
        })),
      },
      {
        name: 'Actual',
        type: 'bar',
        barMaxWidth: 22,
        data: data.map(d => ({
          value: d.actual,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#10B981' },
                { offset: 1, color: '#059669aa' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        })),
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => `$${p.value}K`,
          color: '#94A3B8',
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
        },
      },
    ],
  }), [data]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default BudgetVsActualChart;
