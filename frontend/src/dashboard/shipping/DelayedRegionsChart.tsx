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

interface Props { filters: ShippingFilters }

const DelayedRegionsChart: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useDelayedOrders(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const regionMap = new Map<string, { totalDelay: number; count: number }>();
    data.forEach((row: any) => {
      if (!row.region) return;
      const existing = regionMap.get(row.region) ?? { totalDelay: 0, count: 0 };
      regionMap.set(row.region, {
        totalDelay: existing.totalDelay + (row.delay_days || 0),
        count: existing.count + 1,
      });
    });

    const sorted = Array.from(regionMap.entries())
      .map(([region, { totalDelay, count }]) => ({
        region,
        avgDelay: parseFloat((totalDelay / count).toFixed(1)),
        count,
      }))
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 12);

    const regions = sorted.map((d) => d.region);
    const avgDelays = sorted.map((d) => d.avgDelay);
    const counts = sorted.map((d) => d.count);
    const maxAvg = Math.max(...avgDelays, 1);

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          return `<div style="font-weight:600;margin-bottom:6px">${regions[idx]}</div>
            <div style="line-height:1.9;color:#64748B">
              Avg Delay: <span style="color:#F97316;font-weight:700">${avgDelays[idx]}d</span><br/>
              Delayed Orders: <span style="color:#F43F5E;font-weight:700">${counts[idx]}</span>
            </div>`;
        },
      },
      grid: { left: '2%', right: '8%', bottom: '4%', top: '4%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: (v: number) => `${v}d`,
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: [...regions].reverse(),
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          width: 140,
          overflow: 'truncate',
          formatter: (n: string) => n.length > 20 ? n.slice(0, 18) + '…' : n,
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Avg Delay Days',
          type: 'bar',
          data: [...avgDelays].reverse().map((val, i) => ({
            value: val,
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#7C3AED' },
                  { offset: val / maxAvg, color: '#F97316' },
                  { offset: 1, color: '#EF4444' },
                ],
              },
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barMaxWidth: 22,
          label: {
            show: true,
            position: 'right',
            color: '#94A3B8',
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            formatter: (p: any) => `${p.value}d`,
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load delay regions</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default DelayedRegionsChart;
