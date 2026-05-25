import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import type { EChartsCoreOption } from 'echarts';

const STAGES = [
  { name: 'Requisitions',    value: 100, amount: '$4.8M', color: '#3B82F6' },
  { name: 'PO Raised',       value: 82,  amount: '$3.9M', color: '#6366F1' },
  { name: 'PO Approved',     value: 75,  amount: '$3.6M', color: '#8B5CF6' },
  { name: 'Goods Received',  value: 68,  amount: '$3.3M', color: '#10B981' },
  { name: 'Invoice Matched', value: 62,  amount: '$3.0M', color: '#059669' },
  { name: 'Payment Done',    value: 58,  amount: '$2.8M', color: '#34D399' },
];

const ProcurementFunnelChart: React.FC = () => {
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
        const stage = STAGES.find(s => s.name === params.name);
        const prev  = STAGES[params.dataIndex - 1];
        const drop  = prev ? (100 - Math.round((params.value / prev.value) * 100)) : 0;
        return `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Spend: <span style="color:#10B981;font-weight:700">${stage?.amount}</span><br/>
            Conversion: <span style="color:#60A5FA;font-weight:700">${params.value}%</span>
            ${prev ? `<br/>Drop-off: <span style="color:#F87171;font-weight:700">-${drop}%</span>` : ''}
          </div>`;
      },
    },
    series: [{
      type: 'funnel',
      left: '4%',
      top: 16,
      bottom: 16,
      width: '92%',
      min: 50,
      max: 100,
      minSize: '42%',
      maxSize: '100%',
      sort: 'descending',
      gap: 4,
      label: {
        show: true,
        position: 'inside',
        formatter: (params: any) => {
          const s = STAGES.find(st => st.name === params.name);
          return `{name|${params.name}}  {pct|${params.value}%}\n{amt|${s?.amount ?? ''}}`;
        },
        rich: {
          name: { color: '#fff',     fontWeight: 700, fontSize: 11, lineHeight: 22 },
          pct:  { color: '#94A3B8', fontWeight: 600, fontSize: 10 },
          amt:  { color: '#34D399', fontWeight: 700, fontSize: 12, lineHeight: 20 },
        },
      },
      labelLine: { show: false },
      data: STAGES.map(s => ({
        name:  s.name,
        value: s.value,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: s.color + 'aa' },
              { offset: 1, color: s.color },
            ],
          },
          borderWidth: 0,
        },
        emphasis: { itemStyle: { color: s.color, shadowBlur: 20, shadowColor: s.color + '60' } },
      })),
    }],
  }), []);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default ProcurementFunnelChart;
