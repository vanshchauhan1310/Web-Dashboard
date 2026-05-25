import { useMemo } from 'react';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { useShippingHeatmap, type ShippingFilters } from '../../hooks/useAnalytics';
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

const ShippingHeatmapChart: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useShippingHeatmap(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const regions: string[] = [...new Set<string>(data.map((d: any) => d.region))].sort();
    const modes: string[] = [...new Set<string>(data.map((d: any) => d.ship_mode))].sort();
    const maxCost = Math.max(...data.map((d: any) => d.avg_cost), 0.01);

    const matrix: [number, number, number][] = data.map((d: any) => [
      modes.indexOf(d.ship_mode),
      regions.indexOf(d.region),
      d.avg_cost,
    ]);

    return {
      tooltip: {
        ...TOOLTIP,
        position: 'top',
        formatter: (params: any) => {
          const [xi, yi, val] = params.value;
          return `<div style="font-weight:600;margin-bottom:4px">${regions[yi]} · ${modes[xi]}</div>
            <div style="color:#94A3B8">Avg Shipping Cost: <span style="color:#F59E0B;font-weight:700">$${val.toFixed(2)}</span></div>`;
        },
      },
      grid: { left: '2%', right: '12%', bottom: '14%', top: '6%', containLabel: true },
      xAxis: {
        type: 'category',
        data: modes,
        splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.025)'] } },
        axisLabel: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif', rotate: 15 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: regions,
        splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.025)'] } },
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          width: 130,
          overflow: 'truncate',
          formatter: (n: string) => n.length > 22 ? n.slice(0, 19) + '…' : n,
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxCost,
        calculable: true,
        orient: 'vertical',
        right: 0,
        top: 'center',
        textStyle: { color: '#64748B', fontSize: 10 },
        inRange: {
          color: ['#0F2040', '#1E40AF', '#3B82F6', '#F59E0B', '#EF4444'],
        },
        formatter: (v: number) => `$${v.toFixed(1)}`,
      },
      series: [
        {
          name: 'Avg Shipping Cost',
          type: 'heatmap',
          data: matrix,
          label: {
            show: true,
            color: 'rgba(241,245,249,0.85)',
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            formatter: (params: any) => `$${Number(params.value[2]).toFixed(1)}`,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.5)',
            },
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load heatmap</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default ShippingHeatmapChart;
