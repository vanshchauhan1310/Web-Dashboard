import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const STATUS_DATA = [
  { name: 'Approved',  value: 687, color: '#10B981' },
  { name: 'Pending',   value: 234, color: '#F59E0B' },
  { name: 'Delivered', value: 181, color: '#3B82F6' },
  { name: 'Closed',    value: 56,  color: '#8B5CF6' },
  { name: 'Rejected',  value: 89,  color: '#EF4444' },
];

const PERIOD_SCALE: Record<string, number> = {
  'This Year':     1.0,
  'Last Year':     0.88,
  'Last 6 Months': 0.52,
  'Last Quarter':  0.28,
  'This Month':    0.09,
  'All Time':      1.0,
};

const POStatusDonutChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const data = useMemo(() => {
    const scale = PERIOD_SCALE[filters.time_period] ?? 1;
    let items = STATUS_DATA.map(d => ({ ...d, value: Math.round(d.value * scale) }));
    if (filters.status !== 'All Statuses') {
      items = items.filter(d => d.name === filters.status);
    }
    return items;
  }, [filters.time_period, filters.status]);

  const total = data.reduce((s, d) => s + d.value, 0);

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
        const pct = ((params.value / total) * 100).toFixed(1);
        return `<div style="font-weight:600;margin-bottom:4px">${params.name}</div>
          POs: <span style="color:${params.color};font-weight:700">${params.value.toLocaleString()}</span>
          <span style="color:#64748B"> (${pct}%)</span>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '4%',
      top: 'center',
      textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 10,
      icon: 'circle',
      formatter: (name: string) => {
        const item = data.find(d => d.name === name);
        return item ? `${name}  ${item.value.toLocaleString()}` : name;
      },
    },
    graphic: [{
      type: 'text',
      left: '32%',
      top: 'center',
      style: {
        text: `${total.toLocaleString()}\nTotal POs`,
        textAlign: 'center',
        fill: '#F1F5F9',
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        lineHeight: 24,
      },
    }],
    series: [{
      type: 'pie',
      radius: ['52%', '78%'],
      center: ['32%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 8,
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' },
      },
      data: data.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: {
          color: d.color,
          borderColor: '#0E1C30',
          borderWidth: 3,
          borderRadius: 4,
        },
      })),
    }],
  }), [data, total]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default POStatusDonutChart;
