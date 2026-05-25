import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const MONTHLY = {
  labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  actual: [180, 210, 195, 250, 285, 260, 320, 275, 350, 305, 380, 420],
  budget: [200, 200, 220, 250, 260, 260, 300, 300, 330, 360, 370, 400],
};

const QUARTERLY = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  actual: [585, 795, 945, 1105],
  budget: [620, 770, 930, 1130],
};

const PERIOD_SLICE: Record<string, number> = {
  'This Month': 1, 'Last Quarter': 3, 'Last 6 Months': 6,
  'Last Year': 12, 'This Year': 12, 'All Time': 12,
};

const MonthlySpendTrendChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const chartData = useMemo(() => {
    if (filters.view_by === 'Quarterly') return QUARTERLY;
    const n = PERIOD_SLICE[filters.time_period] ?? 12;
    return {
      labels: MONTHLY.labels.slice(-n),
      actual: MONTHLY.actual.slice(-n),
      budget: MONTHLY.budget.slice(-n),
    };
  }, [filters.view_by, filters.time_period]);

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
        const actual  = params.find((p: any) => p.seriesName === 'Actual');
        const budget  = params.find((p: any) => p.seriesName === 'Budget');
        const variance = budget && actual ? budget.value - actual.value : 0;
        return `<div style="font-weight:600;margin-bottom:6px">${params[0]?.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Actual: <span style="color:#10B981;font-weight:700">$${actual?.value ?? 0}K</span><br/>
            Budget: <span style="color:#64748B;font-weight:700">$${budget?.value ?? 0}K</span><br/>
            ${variance >= 0
              ? `Savings: <span style="color:#34D399;font-weight:700">$${variance}K under budget</span>`
              : `Overrun: <span style="color:#F87171;font-weight:700">$${Math.abs(variance)}K over budget</span>`
            }
          </div>`;
      },
    },
    legend: {
      top: 0, right: 0,
      textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      itemWidth: 10, itemHeight: 10, itemGap: 16,
      icon: 'roundRect',
    },
    grid: { left: '3%', right: '3%', top: '12%', bottom: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chartData.labels,
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif', formatter: (v: number) => `$${v}K` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'Budget',
        type: 'line',
        data: chartData.budget,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#475569', width: 1.5, type: 'dashed' },
        itemStyle: { color: '#475569' },
        z: 1,
      },
      {
        name: 'Actual',
        type: 'line',
        data: chartData.actual,
        smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#10B981', width: 2.5 },
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16,185,129,0.28)' },
              { offset: 1, color: 'rgba(16,185,129,0.01)' },
            ],
          },
        },
        z: 2,
      },
    ],
  }), [chartData]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default MonthlySpendTrendChart;
