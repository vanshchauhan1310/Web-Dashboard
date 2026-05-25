import { useMemo } from 'react';
import type { EChartsCoreOption } from 'echarts';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import {
  useExecutiveCategoryPerformance,
  useExecutiveMonthlySalesProfit,
  useExecutiveParetoCountries,
  useExecutiveProfitWaterfall,
  useExecutiveSegmentShare,
  type ExecutiveFilters,
} from '../../hooks/useAnalytics';

const TOOLTIP_STYLE = {
  backgroundColor: '#0A1525',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: [10, 14],
  textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  extraCssText: 'box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 10px;',
};

const AXIS_LABEL = { color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' };
const AXIS_LINE = { lineStyle: { color: 'rgba(255,255,255,0.07)' } };
const SPLIT_LINE = { lineStyle: { color: 'rgba(255,255,255,0.05)' } };
const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

const money = (value: number) =>
  `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const ChartError: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-rose-400 flex items-center justify-center h-full text-sm">{label}</div>
);

export const ExecutiveMonthlySalesProfitChart: React.FC<{ filters: ExecutiveFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useExecutiveMonthlySalesProfit(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#0A1525' } },
      },
      legend: {
        top: 0,
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { left: '2%', right: '3%', bottom: '3%', top: '13%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((row: any) => row.month),
        axisLabel: { ...AXIS_LABEL, hideOverlap: true },
        axisLine: AXIS_LINE,
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `$${(value / 1000).toFixed(0)}k` },
        splitLine: SPLIT_LINE,
        axisLine: { show: false },
      },
      series: [
        {
          name: 'Sales',
          type: 'line',
          smooth: true,
          symbolSize: 5,
          data: data.map((row: any) => row.sales),
          lineStyle: { width: 3, color: '#38BDF8' },
          itemStyle: { color: '#38BDF8' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(56, 189, 248, 0.25)' },
                { offset: 1, color: 'rgba(56, 189, 248, 0)' },
              ],
            },
          },
        },
        {
          name: 'Profit',
          type: 'bar',
          data: data.map((row: any) => row.profit),
          barMaxWidth: 18,
          itemStyle: {
            color: '#10B981',
            borderRadius: [5, 5, 0, 0],
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load monthly sales" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const ExecutiveCategoryBarChart: React.FC<{ filters: ExecutiveFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useExecutiveCategoryPerformance(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        top: 0,
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { left: '2%', right: '3%', bottom: '4%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((row: any) => row.category),
        axisLabel: AXIS_LABEL,
        axisLine: AXIS_LINE,
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `$${(value / 1000).toFixed(0)}k` },
        splitLine: SPLIT_LINE,
        axisLine: { show: false },
      },
      series: [
        {
          name: 'Sales',
          type: 'bar',
          data: data.map((row: any) => row.sales),
          barMaxWidth: 34,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#3B82F6' },
                { offset: 1, color: '#6366F1' },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: 'Profit',
          type: 'bar',
          data: data.map((row: any) => row.profit),
          barMaxWidth: 34,
          itemStyle: { color: '#10B981', borderRadius: [6, 6, 0, 0] },
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load category performance" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const ExecutiveSegmentDonutChart: React.FC<{ filters: ExecutiveFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useExecutiveSegmentShare(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'item',
        formatter: (params: any) =>
          `<div style="font-weight:600;margin-bottom:4px">${params.name}</div><div style="color:#64748B">Sales: <span style="color:${params.color};font-weight:700">${money(params.value)}</span> (${params.percent}%)</div>`,
      },
      legend: {
        bottom: 8,
        left: 'center',
        itemGap: 16,
        textStyle: { color: '#CBD5E1', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle',
      },
      series: [
        {
          name: 'Segment Sales',
          type: 'pie',
          radius: ['36%', '60%'],
          center: ['50%', '40%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0E1C30',
            borderWidth: 2,
          },
          label: {
            color: '#CBD5E1',
            fontSize: 11,
            formatter: '{d}%',
          },
          labelLine: { length: 10, length2: 8, lineStyle: { color: '#64748B' } },
          data: data.map((row: any, index: number) => ({
            name: row.segment,
            value: row.sales,
            itemStyle: { color: PIE_COLORS[index % PIE_COLORS.length] },
          })),
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load segment share" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const ExecutiveParetoCountryChart: React.FC<{ filters: ExecutiveFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useExecutiveParetoCountries(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const bar = params.find((item: any) => item.seriesName === 'Sales');
          const line = params.find((item: any) => item.seriesName === 'Cumulative %');
          return `<div style="font-weight:600;margin-bottom:4px">${bar?.name ?? ''}</div><div style="color:#64748B">Sales: <span style="color:#8B5CF6;font-weight:700">${money(bar?.value ?? 0)}</span></div><div style="color:#64748B">Cumulative: <span style="color:#F59E0B;font-weight:700">${Number(line?.value ?? 0).toFixed(1)}%</span></div>`;
        },
      },
      legend: {
        top: 0,
        textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { left: '2%', right: '4%', bottom: '8%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((row: any) => row.country),
        axisLabel: { ...AXIS_LABEL, interval: 0, rotate: 32 },
        axisLine: AXIS_LINE,
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `$${(value / 1000).toFixed(0)}k` },
          splitLine: SPLIT_LINE,
          axisLine: { show: false },
        },
        {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: { ...AXIS_LABEL, formatter: '{value}%' },
          splitLine: { show: false },
          axisLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Sales',
          type: 'bar',
          data: data.map((row: any) => row.sales),
          barMaxWidth: 24,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#8B5CF6' },
                { offset: 1, color: '#3B82F6' },
              ],
            },
            borderRadius: [5, 5, 0, 0],
          },
        },
        {
          name: 'Cumulative %',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 6,
          data: data.map((row: any) => row.cumulative_pct),
          lineStyle: { width: 3, color: '#F59E0B' },
          itemStyle: { color: '#F59E0B' },
          markLine: {
            symbol: 'none',
            lineStyle: { color: '#F43F5E', type: 'dashed' },
            label: { color: '#F43F5E', formatter: '80%' },
            data: [{ yAxis: 80 }],
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load Pareto chart" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const ExecutiveProfitWaterfallChart: React.FC<{ filters: ExecutiveFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useExecutiveProfitWaterfall(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};

    const byLabel = new Map<string, number>(
      data.map((row: any) => [row.label, Number(row.value || 0)])
    );
    const grossSales = byLabel.get('Gross Sales') ?? 0;
    const discount = Math.abs(byLabel.get('Discount') ?? 0);
    const netSales = byLabel.get('Net Sales') ?? Math.max(grossSales - discount, 0);
    const shipping = Math.abs(byLabel.get('Shipping') ?? 0);
    const costBase = Math.abs(byLabel.get('Cost Base') ?? 0);
    const profit = byLabel.get('Profit') ?? Math.max(netSales - shipping - costBase, 0);

    const steps = [
      { label: 'Gross Sales', base: 0, amount: grossSales, signed: grossSales, color: '#3B82F6' },
      { label: 'Discount', base: netSales, amount: discount, signed: -discount, color: '#F43F5E' },
      { label: 'Net Sales', base: 0, amount: netSales, signed: netSales, color: '#8B5CF6' },
      { label: 'Shipping', base: Math.max(netSales - shipping, 0), amount: shipping, signed: -shipping, color: '#F43F5E' },
      { label: 'Cost Base', base: Math.max(profit, 0), amount: costBase, signed: -costBase, color: '#F43F5E' },
      { label: 'Profit', base: 0, amount: profit, signed: profit, color: '#10B981' },
    ];
    const stepLevels = [grossSales, netSales, netSales, netSales - shipping, profit, profit];
    const connectorData = stepLevels.slice(0, -1).map((level, index) => [
      { coord: [index, level] },
      { coord: [index + 1, level] },
    ]);

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const visible = params.find((item: any) => item.seriesName === 'Waterfall');
          const item = steps[visible?.dataIndex ?? 0];
          const end = item.signed < 0 ? item.base : item.base + item.amount;
          return `<div style="font-weight:600;margin-bottom:4px">${item.label}</div><div style="color:#64748B">Change: <span style="color:${item.signed < 0 ? '#F43F5E' : item.color};font-weight:700">${money(item.signed)}</span></div><div style="color:#64748B">Level: <span style="color:#CBD5E1;font-weight:700">${money(end)}</span></div>`;
        },
      },
      grid: { left: '2%', right: '3%', bottom: '5%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: steps.map((step: any) => step.label),
        axisLabel: { ...AXIS_LABEL, interval: 0 },
        axisLine: AXIS_LINE,
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `$${(value / 1000000).toFixed(1)}M` },
        splitLine: SPLIT_LINE,
        axisLine: { show: false },
      },
      series: [
        {
          name: 'Base',
          type: 'bar',
          stack: 'waterfall',
          silent: true,
          itemStyle: {
            color: 'transparent',
            borderColor: 'transparent',
          },
          emphasis: {
            disabled: true,
          },
          data: steps.map((step) => step.base),
        },
        {
          name: 'Waterfall',
          type: 'bar',
          stack: 'waterfall',
          barMaxWidth: 42,
          data: steps.map((step) => ({
            value: step.amount,
            itemStyle: {
              color: step.color,
              borderRadius: [6, 6, 0, 0],
              shadowBlur: 12,
              shadowColor: `${step.color}40`,
            },
          })),
          label: {
            show: true,
            position: 'top',
            color: '#CBD5E1',
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            formatter: (params: any) => money(steps[params.dataIndex].signed),
          },
          markLine: {
            symbol: 'none',
            silent: true,
            lineStyle: {
              color: 'rgba(203, 213, 225, 0.42)',
              width: 1,
              type: 'dashed',
            },
            label: { show: false },
            data: connectorData,
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load profit waterfall" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};
