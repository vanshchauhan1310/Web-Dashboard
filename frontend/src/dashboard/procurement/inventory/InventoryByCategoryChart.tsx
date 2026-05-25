import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const ALL_CATEGORIES = [
  { name: 'Raw Materials',  stock: 4820, safety: 1200, reorder: 1800, color: '#10B981' },
  { name: 'Electronics',   stock: 3150, safety:  800, reorder: 1100, color: '#3B82F6' },
  { name: 'Furniture',     stock: 1240, safety:  300, reorder:  450, color: '#8B5CF6' },
  { name: 'Consumables',   stock: 6870, safety: 2100, reorder: 3000, color: '#F59E0B' },
  { name: 'IT & Software', stock: 2310, safety:  600, reorder:  900, color: '#06B6D4' },
  { name: 'Logistics',     stock: 1780, safety:  480, reorder:  700, color: '#EC4899' },
  { name: 'Office Supplies',stock:3400, safety:  900, reorder: 1400, color: '#F97316' },
];

const InventoryByCategoryChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const categories = useMemo(() => {
    if (filters.category !== 'All Categories') {
      return ALL_CATEGORIES.filter(c => c.name === filters.category);
    }
    return [...ALL_CATEGORIES].sort((a, b) => b.stock - a.stock);
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
      formatter: (params: any) => {
        const [stockP, safetyP, reorderP] = params as any[];
        return `<div style="font-weight:600;margin-bottom:6px">${stockP.axisValueLabel}</div>
          <div style="line-height:2">
            <span style="color:#10B981">●</span> Current Stock: <span style="color:#10B981;font-weight:700">${stockP.value?.toLocaleString()} units</span><br/>
            <span style="color:#F59E0B">●</span> Safety Stock: <span style="color:#F59E0B;font-weight:700">${safetyP.value?.toLocaleString()} units</span><br/>
            <span style="color:#EF4444">●</span> Reorder Level: <span style="color:#EF4444;font-weight:700">${reorderP.value?.toLocaleString()} units</span>
          </div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 16,
      icon: 'circle',
    },
    grid: { top: 12, right: 20, bottom: 48, left: 16, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`,
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false }, axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: categories.map(c => c.name),
      axisLabel: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Current Stock',
        type: 'bar',
        data: categories.map(c => ({
          value: c.stock,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: c.color + 'cc' },
                { offset: 1, color: c.color },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barMaxWidth: 22,
        label: {
          show: true, position: 'right',
          formatter: (p: any) => p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}K` : p.value,
          color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif',
        },
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(16,185,129,0.4)' } },
      },
      {
        name: 'Safety Stock',
        type: 'bar',
        data: categories.map(c => c.safety),
        barMaxWidth: 22,
        itemStyle: { color: '#F59E0B88', borderRadius: [0, 4, 4, 0] },
        emphasis: { itemStyle: { color: '#FBBF24' } },
      },
      {
        name: 'Reorder Level',
        type: 'bar',
        data: categories.map(c => c.reorder),
        barMaxWidth: 22,
        itemStyle: { color: '#EF444466', borderRadius: [0, 4, 4, 0] },
        emphasis: { itemStyle: { color: '#F87171' } },
      },
    ],
  }), [categories]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default InventoryByCategoryChart;
