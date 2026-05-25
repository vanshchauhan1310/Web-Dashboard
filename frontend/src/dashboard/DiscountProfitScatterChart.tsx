import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useDiscountProfitScatter } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const AXIS_LABEL = { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' };
const AXIS_LINE = { lineStyle: { color: 'rgba(255,255,255,0.07)' } };
const SPLIT_LINE = { lineStyle: { color: 'rgba(255,255,255,0.05)' } };

const DiscountProfitScatterChart: React.FC = () => {
  const { data, isLoading, isError } = useDiscountProfitScatter();

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
          if (params.componentSubType === 'scatter') {
            const { value } = params;
            return `<div style="font-weight:600;margin-bottom:6px">Order Details</div><div style="color:#64748B;line-height:1.8">Discount: <span style="color:#FB923C;font-weight:700">${(value[0] * 100).toFixed(1)}%</span><br/>Profit: <span style="color:#34D399;font-weight:700">$${value[1].toLocaleString()}</span><br/>Sales: <span style="color:#60A5FA;font-weight:700">$${Math.round(value[2]).toLocaleString()}</span></div>`;
          }
          return '';
        },
      },
      xAxis: {
        type: 'value',
        name: 'Discount Rate',
        nameTextStyle: { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
        axisLine: AXIS_LINE,
        splitLine: SPLIT_LINE,
      },
      yAxis: {
        type: 'value',
        name: 'Profit ($)',
        nameTextStyle: { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `$${(v / 1000).toFixed(0)}k` },
        axisLine: AXIS_LINE,
        splitLine: SPLIT_LINE,
      },
      grid: { left: '8%', right: '4%', bottom: '10%', top: '8%', containLabel: true },
      series: [
        {
          name: 'Orders',
          type: 'scatter',
          data: data.map((d: any) => [d.discount, d.profit, d.sales || 0]),
          symbolSize: (value: any) => Math.max(5, Math.min(28, Math.sqrt(value[2] || 1) * 0.75)),
          itemStyle: {
            color: '#F97316',
            opacity: 0.65,
            borderColor: 'rgba(251, 146, 60, 0.5)',
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              borderWidth: 2,
              borderColor: '#FDBA74',
              shadowColor: 'rgba(249, 115, 22, 0.5)',
              shadowBlur: 12,
            },
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load discount vs profit</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default DiscountProfitScatterChart;
