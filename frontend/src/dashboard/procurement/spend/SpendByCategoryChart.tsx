import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const ALL_DATA = [
  { name: 'Office Supplies',       value: 95,  color: '#06B6D4' },
  { name: 'Marketing',             value: 140, color: '#EC4899' },
  { name: 'Utilities',             value: 180, color: '#F59E0B' },
  { name: 'Professional Services', value: 340, color: '#8B5CF6' },
  { name: 'Logistics',             value: 480, color: '#3B82F6' },
  { name: 'IT & Software',         value: 620, color: '#10B981' },
  { name: 'Raw Materials',         value: 850, color: '#34D399' },
];

const SpendByCategoryChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const data = useMemo(() =>
    filters.category === 'All Categories'
      ? ALL_DATA
      : ALL_DATA.filter(d => d.name === filters.category),
  [filters.category]);

  const option = useMemo<EChartsCoreOption>(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: '#0A1525',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: [10, 14] as [number, number],
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        const total = ALL_DATA.reduce((s, d) => s + d.value, 0);
        const pct   = ((p.value / total) * 100).toFixed(1);
        return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
          Spend: <span style="color:#10B981;font-weight:700">$${p.value}K</span>
          &nbsp;&nbsp;<span style="color:#64748B">${pct}% of total</span>`;
      },
    },
    grid: { left: '2%', right: '10%', top: '4%', bottom: '4%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif', formatter: (v: number) => `$${v}K` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 26,
      data: data.map(d => ({
        value: d.value,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: d.color + '44' }, { offset: 1, color: d.color }],
          },
          borderRadius: [0, 6, 6, 0],
        },
        emphasis: { itemStyle: { color: d.color } },
      })),
      label: {
        show: true,
        position: 'right',
        formatter: (p: any) => `$${p.value}K`,
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
      },
    }],
  }), [data]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default SpendByCategoryChart;
