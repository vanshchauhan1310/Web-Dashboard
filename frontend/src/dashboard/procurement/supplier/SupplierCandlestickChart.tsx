import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

// Lead time data: [Q1, Q3, min, max] → ECharts candlestick [open, close, low, high]
const ALL_SUPPLIERS = [
  { name: 'SupplyCo Ltd',  data: [5,  8,  3,  14], avg: 6.2,  tier: 'A' },
  { name: 'TechVend Inc',  data: [7,  12, 5,  20], avg: 9.1,  tier: 'A' },
  { name: 'LogiPro',       data: [4,  7,  2,  12], avg: 5.3,  tier: 'B' },
  { name: 'ConsultPro',    data: [10, 18, 7,  30], avg: 14.2, tier: 'A' },
  { name: 'PowerGrid Co',  data: [6,  10, 4,  16], avg: 7.8,  tier: 'B' },
  { name: 'MarkMedia',     data: [9,  16, 5,  28], avg: 12.4, tier: 'C' },
  { name: 'OfficeBase',    data: [2,  4,  1,  7],  avg: 2.9,  tier: 'B' },
];

const TIER_COLORS: Record<string, string> = { A: '#10B981', B: '#3B82F6', C: '#F59E0B' };

const SupplierCandlestickChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const suppliers = useMemo(() => {
    let list = ALL_SUPPLIERS;
    if (filters.supplier !== 'All Suppliers') list = list.filter(s => s.name === filters.supplier);
    if (filters.tier !== 'All Tiers')         list = list.filter(s => `Tier ${s.tier}` === filters.tier.split(' — ')[0]?.replace('Tier ', 'Tier ') || filters.tier.startsWith(`Tier ${s.tier}`));
    return list;
  }, [filters.supplier, filters.tier]);

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
        const idx = params[0]?.dataIndex ?? 0;
        const s   = suppliers[idx];
        if (!s) return '';
        return `<div style="font-weight:600;margin-bottom:6px">${s.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Min: <span style="color:#34D399;font-weight:700">${s.data[2]}d</span><br/>
            Q1 (25%): <span style="color:#60A5FA;font-weight:700">${s.data[0]}d</span><br/>
            Q3 (75%): <span style="color:#A78BFA;font-weight:700">${s.data[1]}d</span><br/>
            Max: <span style="color:#F87171;font-weight:700">${s.data[3]}d</span><br/>
            Avg: <span style="color:#FCD34D;font-weight:700">${s.avg}d</span>
          </div>`;
      },
    },
    legend: {
      data: ['Lead Time Range', 'Avg Lead Time'],
      top: 0, right: 0,
      textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      itemWidth: 10, itemHeight: 10, itemGap: 16,
    },
    grid: { left: '3%', right: '3%', top: '14%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: suppliers.map(s => s.name),
      axisLabel: { color: '#94A3B8', fontSize: 10, rotate: 20, fontFamily: 'Inter, sans-serif' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Days',
      nameTextStyle: { color: '#64748B', fontSize: 10 },
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif', formatter: (v: number) => `${v}d` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'Lead Time Range',
        type: 'candlestick',
        data: suppliers.map(s => s.data),
        itemStyle: {
          color: '#3B82F6',
          color0: '#3B82F6',
          borderColor: '#60A5FA',
          borderColor0: '#60A5FA',
        },
        barMaxWidth: 36,
      },
      {
        name: 'Avg Lead Time',
        type: 'scatter',
        data: suppliers.map((s, i) => [i, s.avg]),
        symbol: 'diamond',
        symbolSize: 10,
        itemStyle: { color: '#FCD34D', borderColor: '#F59E0B', borderWidth: 1.5 },
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => `${p.value[1]}d`,
          color: '#FCD34D',
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
        },
      },
    ],
  }), [suppliers]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default SupplierCandlestickChart;
