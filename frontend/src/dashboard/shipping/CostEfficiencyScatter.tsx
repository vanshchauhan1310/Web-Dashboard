import { useMemo } from 'react';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { useShippingRegionPerformance, type ShippingFilters } from '../../hooks/useAnalytics';
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

const CostEfficiencyScatter: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useShippingRegionPerformance(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const maxOrders = Math.max(...data.map((d: any) => d.orders), 1);

    const points = data.map((d: any) => ({
      name: d.region,
      value: [
        parseFloat((d.avg_cost ?? 0).toFixed(2)),
        parseFloat((d.on_time_rate ?? 0).toFixed(1)),
        d.orders,
      ],
      symbolSize: Math.max(10, Math.round((d.orders / maxOrders) * 48)),
    }));

    const avgCostMid = points.reduce((s: number, p: any) => s + p.value[0], 0) / points.length;
    const avgOnTimeMid = points.reduce((s: number, p: any) => s + p.value[1], 0) / points.length;

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'item',
        formatter: (params: any) => {
          const [cost, onTime, orders] = params.value;
          return `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>
            <div style="line-height:1.9;color:#64748B">
              Avg Cost/Order: <span style="color:#F59E0B;font-weight:700">$${cost.toFixed(2)}</span><br/>
              On-Time Rate: <span style="color:#34D399;font-weight:700">${onTime.toFixed(1)}%</span><br/>
              Total Orders: <span style="color:#60A5FA;font-weight:700">${orders.toLocaleString()}</span>
            </div>`;
        },
      },
      legend: { show: false },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Avg Cost / Order ($)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => `$${v.toFixed(0)}` },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      },
      yAxis: {
        type: 'value',
        name: 'On-Time Rate (%)',
        nameLocation: 'middle',
        nameGap: 36,
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => `${v}%` },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false },
        min: 0,
        max: 100,
      },
      // quadrant guide lines
      markLine: { silent: true },
      series: [
        {
          name: 'Regions',
          type: 'scatter',
          data: points,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(255,255,255,0.08)', type: 'dashed', width: 1 },
            label: { show: false },
            data: [
              { xAxis: avgCostMid },
              { yAxis: avgOnTimeMid },
            ],
          },
          label: {
            show: true,
            position: 'top',
            color: '#94A3B8',
            fontSize: 9,
            fontFamily: 'Inter, sans-serif',
            formatter: (p: any) => p.name.length > 14 ? p.name.slice(0, 12) + '…' : p.name,
          },
          itemStyle: {
            color: (params: any) => {
              const [cost, onTime] = params.value;
              if (cost <= avgCostMid && onTime >= avgOnTimeMid) return '#10B981'; // cheap + on-time = green
              if (cost > avgCostMid && onTime >= avgOnTimeMid)  return '#3B82F6'; // expensive + on-time = blue
              if (cost <= avgCostMid && onTime < avgOnTimeMid)  return '#F59E0B'; // cheap + late = amber
              return '#EF4444';                                                   // expensive + late = red
            },
            opacity: 0.85,
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load efficiency data</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default CostEfficiencyScatter;
