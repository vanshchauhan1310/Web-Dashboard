import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useProfitByCategory } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const TOOLTIP_STYLE = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 10px;',
};

const AXIS_LABEL = { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' };
const AXIS_LINE = { lineStyle: { color: 'rgba(255,255,255,0.07)' } };
const SPLIT_LINE = { lineStyle: { color: 'rgba(255,255,255,0.05)' } };

const ProfitByCategoryChart: React.FC = () => {
  const { data, isLoading, isError } = useProfitByCategory();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.03)' } },
      },
      legend: {
        type: 'scroll',
        top: '0%',
        itemGap: 16,
        textStyle: { color: '#94A3B8', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        pageIconColor: '#3B82F6',
        pageIconInactiveColor: '#2D3748',
        pageIconSize: 10,
        pageTextStyle: { color: '#64748B', fontSize: 10 },
        animation: false,
      },
      grid: { left: '2%', right: '3%', bottom: '2%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d: any) => d.category),
        axisLabel: { ...AXIS_LABEL, interval: 0 },
        axisLine: AXIS_LINE,
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: SPLIT_LINE,
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `$${(v / 1000).toFixed(0)}k` },
        axisLine: { show: false },
      },
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: data.map((d: any) => d.revenue),
          barMaxWidth: 28,
          itemStyle: { color: '#60A5FA', borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { opacity: 0.85 } },
        },
        {
          name: 'Profit',
          type: 'bar',
          data: data.map((d: any) => d.profit),
          barMaxWidth: 28,
          itemStyle: { color: '#34D399', borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { opacity: 0.85 } },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load profit by category</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default ProfitByCategoryChart;
