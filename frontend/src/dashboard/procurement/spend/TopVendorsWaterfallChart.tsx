import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import type { EChartsCoreOption } from 'echarts';

const VENDORS = [
  { name: 'SupplyCo Ltd',  spend: 320 },
  { name: 'TechVend Inc',  spend: 245 },
  { name: 'LogiPro',       spend: 185 },
  { name: 'ConsultPro',    spend: 140 },
  { name: 'PowerGrid Co',  spend: 95  },
  { name: 'MarkMedia',     spend: 75  },
  { name: 'Others',        spend: 180 },
];

const TopVendorsWaterfallChart: React.FC = () => {
  const { labels, placeholders, bars, total } = useMemo(() => {
    let running = 0;
    const placeholders: number[] = [];
    const bars: number[]         = [];

    VENDORS.forEach(v => {
      placeholders.push(running);
      bars.push(v.spend);
      running += v.spend;
    });
    // Total bar
    placeholders.push(0);
    bars.push(running);

    return {
      labels: [...VENDORS.map(v => v.name), 'Total'],
      placeholders,
      bars,
      total: running,
    };
  }, []);

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
        if (idx === labels.length - 1) {
          return `<div style="font-weight:600">Total Vendor Spend</div>
            <span style="color:#10B981;font-weight:700">$${total}K</span>`;
        }
        const v   = VENDORS[idx];
        const pct = ((v.spend / total) * 100).toFixed(1);
        return `<div style="font-weight:600;margin-bottom:4px">${v.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Spend: <span style="color:#10B981;font-weight:700">$${v.spend}K</span><br/>
            Share: <span style="color:#60A5FA;font-weight:700">${pct}% of total</span>
          </div>`;
      },
    },
    grid: { left: '3%', right: '3%', top: '8%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#94A3B8', fontSize: 10, rotate: 30, fontFamily: 'Inter, sans-serif' },
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
        // Transparent spacer
        type: 'bar',
        stack: 'wf',
        data: placeholders,
        itemStyle: { color: 'transparent', borderColor: 'transparent' },
        silent: true,
      },
      {
        // Visible spend
        type: 'bar',
        stack: 'wf',
        barMaxWidth: 44,
        data: bars.map((v, i) => ({
          value: v,
          itemStyle: {
            color: i === labels.length - 1
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#059669aa' }] }
              : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3B82F6cc' }, { offset: 1, color: '#6366F1aa' }] },
            borderRadius: [5, 5, 0, 0],
          },
        })),
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => `$${p.value}K`,
          color: '#94A3B8',
          fontSize: 9,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
        },
      },
    ],
  }), [labels, placeholders, bars, total]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default TopVendorsWaterfallChart;
