import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

// [costEfficiency, qualityScore, orderVolume, name, tier]
const ALL_SUPPLIERS = [
  { name: 'SupplyCo Ltd', cost: 88, quality: 92, volume: 145, tier: 'A', color: '#10B981' },
  { name: 'TechVend Inc', cost: 72, quality: 95, volume: 98,  tier: 'A', color: '#10B981' },
  { name: 'LogiPro',      cost: 91, quality: 81, volume: 210, tier: 'B', color: '#3B82F6' },
  { name: 'ConsultPro',   cost: 78, quality: 89, volume: 34,  tier: 'A', color: '#10B981' },
  { name: 'PowerGrid Co', cost: 94, quality: 86, volume: 48,  tier: 'B', color: '#3B82F6' },
  { name: 'MarkMedia',    cost: 88, quality: 75, volume: 22,  tier: 'C', color: '#F59E0B' },
  { name: 'OfficeBase',   cost: 96, quality: 84, volume: 180, tier: 'B', color: '#3B82F6' },
];

const TIER_COLORS: Record<string, string> = { A: '#10B981', B: '#3B82F6', C: '#F59E0B' };
const TIER_LABELS: Record<string, string>  = { A: 'Tier A — Preferred', B: 'Tier B — Approved', C: 'Tier C — Conditional' };

const SupplierScatterChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const suppliers = useMemo(() => {
    let list = ALL_SUPPLIERS;
    if (filters.supplier !== 'All Suppliers') list = list.filter(s => s.name === filters.supplier);
    if (filters.tier !== 'All Tiers')         list = list.filter(s => filters.tier.startsWith(`Tier ${s.tier}`));
    return list;
  }, [filters.supplier, filters.tier]);

  // Group by tier for legend
  const tierGroups = useMemo(() => {
    const groups: Record<string, typeof suppliers> = {};
    suppliers.forEach(s => {
      if (!groups[s.tier]) groups[s.tier] = [];
      groups[s.tier].push(s);
    });
    return groups;
  }, [suppliers]);

  const option = useMemo<EChartsCoreOption>(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0A1525',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: [10, 14] as [number, number],
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
      formatter: (params: any) => {
        const [cost, quality, volume, name, tier] = params.value as [number, number, number, string, string];
        return `<div style="font-weight:600;margin-bottom:6px">${name}</div>
          <div style="color:#94A3B8;line-height:2">
            Cost Efficiency: <span style="color:#60A5FA;font-weight:700">${cost}/100</span><br/>
            Quality Score: <span style="color:#10B981;font-weight:700">${quality}/100</span><br/>
            Order Volume: <span style="color:#FCD34D;font-weight:700">${volume} orders</span><br/>
            Tier: <span style="color:${TIER_COLORS[tier]};font-weight:700">${tier}</span>
          </div>`;
      },
    },
    legend: {
      data: Object.keys(tierGroups).map(t => TIER_LABELS[t]),
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 16,
      icon: 'circle',
    },
    grid: { left: '5%', right: '5%', top: '10%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Cost Efficiency →',
      nameLocation: 'end',
      nameTextStyle: { color: '#475569', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      min: 60, max: 100,
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: {
      type: 'value',
      name: '← Quality Score',
      nameLocation: 'end',
      nameTextStyle: { color: '#475569', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      min: 60, max: 100,
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    // Quadrant lines
    markLine: { silent: true },
    series: [
      // Quadrant reference lines (invisible series)
      {
        type: 'line',
        silent: true,
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed', width: 1 },
          data: [{ xAxis: 80 }, { yAxis: 85 }],
          label: { show: false },
        },
        data: [],
      },
      // Scatter per tier
      ...Object.entries(tierGroups).map(([tier, items]) => ({
        name: TIER_LABELS[tier],
        type: 'scatter' as const,
        data: items.map(s => [s.cost, s.quality, s.volume, s.name, s.tier]),
        symbolSize: (val: number[]) => Math.sqrt(val[2]) * 3.5,
        itemStyle: {
          color: TIER_COLORS[tier],
          opacity: 0.85,
          borderColor: TIER_COLORS[tier] + 'aa',
          borderWidth: 1.5,
        },
        label: {
          show: true,
          formatter: (p: any) => p.value[3],
          position: 'top',
          color: '#94A3B8',
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
        },
        emphasis: { scale: 1.2 },
      })),
    ],
  }), [tierGroups, suppliers]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default SupplierScatterChart;
