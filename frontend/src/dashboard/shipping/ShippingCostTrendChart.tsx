import { useMemo } from 'react';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { useDeliveryTrend, type ShippingFilters } from '../../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const TOOLTIP = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14] as [number, number],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
};

interface Props { filters: ShippingFilters }

const ShippingCostTrendChart: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useDeliveryTrend(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const months = data.map((d: any) => d.month);
    const costs = data.map((d: any) => parseFloat((d.shipping_cost ?? 0).toFixed(2)));
    const orders = data.map((d: any) => d.orders);

    const fmtCost = (v: number) =>
      v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M`
      : v >= 1_000   ? `$${(v / 1_000).toFixed(1)}k`
      : `$${v.toFixed(0)}`;

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#0A1525' } },
        formatter: (params: any) => {
          const month = params[0]?.name ?? '';
          const cost  = params.find((p: any) => p.seriesName === 'Shipping Cost');
          const vol   = params.find((p: any) => p.seriesName === 'Shipments');
          return `<div style="font-weight:600;margin-bottom:6px">${month}</div>
            <div style="line-height:1.9;color:#64748B">
              Shipping Cost: <span style="color:#A78BFA;font-weight:700">${fmtCost(cost?.value ?? 0)}</span><br/>
              Shipments: <span style="color:#60A5FA;font-weight:700">${(vol?.value ?? 0).toLocaleString()}</span>
            </div>`;
        },
      },
      legend: {
        top: 0,
        left: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10, itemHeight: 10, itemGap: 20,
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: {
          color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
          rotate: 30,
          interval: Math.floor(months.length / 10),
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Cost',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLabel: { color: '#64748B', fontSize: 10, formatter: fmtCost },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          axisLine: { show: false },
        },
        {
          type: 'value',
          name: 'Shipments',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLabel: {
            color: '#64748B', fontSize: 10,
            formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
          },
          splitLine: { show: false },
          axisLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Shipping Cost',
          type: 'line',
          yAxisIndex: 0,
          data: costs,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#8B5CF6', width: 2.5 },
          itemStyle: { color: '#8B5CF6' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139,92,246,0.25)' },
                { offset: 1, color: 'rgba(139,92,246,0.02)' },
              ],
            },
          },
        },
        {
          name: 'Shipments',
          type: 'bar',
          yAxisIndex: 1,
          data: orders,
          barMaxWidth: 14,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.7)' },
                { offset: 1, color: 'rgba(59,130,246,0.1)' },
              ],
            },
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load cost trend</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default ShippingCostTrendChart;
