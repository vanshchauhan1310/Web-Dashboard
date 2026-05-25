import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useSegmentSales } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const SERIES_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4'];
const AXIS_LABEL = { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' };
const AXIS_LINE = { lineStyle: { color: 'rgba(255,255,255,0.07)' } };
const SPLIT_LINE = { lineStyle: { color: 'rgba(255,255,255,0.05)' } };

const SegmentSalesChart: React.FC = () => {
  const { data, isLoading, isError } = useSegmentSales();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    const segments = Array.from(new Set(data.map((d: any) => d.segment))).sort() as string[];
    const regions = Array.from(new Set(data.map((d: any) => d.region))).sort() as string[];

    const series = regions.map((region, i) => ({
      name: region,
      type: 'bar' as const,
      stack: 'sales',
      emphasis: { focus: 'series' as const },
      barMaxWidth: 36,
      itemStyle: {
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        borderRadius: i === regions.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
      },
      data: segments.map((segment) => {
        const row = data.find((item: any) => item.segment === segment && item.region === region);
        return row ? row.sales : 0;
      }),
    }));

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0A1525',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        extraCssText: 'box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 10px;',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.03)' } },
      },
      legend: {
        type: 'scroll',
        top: '0%',
        itemGap: 10,
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 8,
        itemHeight: 8,
        pageIconColor: '#3B82F6',
        pageIconInactiveColor: '#2D3748',
        pageIconSize: 10,
        pageTextStyle: { color: '#64748B', fontSize: 10 },
        animation: false,
      },
      grid: { left: '2%', right: '3%', bottom: '4%', top: '16%', containLabel: true },
      xAxis: {
        type: 'category',
        data: segments,
        axisLabel: AXIS_LABEL,
        axisLine: AXIS_LINE,
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `$${(v / 1000).toFixed(0)}k` },
        splitLine: SPLIT_LINE,
        axisLine: { show: false },
      },
      series,
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load segment sales</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default SegmentSalesChart;
