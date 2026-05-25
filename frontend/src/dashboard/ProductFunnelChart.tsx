import { useMemo } from 'react';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { useProductConversionFunnel } from '../hooks/useAnalytics';
import type { EChartsCoreOption } from 'echarts';

const FUNNEL_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899'];

const ProductFunnelChart: React.FC = () => {
  const { data, isLoading, isError } = useProductConversionFunnel();

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data?.length) return {};

    const total = data[0]?.value ?? 1;

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
          const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
          return `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>
            <div style="color:#94A3B8;line-height:1.8">
              Orders: <span style="color:${params.color};font-weight:700">${params.value.toLocaleString()}</span><br/>
              Conversion: <span style="color:#E2E8F0;font-weight:600">${pct}%</span>
            </div>`;
        },
      },
      series: [
        {
          type: 'funnel',
          left: '6%',
          right: '6%',
          top: '4%',
          bottom: '4%',
          width: '88%',
          min: 0,
          max: total,
          minSize: '18%',
          maxSize: '100%',
          sort: 'none',
          gap: 5,
          label: {
            show: true,
            position: 'inside',
            formatter: (params: any) => {
              const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
              return `{name|${params.name}}\n{val|${params.value.toLocaleString()}  ·  ${pct}%}`;
            },
            rich: {
              name: {
                color: '#F1F5F9',
                fontSize: 12,
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 20,
              },
              val: {
                color: 'rgba(241,245,249,0.7)',
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 16,
              },
            },
          },
          labelLine: { show: false },
          itemStyle: { borderWidth: 0 },
          emphasis: {
            label: { fontSize: 13 },
            itemStyle: { opacity: 0.9 },
          },
          data: data.map((item: any, i: number) => ({
            name: item.stage,
            value: item.value,
            itemStyle: {
              color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
              opacity: 1 - i * 0.06,
            },
          })),
        },
      ],
    };
  }, [data]);

  if (isError) return (
    <div className="text-rose-400 flex items-center justify-center h-full text-sm">
      Failed to load funnel data
    </div>
  );

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} loading={isLoading} />
    </div>
  );
};

export default ProductFunnelChart;
