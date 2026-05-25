import { useCallback, useMemo, useState } from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import type { EChartsCoreOption } from 'echarts';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import {
  useGeographyDrilldown,
  type GeographyDrilldownParams,
  type GeographyFilters,
} from '../../hooks/useAnalytics';

const TOOLTIP_STYLE = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 10px;',
};

const LEVEL_LABELS = {
  market: 'Markets',
  region: 'Regions',
  country: 'Countries',
  city: 'Cities',
};

interface TrailItem {
  level: GeographyDrilldownParams['level'];
  name: string;
}

const money = (value: number) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const GeographyDrilldownChart: React.FC<{ filters: GeographyFilters }> = ({ filters }) => {
  const [trail, setTrail] = useState<TrailItem[]>([]);

  const drilldown = useMemo<GeographyDrilldownParams>(() => {
    const last = trail[trail.length - 1];
    if (!last) return { level: 'market' };
    if (last.level === 'market') return { level: 'region', market_value: last.name };
    if (last.level === 'region') {
      const marketItem = trail.find((item) => item.level === 'market');
      return { level: 'country', market_value: marketItem?.name, region_value: last.name };
    }
    if (last.level === 'country') {
      const marketItem = trail.find((item) => item.level === 'market');
      const regionItem = trail.find((item) => item.level === 'region');
      return {
        level: 'city',
        market_value: marketItem?.name,
        region_value: regionItem?.name,
        country_value: last.name,
      };
    }
    return { level: 'city' };
  }, [trail]);

  const { data, isLoading, isError } = useGeographyDrilldown(filters, drilldown);
  const currentLevel = drilldown.level;

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};
    const items = data.items ?? [];

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'item',
        formatter: (params: any) => {
          const item = params.data;
          return `<strong>${item.name}</strong><br/>Sales: ${money(item.value)}<br/>Profit: ${money(item.profit)}<br/>Orders: ${item.orders.toLocaleString()}`;
        },
      },
      grid: { left: '2%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#64748B', fontSize: 11, formatter: (value: number) => `$${(value / 1000).toFixed(0)}k` },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: items.map((item: any) => item.name),
        axisLabel: { color: '#CBD5E1', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
        axisTick: { show: false },
      },
      series: [
        {
          name: LEVEL_LABELS[currentLevel],
          type: 'bar',
          barMaxWidth: 22,
          data: items.map((item: any, index: number) => ({
            name: item.name,
            value: item.sales,
            profit: item.profit,
            orders: item.orders,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][index % 4] },
                  { offset: 1, color: '#06B6D4' },
                ],
              },
              borderRadius: [0, 6, 6, 0],
            },
          })),
          label: {
            show: true,
            position: 'right',
            color: '#94A3B8',
            fontSize: 10,
            formatter: (params: any) => money(params.value),
          },
        },
      ],
    };
  }, [currentLevel, data]);

  const handleClick = useCallback(
    (params: any) => {
      if (!data?.next_level || currentLevel === 'city') return;
      setTrail((current) => [...current, { level: currentLevel, name: params.name }]);
    },
    [currentLevel, data?.next_level]
  );

  if (isError) {
    return <div className="flex h-full items-center justify-center text-sm text-rose-400">Failed to load drilldown data</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2 px-1 text-[12px] text-slate-400">
        <button
          type="button"
          onClick={() => setTrail([])}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-slate-200 transition-all hover:bg-white/[0.06]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Markets
        </button>
        {trail.map((item, index) => (
          <span key={`${item.level}-${item.name}`} className="inline-flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <button
              type="button"
              onClick={() => setTrail(trail.slice(0, index + 1))}
              className="rounded-lg px-2 py-1 font-medium text-slate-300 transition-all hover:bg-white/[0.06]"
            >
              {item.name}
            </button>
          </span>
        ))}
        <span className="ml-auto rounded-full bg-white/[0.05] px-2.5 py-1 font-semibold text-slate-300">
          {LEVEL_LABELS[currentLevel]}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <EChartWrapper option={option} loading={isLoading} onChartClick={handleClick} />
      </div>
    </div>
  );
};

export default GeographyDrilldownChart;
