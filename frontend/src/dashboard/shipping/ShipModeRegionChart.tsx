import { useMemo } from 'react';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { useShipModeMix, type ShippingFilters } from '../../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const MODE_COLORS: Record<string, string> = {
  'First Class':    '#3B82F6',
  'Same Day':       '#10B981',
  'Second Class':   '#F59E0B',
  'Standard Class': '#8B5CF6',
};
const FALLBACK = ['#06B6D4', '#F43F5E', '#EC4899', '#84CC16'];

const TOOLTIP = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14] as [number, number],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
};

interface Props { filters: ShippingFilters }

const ShipModeRegionChart: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useShipModeMix(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const regions: string[] = [...new Set<string>(data.map((d: any) => d.region))];
    const modes: string[] = [...new Set<string>(data.map((d: any) => d.ship_mode))].sort();

    const byKey = new Map<string, number>();
    data.forEach((d: any) => byKey.set(`${d.region}|${d.ship_mode}`, d.orders));

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const region = params[0]?.name ?? '';
          const total = params.reduce((s: number, p: any) => s + (p.value || 0), 0);
          const lines = params
            .filter((p: any) => p.value > 0)
            .map((p: any) => `<span style="color:${p.color}">● </span>${p.seriesName}: <span style="font-weight:700">${p.value.toLocaleString()}</span> (${total ? ((p.value / total) * 100).toFixed(1) : 0}%)`)
            .join('<br/>');
          return `<div style="font-weight:600;margin-bottom:6px">${region}</div><div style="line-height:1.9">${lines}</div><div style="color:#64748B;margin-top:4px;font-size:11px">Total: ${total.toLocaleString()}</div>`;
        },
      },
      legend: {
        top: 0,
        left: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16,
      },
      grid: { left: '2%', right: '3%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: regions,
        axisLabel: {
          color: '#94A3B8',
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
          rotate: 35,
          interval: 0,
          formatter: (n: string) => n.length > 14 ? n.slice(0, 12) + '…' : n,
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false },
      },
      series: modes.map((mode, i) => ({
        name: mode,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        barMaxWidth: 36,
        data: regions.map((r) => byKey.get(`${r}|${mode}`) ?? 0),
        itemStyle: {
          color: MODE_COLORS[mode] ?? FALLBACK[i % FALLBACK.length],
          borderRadius: i === modes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
        },
      })),
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load ship mode mix</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default ShipModeRegionChart;
