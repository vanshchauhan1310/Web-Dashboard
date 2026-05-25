import { useMemo } from 'react';
import type { EChartsCoreOption } from 'echarts';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import {
  useGeographyCountryPerformance,
  useGeographyMarketSales,
  useGeographyMonthlyMarketTrend,
  useGeographyRegionCategory,
  useGeographySankey,
  type GeographyFilters,
} from '../../hooks/useAnalytics';
import { getCountryPoint, mapAxes, MARKET_CELLS } from './geoHelpers';

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
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4', '#84CC16'];

const money = (value: number) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const ChartError: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-rose-400 flex items-center justify-center h-full text-sm">{label}</div>
);

export const GeographyMarketBarChart: React.FC<{ filters: GeographyFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useGeographyMarketSales(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};
    return {
      tooltip: { ...TOOLTIP_STYLE, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { color: '#94A3B8', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      grid: { left: '2%', right: '3%', bottom: '4%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((row: any) => row.market),
        axisLabel: AXIS_LABEL,
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
          name: 'Sales',
          type: 'bar',
          data: data.map((row: any) => row.sales),
          barMaxWidth: 34,
          itemStyle: { color: '#3B82F6', borderRadius: [6, 6, 0, 0] },
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

  if (isError) return <ChartError label="Failed to load market sales" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const GeographyMonthlyMarketLineChart: React.FC<{ filters: GeographyFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useGeographyMonthlyMarketTrend(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};
    const months = Array.from(new Set(data.map((row: any) => row.month))) as string[];
    const markets = Array.from(new Set(data.map((row: any) => row.market))) as string[];

    return {
      tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
      legend: {
        type: 'scroll',
        top: 0,
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { left: '2%', right: '3%', bottom: '4%', top: '16%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
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
      series: markets.map((market, index) => ({
        name: market,
        type: 'line',
        smooth: true,
        symbolSize: 4,
        data: months.map((month) => {
          const row = data.find((item: any) => item.month === month && item.market === market);
          return row ? row.sales : 0;
        }),
        lineStyle: { width: 2.5, color: COLORS[index % COLORS.length] },
        itemStyle: { color: COLORS[index % COLORS.length] },
      })),
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load market trend" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const GeographyRegionCategoryStackChart: React.FC<{ filters: GeographyFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useGeographyRegionCategory(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};
    const regions = Array.from(new Set(data.map((row: any) => row.region))).sort() as string[];
    const categories = Array.from(new Set(data.map((row: any) => row.category))).sort() as string[];

    return {
      tooltip: { ...TOOLTIP_STYLE, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { color: '#94A3B8', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      grid: { left: '2%', right: '3%', bottom: '5%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: regions,
        axisLabel: { ...AXIS_LABEL, interval: 0, rotate: 25 },
        axisLine: AXIS_LINE,
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `$${(value / 1000).toFixed(0)}k` },
        splitLine: SPLIT_LINE,
        axisLine: { show: false },
      },
      series: categories.map((category, index) => ({
        name: category,
        type: 'bar',
        stack: 'sales',
        barMaxWidth: 34,
        data: regions.map((region) => {
          const row = data.find((item: any) => item.region === region && item.category === category);
          return row ? row.sales : 0;
        }),
        itemStyle: { color: COLORS[index % COLORS.length] },
      })),
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load region category mix" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const GeographyChoroplethChart: React.FC<{ filters: GeographyFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useGeographyMarketSales(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};
    const values = data.map((row: any) => row.sales);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'item',
        formatter: (params: any) => `<strong>${params.name}</strong><br/>Sales: ${money(params.value?.[2] ?? 0)}`,
      },
      grid: { left: '3%', right: '3%', bottom: '8%', top: '5%', containLabel: true },
      ...mapAxes,
      visualMap: {
        min,
        max,
        right: 8,
        bottom: 8,
        text: ['High', 'Low'],
        textStyle: { color: '#94A3B8', fontSize: 10 },
        calculable: false,
        inRange: { color: ['#122340', '#2563EB', '#10B981'] },
      },
      series: [
        {
          name: 'Market Choropleth',
          type: 'custom',
          coordinateSystem: 'cartesian2d',
          data: data
            .filter((row: any) => MARKET_CELLS[row.market])
            .map((row: any) => [MARKET_CELLS[row.market].x, MARKET_CELLS[row.market].y, row.sales, row.market]),
          renderItem: (_params: any, api: any) => {
            const market = api.value(3);
            const cell = MARKET_CELLS[market];
            const start = api.coord([cell.x, cell.y + cell.height]);
            const end = api.coord([cell.x + cell.width, cell.y]);
            const width = end[0] - start[0];
            const height = end[1] - start[1];
            return {
              type: 'group',
              children: [
                {
                  type: 'rect',
                  shape: { x: start[0], y: start[1], width, height },
                  style: api.style({
                    fill: api.visual('color'),
                    stroke: 'rgba(255,255,255,0.22)',
                    lineWidth: 1,
                    opacity: 0.88,
                  }),
                },
                {
                  type: 'text',
                  style: {
                    x: start[0] + width / 2,
                    y: start[1] + height / 2,
                    text: market.replace('Market: ', ''),
                    textFill: '#F1F5F9',
                    textAlign: 'center',
                    textVerticalAlign: 'middle',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                  },
                },
              ],
            };
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load choropleth" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const GeographyHeatmapChart: React.FC<{ filters: GeographyFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useGeographyCountryPerformance(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};
    const points = data.slice(0, 80).map((row: any) => {
      const [lon, lat] = getCountryPoint(row.country, row.market);
      return { name: row.country, value: [lon, lat, row.sales, row.profit], market: row.market };
    });
    const max = Math.max(...points.map((point: any) => point.value[2]), 1);

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        formatter: (params: any) =>
          `<strong>${params.name}</strong><br/>Market: ${params.data.market}<br/>Sales: ${money(params.value[2])}<br/>Profit: ${money(params.value[3])}`,
      },
      grid: { left: '3%', right: '3%', bottom: '8%', top: '5%', containLabel: true },
      ...mapAxes,
      visualMap: {
        min: 0,
        max,
        right: 8,
        bottom: 8,
        text: ['High', 'Low'],
        textStyle: { color: '#94A3B8', fontSize: 10 },
        inRange: { color: ['#1D4ED8', '#06B6D4', '#F59E0B', '#F43F5E'] },
      },
      series: [
        {
          name: 'Country Sales Heat',
          type: 'scatter',
          data: points,
          symbolSize: (value: number[]) => Math.max(7, Math.min(34, Math.sqrt(value[2] / max) * 36)),
          itemStyle: {
            borderColor: 'rgba(255,255,255,0.85)',
            borderWidth: 1,
            opacity: 0.86,
          },
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load geographic heatmap" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};

export const GeographySankeyChart: React.FC<{ filters: GeographyFilters }> = ({ filters }) => {
  const { data, isLoading, isError } = useGeographySankey(filters);

  const option = useMemo<EChartsCoreOption>(() => {
    if (!data) return {};
    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `${params.data.source}<br/>to ${params.data.target}<br/><strong>${money(params.data.value)}</strong>`;
          }
          return params.name;
        },
      },
      series: [
        {
          type: 'sankey',
          left: 8,
          right: 36,
          top: 16,
          bottom: 16,
          nodeWidth: 13,
          nodeGap: 10,
          draggable: false,
          data: data.nodes,
          links: data.links,
          lineStyle: { color: 'gradient', curveness: 0.48, opacity: 0.36 },
          itemStyle: { borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1 },
          label: { color: '#CBD5E1', fontSize: 10, fontFamily: 'Inter, sans-serif' },
          emphasis: { focus: 'adjacency' },
          levels: [
            { depth: 0, itemStyle: { color: '#3B82F6' } },
            { depth: 1, itemStyle: { color: '#10B981' } },
            { depth: 2, itemStyle: { color: '#F59E0B' } },
          ],
        },
      ],
    };
  }, [data]);

  if (isError) return <ChartError label="Failed to load Sankey flow" />;
  return <EChartWrapper option={option} loading={isLoading} />;
};
