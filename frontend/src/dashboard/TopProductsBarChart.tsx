import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useTopProducts } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const BAR_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899'];

const TopProductsBarChart: React.FC = () => {
  const { data, isLoading, isError } = useTopProducts();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const sorted = [...data].sort((a: any, b: any) => a.revenue - b.revenue);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.03)' } },
        backgroundColor: '#0A1525',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        extraCssText: 'box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 10px;',
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-weight:600;margin-bottom:4px;max-width:200px;white-space:normal">${p.name}</div>
            <div style="color:#94A3B8">Revenue: <span style="color:${BAR_COLORS[sorted.findIndex((d: any) => d.product === p.name) % BAR_COLORS.length]};font-weight:700">$${Math.round(p.value).toLocaleString()}</span></div>`;
        },
      },
      grid: { left: '2%', right: '8%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((d: any) => d.product),
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          width: 160,
          overflow: 'truncate',
          formatter: (name: string) => name.length > 32 ? name.slice(0, 29) + '…' : name,
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((d: any, i: number) => ({
            value: d.revenue,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: `${BAR_COLORS[i % BAR_COLORS.length]}55` },
                  { offset: 1, color: BAR_COLORS[i % BAR_COLORS.length] },
                ],
              },
              borderRadius: [0, 5, 5, 0],
            },
          })),
          barMaxWidth: 24,
          emphasis: { itemStyle: { opacity: 0.85 } },
          label: {
            show: true,
            position: 'right',
            color: '#94A3B8',
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            formatter: (params: any) => `$${(params.value / 1000).toFixed(1)}k`,
          },
        },
      ],
    };
  }, [data]);

  if (isError) return (
    <div className="text-rose-400 flex items-center justify-center h-full text-sm">
      Failed to load top products
    </div>
  );

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default TopProductsBarChart;
