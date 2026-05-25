import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useProfitByCategory } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#F43F5E', '#06B6D4'];

const CategoryContributionDonut: React.FC = () => {
  const { data, isLoading, isError } = useProfitByCategory();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const total = data.reduce((sum: number, d: any) => sum + (d.revenue || 0), 0);

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
          return `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>
            <div style="color:#64748B;line-height:1.8">
              Revenue: <span style="color:${params.color};font-weight:700">$${Math.round(params.value).toLocaleString()}</span><br/>
              Share: <span style="color:#E2E8F0;font-weight:600">${params.percent}%</span>
            </div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        formatter: (name: string) => {
          const item = data.find((d: any) => d.category === name);
          const pct = total > 0 ? ((item?.revenue || 0) / total * 100).toFixed(1) : '0';
          return `{name|${name}}  {pct|${pct}%}`;
        },
        textStyle: {
          rich: {
            name: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
            pct: { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' },
          },
        } as any,
      },
      graphic: [
        {
          type: 'text',
          left: '33%',
          top: '44%',
          style: {
            text: total > 0 ? `$${(total / 1000000).toFixed(1)}M` : '',
            textAlign: 'center',
            fill: '#F1F5F9',
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'Inter, sans-serif',
          },
        },
        {
          type: 'text',
          left: '33%',
          top: '56%',
          style: {
            text: 'Total Revenue',
            textAlign: 'center',
            fill: '#64748B',
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
          },
        },
      ],
      series: [
        {
          type: 'pie',
          radius: ['44%', '70%'],
          center: ['34%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#F1F5F9',
              formatter: '{b}\n{d}%',
            },
            itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
            scale: true,
            scaleSize: 6,
          },
          data: data.map((d: any, i: number) => ({
            name: d.category,
            value: d.revenue,
            itemStyle: { color: COLORS[i % COLORS.length] },
          })),
        },
      ],
    };
  }, [data]);

  if (isError) return (
    <div className="text-rose-400 flex items-center justify-center h-full text-sm">
      Failed to load category contribution
    </div>
  );

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default CategoryContributionDonut;
