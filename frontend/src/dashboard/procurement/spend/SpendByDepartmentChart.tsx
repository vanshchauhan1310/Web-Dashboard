import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const ALL_DEPTS = [
  { name: 'Operations', value: 38, amount: '$1.03M', color: '#3B82F6' },
  { name: 'IT',         value: 22, amount: '$0.60M', color: '#10B981' },
  { name: 'Finance',    value: 12, amount: '$0.33M', color: '#8B5CF6' },
  { name: 'Marketing',  value: 10, amount: '$0.27M', color: '#EC4899' },
  { name: 'HR',         value: 8,  amount: '$0.22M', color: '#F59E0B' },
  { name: 'R&D',        value: 6,  amount: '$0.16M', color: '#06B6D4' },
  { name: 'Legal',      value: 4,  amount: '$0.11M', color: '#34D399' },
];

const SpendByDepartmentChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const data = useMemo(() =>
    filters.department === 'All Departments'
      ? ALL_DEPTS
      : ALL_DEPTS.filter(d => d.name === filters.department),
  [filters.department]);

  const centerLabel = useMemo(() => {
    if (filters.department !== 'All Departments') {
      const d = ALL_DEPTS.find(x => x.name === filters.department);
      return `{title|${d?.name ?? ''}}\n{value|${d?.amount ?? ''}}`;
    }
    return '{title|Total Spend}\n{value|$2.71M}';
  }, [filters.department]);

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
        const dept = ALL_DEPTS.find(d => d.name === params.name);
        return `<div style="font-weight:600;margin-bottom:4px">${params.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Share: <span style="color:${params.color};font-weight:700">${params.value}%</span><br/>
            Amount: <span style="color:#10B981;font-weight:700">${dept?.amount ?? ''}</span>
          </div>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'middle',
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 10,
      icon: 'circle',
    },
    series: [{
      type: 'pie',
      radius: ['42%', '70%'],
      center: ['40%', '50%'],
      padAngle: 2,
      itemStyle: { borderRadius: 5, borderColor: 'transparent', borderWidth: 2 },
      label: {
        show: true,
        position: 'center',
        formatter: () => centerLabel,
        rich: {
          title: { color: '#64748B', fontSize: 10, lineHeight: 22, fontFamily: 'Inter, sans-serif' },
          value: { color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 28, fontFamily: 'Inter, sans-serif' },
        },
      },
      emphasis: {
        scale: true,
        scaleSize: 6,
        label: { show: true },
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' },
      },
      data: data.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color },
      })),
    }],
  }), [data, centerLabel]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default SpendByDepartmentChart;
