import { useMemo } from 'react';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { useShippingRegionPerformance, type ShippingFilters } from '../../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];

const TOOLTIP = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14] as [number, number],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
};

interface Props { filters: ShippingFilters }

const ShippingRadarChart: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useShippingRegionPerformance(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const top = data.slice(0, 7);
    const maxOrders = Math.max(...top.map((d: any) => d.orders), 1);
    const maxCost = Math.max(...top.map((d: any) => d.shipping_cost), 1);
    const maxDays = Math.max(...top.map((d: any) => d.avg_days), 1);
    const maxAvgCost = Math.max(...top.map((d: any) => d.avg_cost), 1);

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'item',
        formatter: (params: any) => {
          const d = top.find((r: any) => r.region === params.name);
          if (!d) return '';
          return `<div style="font-weight:600;margin-bottom:6px">${d.region}</div>
            <div style="color:#64748B;line-height:1.9">
              Orders: <span style="color:#60A5FA;font-weight:700">${d.orders.toLocaleString()}</span><br/>
              On-Time: <span style="color:#34D399;font-weight:700">${d.on_time_rate}%</span><br/>
              Avg Days: <span style="color:#F59E0B;font-weight:700">${d.avg_days}d</span><br/>
              Total Cost: <span style="color:#A78BFA;font-weight:700">$${Math.round(d.shipping_cost).toLocaleString()}</span><br/>
              Avg Cost: <span style="color:#FB923C;font-weight:700">$${d.avg_cost.toFixed(2)}</span>
            </div>`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        left: 'center',
        textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        pageIconColor: '#3B82F6',
        pageIconInactiveColor: '#2D3748',
        pageIconSize: 10,
        pageTextStyle: { color: '#64748B', fontSize: 10 },
      },
      radar: {
        indicator: [
          { name: 'Order Volume', max: maxOrders },
          { name: 'On-Time %', max: 100 },
          { name: 'Avg Days', max: maxDays },
          { name: 'Total Cost', max: maxCost },
          { name: 'Avg Cost/Order', max: maxAvgCost },
        ],
        center: ['50%', '46%'],
        radius: '60%',
        splitNumber: 4,
        axisName: {
          color: '#94A3B8',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)'] } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      },
      series: [
        {
          type: 'radar',
          data: top.map((d: any, i: number) => ({
            name: d.region,
            value: [d.orders, d.on_time_rate, d.avg_days, d.shipping_cost, d.avg_cost],
            itemStyle: { color: PALETTE[i % PALETTE.length] },
            lineStyle: { color: PALETTE[i % PALETTE.length], width: 1.5 },
            areaStyle: { color: `${PALETTE[i % PALETTE.length]}22` },
            symbol: 'circle',
            symbolSize: 5,
          })),
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load region performance</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default ShippingRadarChart;
