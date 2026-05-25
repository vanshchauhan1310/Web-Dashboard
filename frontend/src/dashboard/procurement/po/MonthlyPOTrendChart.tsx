import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BASE_COUNT  = [68, 72, 95, 103, 118, 124, 110, 131, 142, 128, 137, 151];
const BASE_AMOUNT = [1.1, 1.2, 1.55, 1.7, 1.9, 2.0, 1.8, 2.15, 2.3, 2.1, 2.25, 2.5];

const PERIOD_FACTOR: Record<string, number[]> = {
  'This Year':      Array(12).fill(1),
  'Last Year':      Array(12).fill(0.88),
  'Last 6 Months':  [0,0,0,0,0,0, 1.05,1.05,1.05,1.05,1.05,1.05],
  'Last Quarter':   [0,0,0,0,0,0, 0,0,0, 1.08,1.08,1.08],
  'This Month':     Array(11).fill(0).concat([1.12]),
};

const MonthlyPOTrendChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const { counts, amounts } = useMemo(() => {
    const factor = PERIOD_FACTOR[filters.time_period] ?? Array(12).fill(1);
    return {
      counts:  BASE_COUNT.map((v, i)  => factor[i] ? Math.round(v * factor[i]) : null),
      amounts: BASE_AMOUNT.map((v, i) => factor[i] ? parseFloat((v * factor[i]).toFixed(2)) : null),
    };
  }, [filters.time_period]);

  const option = useMemo<EChartsCoreOption>(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0A1525',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: [10, 14] as [number, number],
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
      formatter: (params: any) => {
        const [countP, amountP] = params as any[];
        return `<div style="font-weight:600;margin-bottom:6px">${countP?.axisValueLabel}</div>
          <div style="line-height:2">
            <span style="color:#10B981">●</span> PO Count: <span style="color:#10B981;font-weight:700">${countP?.value ?? '—'}</span><br/>
            <span style="color:#3B82F6">●</span> PO Amount: <span style="color:#3B82F6;font-weight:700">$${amountP?.value ?? '—'}M</span>
          </div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 16,
      icon: 'circle',
    },
    grid: { top: 16, right: 56, bottom: 48, left: 44 },
    xAxis: {
      type: 'category',
      data: MONTHS,
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick:  { show: false },
      boundaryGap: false,
    },
    yAxis: [
      {
        type: 'value',
        name: 'PO Count',
        nameTextStyle: { color: '#475569', fontSize: 9, fontFamily: 'Inter, sans-serif' },
        axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false }, axisTick: { show: false },
      },
      {
        type: 'value',
        name: 'Amount ($M)',
        nameTextStyle: { color: '#475569', fontSize: 9, fontFamily: 'Inter, sans-serif' },
        axisLabel: {
          color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
          formatter: (v: number) => `$${v}M`,
        },
        splitLine: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
      },
    ],
    series: [
      {
        name: 'PO Count',
        type: 'line',
        yAxisIndex: 0,
        data: counts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#10B981', width: 2.5 },
        itemStyle: { color: '#10B981', borderColor: '#0E1C30', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16,185,129,0.20)' },
              { offset: 1, color: 'rgba(16,185,129,0.01)' },
            ],
          },
        },
        connectNulls: true,
      },
      {
        name: 'PO Amount',
        type: 'line',
        yAxisIndex: 1,
        data: amounts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#3B82F6', width: 2.5 },
        itemStyle: { color: '#3B82F6', borderColor: '#0E1C30', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.15)' },
              { offset: 1, color: 'rgba(59,130,246,0.01)' },
            ],
          },
        },
        connectNulls: true,
      },
    ],
  }), [counts, amounts]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default MonthlyPOTrendChart;
