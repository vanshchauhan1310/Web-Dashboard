import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useProductRevenueProfitScatter } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const PALETTE = ['#3B82F6', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6', '#06B6D4'];

const RevenueVsProfitScatterChart: React.FC = () => {
  const { data, isLoading, isError } = useProductRevenueProfitScatter();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const categories: string[] = [...new Set<string>(data.map((d: any) => d.category))];
    const colorMap: Record<string, string> = {};
    categories.forEach((cat, i) => { colorMap[cat] = PALETTE[i % PALETTE.length]; });

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0A1525',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        extraCssText: 'box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 10px;',
        formatter: (params: any) => {
          const [rev, prof, , name, cat] = params.data;
          const profColor = prof >= 0 ? '#34D399' : '#F87171';
          return `<div style="font-weight:600;margin-bottom:6px;max-width:220px;white-space:normal">${name}</div>
            <div style="color:#64748B;line-height:1.9">
              Revenue: <span style="color:#60A5FA;font-weight:700">$${Math.round(rev).toLocaleString()}</span><br/>
              Profit: <span style="color:${profColor};font-weight:700">$${Math.round(prof).toLocaleString()}</span><br/>
              Category: <span style="color:#E2E8F0">${cat}</span>
            </div>`;
        },
      },
      legend: {
        data: categories,
        top: 0,
        left: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 20,
      },
      grid: { left: '6%', right: '4%', bottom: '8%', top: '14%', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Revenue ($)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      },
      yAxis: {
        type: 'value',
        name: 'Profit ($)',
        nameLocation: 'middle',
        nameGap: 52,
        nameTextStyle: { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      },
      series: categories.map((cat) => ({
        name: cat,
        type: 'scatter',
        data: data
          .filter((d: any) => d.category === cat)
          .map((d: any) => [d.revenue, d.profit, d.quantity, d.product, d.category]),
        symbolSize: (val: any) => Math.max(6, Math.min(26, Math.sqrt(val[2] || 1) * 1.8)),
        itemStyle: {
          color: colorMap[cat],
          opacity: 0.72,
          borderColor: `${colorMap[cat]}55`,
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: colorMap[cat],
          },
        },
      })),
    };
  }, [data]);

  if (isError) return (
    <div className="text-rose-400 flex items-center justify-center h-full text-sm">
      Failed to load revenue vs profit data
    </div>
  );

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default RevenueVsProfitScatterChart;
