import { useMemo } from 'react';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { useShippingHeatmap, type ShippingFilters } from '../../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const MODE_COLORS: Record<string, string> = {
  'First Class':    '#3B82F6',
  'Same Day':       '#10B981',
  'Second Class':   '#F59E0B',
  'Standard Class': '#8B5CF6',
};
const FALLBACK = ['#06B6D4', '#F43F5E', '#EC4899', '#84CC16'];

const TOOLTIP = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14] as [number, number],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
};

interface Props { filters: ShippingFilters }

const ShipModeCostDonut: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useShippingHeatmap(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    // aggregate estimated total cost per ship mode: avg_cost × orders
    const costByMode = new Map<string, number>();
    data.forEach((row: any) => {
      const est = (row.avg_cost ?? 0) * (row.orders ?? 0);
      costByMode.set(row.ship_mode, (costByMode.get(row.ship_mode) ?? 0) + est);
    });

    const modes = [...costByMode.keys()].sort();
    const total = modes.reduce((s, m) => s + (costByMode.get(m) ?? 0), 0);

    const fmtCost = (v: number) =>
      v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M`
      : v >= 1_000   ? `$${(v / 1_000).toFixed(1)}k`
      : `$${v.toFixed(0)}`;

    const seriesData = modes.map((mode, i) => ({
      name: mode,
      value: parseFloat((costByMode.get(mode) ?? 0).toFixed(2)),
      itemStyle: { color: MODE_COLORS[mode] ?? FALLBACK[i % FALLBACK.length] },
    }));

    return {
      tooltip: {
        ...TOOLTIP,
        trigger: 'item',
        formatter: (params: any) => {
          const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
          return `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>
            <div style="line-height:1.9;color:#64748B">
              Est. Cost: <span style="color:${params.color};font-weight:700">${fmtCost(params.value)}</span><br/>
              Share: <span style="color:#F1F5F9;font-weight:700">${pct}%</span>
            </div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '4%',
        top: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
        formatter: (name: string) => {
          const val = costByMode.get(name) ?? 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
          return `${name}  ${pct}%`;
        },
      },
      graphic: [
        {
          type: 'text',
          left: '30%',
          top: '42%',
          style: {
            text: fmtCost(total),
            textAlign: 'center',
            fill: '#F1F5F9',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
          },
        },
        {
          type: 'text',
          left: '30%',
          top: '54%',
          style: {
            text: 'Total Cost',
            textAlign: 'center',
            fill: '#64748B',
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
          },
        },
      ],
      series: [
        {
          name: 'Shipping Cost',
          type: 'pie',
          radius: ['44%', '68%'],
          center: ['32%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: { shadowBlur: 14, shadowColor: 'rgba(0,0,0,0.5)' },
          },
          data: seriesData,
        },
      ],
    };
  }, [data]);

  if (isError) return <div className="text-rose-400 flex items-center justify-center h-full text-sm">Failed to load cost share data</div>;

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default ShipModeCostDonut;
