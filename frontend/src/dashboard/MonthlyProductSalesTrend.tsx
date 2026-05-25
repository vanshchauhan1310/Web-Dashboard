import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useMonthlyRevenue } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const MonthlyProductSalesTrend: React.FC = () => {
  const { data, isLoading, isError } = useMonthlyRevenue();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const months = data.map((d: any) => d.month);
    const revenues = data.map((d: any) => d.revenue);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0A1525',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        extraCssText: 'box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 10px;',
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(59,130,246,0.4)', width: 1, type: 'dashed' } },
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-weight:600;margin-bottom:6px">${p.name}</div>
            <div style="color:#94A3B8">Sales: <span style="color:#60A5FA;font-weight:700">$${Math.round(p.value).toLocaleString()}</span></div>`;
        },
      },
      grid: { left: '2%', right: '3%', bottom: '10%', top: '6%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          rotate: 35,
          interval: Math.floor(months.length / 12),
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        },
        axisLine: { show: false },
      },
      series: [
        {
          name: 'Monthly Sales',
          type: 'line',
          data: revenues,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          lineStyle: { color: '#3B82F6', width: 2.5 },
          itemStyle: { color: '#3B82F6', borderColor: '#0E1C30', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.28)' },
                { offset: 1, color: 'rgba(59,130,246,0.02)' },
              ],
            },
          },
          emphasis: {
            showSymbol: true,
            itemStyle: {
              color: '#60A5FA',
              borderColor: '#fff',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(59,130,246,0.6)',
            },
          },
        },
      ],
    };
  }, [data]);

  if (isError) return (
    <div className="text-rose-400 flex items-center justify-center h-full text-sm">
      Failed to load sales trend
    </div>
  );

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default MonthlyProductSalesTrend;
