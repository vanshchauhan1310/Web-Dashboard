import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const ALL_SUPPLIERS = [
  { name: 'MarkMedia',     score: 75.6, tier: 'C' },
  { name: 'LogiPro',       score: 82.8, tier: 'B' },
  { name: 'TechVend Inc',  score: 84.0, tier: 'A' },
  { name: 'PowerGrid Co',  score: 84.4, tier: 'B' },
  { name: 'ConsultPro',    score: 84.4, tier: 'A' },
  { name: 'OfficeBase',    score: 88.0, tier: 'B' },
  { name: 'SupplyCo Ltd',  score: 89.8, tier: 'A' },
];

const TIER_COLORS: Record<string, string> = { A: '#10B981', B: '#3B82F6', C: '#F59E0B' };
const TARGET = 85;

const SupplierBulletChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const suppliers = useMemo(() => {
    let list = ALL_SUPPLIERS;
    if (filters.supplier !== 'All Suppliers') list = list.filter(s => s.name === filters.supplier);
    if (filters.tier !== 'All Tiers')         list = list.filter(s => filters.tier.startsWith(`Tier ${s.tier}`));
    return list;
  }, [filters.supplier, filters.tier]);

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
        const s = suppliers[p.dataIndex];
        if (!s) return '';
        const status = s.score >= TARGET ? 'Above Target' : 'Below Target';
        const sColor = s.score >= TARGET ? '#10B981' : '#F59E0B';
        return `<div style="font-weight:600;margin-bottom:4px">${s.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Score: <span style="color:${TIER_COLORS[s.tier]};font-weight:700">${s.score}</span><br/>
            Tier: <span style="color:#94A3B8;font-weight:700">${s.tier}</span><br/>
            Status: <span style="color:${sColor};font-weight:700">${status}</span>
          </div>`;
      },
    },
    grid: { left: '2%', right: '5%', top: '4%', bottom: '4%', containLabel: true },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif', formatter: (v: number) => `${v}` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: suppliers.map(s => s.name),
      axisLabel: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      axisTick: { show: false },
    },
    series: [
      {
        // Background zone bands via markArea
        type: 'bar',
        silent: true,
        barWidth: 20,
        data: suppliers.map(() => 100),
        itemStyle: { color: 'transparent' },
        markArea: {
          silent: true,
          data: [
            [{ xAxis: 0,  itemStyle: { color: 'rgba(239,68,68,0.12)',   borderColor: 'transparent' } }, { xAxis: 70  }],
            [{ xAxis: 70, itemStyle: { color: 'rgba(245,158,11,0.12)',  borderColor: 'transparent' } }, { xAxis: 82  }],
            [{ xAxis: 82, itemStyle: { color: 'rgba(16,185,129,0.10)', borderColor: 'transparent' } }, { xAxis: 100 }],
          ],
        },
        markLine: {
          symbol: ['none', 'none'],
          silent: true,
          data: [{ xAxis: TARGET }],
          lineStyle: { color: 'rgba(255,255,255,0.5)', width: 2, type: 'dashed' },
          label: { show: true, formatter: `Target ${TARGET}`, color: '#94A3B8', fontSize: 9, position: 'insideEndTop', fontFamily: 'Inter, sans-serif' },
        },
      },
      {
        // Actual score bar
        type: 'bar',
        barWidth: 20,
        data: suppliers.map(s => ({
          value: s.score,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: TIER_COLORS[s.tier] + '66' },
                { offset: 1, color: TIER_COLORS[s.tier] },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => `${p.value}`,
          color: '#94A3B8',
          fontSize: 10,
          fontWeight: 600,
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

export default SupplierBulletChart;
