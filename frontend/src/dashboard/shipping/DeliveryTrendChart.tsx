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
const AXIS_LABEL = { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' };

interface Props { filters: ShippingFilters }

const DeliveryTrendChart: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useDeliveryTrend(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const months = data.map((d: any) => d.month);

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#0A1525' } },
        formatter: (params: any) => {
          const month = params[0]?.name ?? '';
          const orders = params.find((p: any) => p.seriesName === 'Shipments');
          const days = params.find((p: any) => p.seriesName === 'Avg Days');
          const onTime = params.find((p: any) => p.seriesName === 'On-Time %');
          return `<div style="font-weight:600;margin-bottom:6px">${month}</div>
            <div style="color:#64748B;line-height:1.9">
              Shipments: <span style="color:#60A5FA;font-weight:700">${orders?.value?.toLocaleString() ?? 0}</span><br/>
              Avg Days: <span style="color:#F59E0B;font-weight:700">${days?.value?.toFixed(1) ?? 0}d</span><br/>
              On-Time: <span style="color:#34D399;font-weight:700">${onTime?.value?.toFixed(1) ?? 0}%</span>
            </div>`;
        },
      },
      legend: {
        top: 0,
        left: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 20,
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: true,
        axisLabel: { ...AXIS_LABEL, rotate: 30, interval: Math.floor(months.length / 10) },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Shipments',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLabel: { ...AXIS_LABEL, formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          axisLine: { show: false },
        },
        {
          type: 'value',
          name: 'Days / %',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `${v}` },
          splitLine: { show: false },
          axisLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Shipments',
          type: 'bar',
          yAxisIndex: 0,
          data: data.map((d: any) => d.orders),
          barMaxWidth: 18,
          itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3B82F6' }, { offset: 1, color: '#6366F188' }] }, borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Avg Days',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d: any) => d.avg_days),
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#F59E0B', width: 2.5 },
          itemStyle: { color: '#F59E0B' },
        },
        {
          name: 'On-Time %',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d: any) => d.on_time_rate),
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#10B981', width: 2.5 },
          itemStyle: { color: '#10B981' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.2)' }, { offset: 1, color: 'rgba(16,185,129,0.01)' }] } },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load delivery trend</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default DeliveryTrendChart;
