import type * as echarts from 'echarts';

export interface QueryResult {
  categories:  string[];
  series:      { name: string; data: number[] }[];
  x_label:     string;
  y_label:     string;
  color_label: string | null;
}

const COLORS = ['#3B82F6','#10B981','#F59E0B','#F43F5E','#8B5CF6','#06B6D4','#EC4899'];

export function buildOption(data: QueryResult, chartType: string): echarts.EChartsCoreOption {
  const { categories, series, y_label } = data;

  const tooltip: echarts.EChartsCoreOption['tooltip'] = {
    trigger: chartType === 'pie' ? 'item' : 'axis',
    backgroundColor: 'rgba(11,15,25,0.92)',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: { color: '#E2E8F0', fontSize: 12 },
  };

  if (chartType === 'pie') {
    return {
      color: COLORS,
      tooltip,
      legend: { show: true, bottom: 0, textStyle: { color: '#94A3B8', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['38%', '68%'],
        center: ['50%', '46%'],
        data: categories.map((c, i) => ({ name: c, value: series[0]?.data[i] ?? 0 })),
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.4)' } },
      }],
    };
  }

  const xAxis = {
    type: 'category' as const,
    data: categories,
    axisLabel: { color: '#64748B', fontSize: 11, rotate: categories.length > 8 ? 30 : 0 },
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
    axisTick: { show: false },
  };

  const yAxis = {
    type: 'value' as const,
    name: y_label,
    nameTextStyle: { color: '#64748B', fontSize: 10 },
    axisLabel: {
      color: '#64748B',
      fontSize: 11,
      formatter: (v: number) =>
        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
        : v >= 1_000   ? `${(v / 1_000).toFixed(0)}k`
        : String(v),
    },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
  };

  const grid = {
    left: 16, right: 16,
    top: series.length > 1 ? 44 : 20,
    bottom: categories.length > 8 ? 56 : 36,
    containLabel: true,
  };

  const legend = series.length > 1
    ? { show: true, top: 4, textStyle: { color: '#94A3B8', fontSize: 11 } }
    : undefined;

  if (chartType === 'scatter') {
    return {
      color: COLORS, tooltip, grid, legend,
      xAxis,
      yAxis,
      series: series.map((s, i) => ({
        name:       s.name,
        type:       'scatter',
        data:       s.data.map((v, j) => [j, v]),
        symbolSize: 8,
        itemStyle:  { color: COLORS[i % COLORS.length] },
      })),
    };
  }

  const eType = chartType === 'area' ? 'line' : chartType;

  return {
    color: COLORS, tooltip, grid, legend,
    xAxis,
    yAxis,
    series: series.map((s, i) => ({
      name:  s.name,
      type:  eType,
      data:  s.data,
      smooth: true,
      itemStyle: { color: COLORS[i % COLORS.length] },
      ...(chartType === 'bar'  ? { barMaxWidth: 48 } : {}),
      ...(chartType === 'area' ? {
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${COLORS[i % COLORS.length]}44` },
              { offset: 1, color: `${COLORS[i % COLORS.length]}08` },
            ],
          },
        },
      } : {}),
    })),
  };
}
