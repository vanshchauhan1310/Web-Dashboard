import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useSalesTrend } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';
import * as echarts from 'echarts';

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

const SalesTrendChart: React.FC = () => {
  const { data, isLoading, isError } = useSalesTrend();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div><div style="color:#64748B">Sales: <span style="color:#10B981;font-weight:700">$${Number(p.value).toLocaleString()}</span></div>`;
        },
      },
      grid: { left: '2%', right: '3%', bottom: '2%', top: '4%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((d: any) => d.month),
        axisLabel: AXIS_LABEL,
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
          name: 'Sales',
          type: 'line',
          smooth: true,
          data: data.map((d: any) => d.sales),
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' },
            ]),
          },
          lineStyle: { color: '#10B981', width: 2.5 },
          itemStyle: { color: '#10B981', borderWidth: 2, borderColor: '#0E1C30' },
          emphasis: { scale: true },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load data</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default SalesTrendChart;
