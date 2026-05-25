import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useOrderPriorityDistribution } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

const OrderPriorityChart: React.FC = () => {
  const { data, isLoading, isError } = useOrderPriorityDistribution();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

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
          return `<div style="font-weight:600;margin-bottom:4px">${params.name}</div><div style="color:#64748B">Orders: <span style="color:${params.color};font-weight:700">${params.value.toLocaleString()}</span> <span style="color:#64748B">(${params.percent}%)</span></div>`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: '2%',
        itemGap: 12,
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 8,
        itemHeight: 8,
        pageIconColor: '#3B82F6',
        pageIconInactiveColor: '#2D3748',
        pageIconSize: 10,
        pageTextStyle: { color: '#64748B', fontSize: 10 },
        animation: false,
      },
      series: [
        {
          name: 'Order Priority',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#0E1C30',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#F1F5F9',
              fontFamily: 'Inter, sans-serif',
            },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.5)',
            },
          },
          data: data.map((d: any, i: number) => ({
            name: d.priority,
            value: d.value,
            itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
          })),
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load order priority data</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default OrderPriorityChart;
