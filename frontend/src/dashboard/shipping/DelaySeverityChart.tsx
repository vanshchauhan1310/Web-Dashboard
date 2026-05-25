import { useMemo } from 'react';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { useDelayedOrders, type ShippingFilters } from '../../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const TOOLTIP = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14] as [number, number],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
};

const BUCKETS = [
  { label: 'Mild (1–3d)',    color: '#F59E0B', test: (d: number) => d >= 1 && d <= 3 },
  { label: 'Moderate (4–7d)', color: '#F97316', test: (d: number) => d >= 4 && d <= 7 },
  { label: 'Severe (7d+)',   color: '#EF4444', test: (d: number) => d > 7  },
];

const MODES = ['First Class', 'Second Class', 'Same Day', 'Standard Class'];

interface Props { filters: ShippingFilters }

const DelaySeverityChart: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useDelayedOrders(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const counts: Record<string, Record<string, number>> = {};
    MODES.forEach((m) => { counts[m] = { 'Mild (1–3d)': 0, 'Moderate (4–7d)': 0, 'Severe (7d+)': 0 }; });

    data.forEach((row: any) => {
      const mode = row.ship_mode;
      if (!counts[mode]) counts[mode] = { 'Mild (1–3d)': 0, 'Moderate (4–7d)': 0, 'Severe (7d+)': 0 };
      const bucket = BUCKETS.find((b) => b.test(row.delay_days));
      if (bucket) counts[mode][bucket.label] = (counts[mode][bucket.label] ?? 0) + 1;
    });

    const modes = MODES.filter((m) => Object.values(counts[m]).some((v) => v > 0));

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const mode = params[0]?.name ?? '';
          const total = params.reduce((s: number, p: any) => s + (p.value || 0), 0);
          const lines = params
            .filter((p: any) => p.value > 0)
            .map((p: any) =>
              `<span style="color:${p.color}">● </span>${p.seriesName}: <b>${p.value}</b> (${total ? ((p.value / total) * 100).toFixed(0) : 0}%)`
            ).join('<br/>');
          return `<div style="font-weight:600;margin-bottom:6px">${mode}</div><div style="line-height:1.9">${lines}</div><div style="color:#64748B;margin-top:4px;font-size:11px">Total delayed: ${total}</div>`;
        },
      },
      legend: {
        top: 0,
        left: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 20,
      },
      grid: { left: '2%', right: '3%', bottom: '8%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: modes,
        axisLabel: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#64748B', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false },
      },
      series: BUCKETS.map((bucket, i) => ({
        name: bucket.label,
        type: 'bar',
        stack: 'total',
        barMaxWidth: 52,
        emphasis: { focus: 'series' },
        data: modes.map((m) => counts[m]?.[bucket.label] ?? 0),
        itemStyle: {
          color: bucket.color,
          borderRadius: i === BUCKETS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
        },
      })),
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load delay data</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default DelaySeverityChart;
