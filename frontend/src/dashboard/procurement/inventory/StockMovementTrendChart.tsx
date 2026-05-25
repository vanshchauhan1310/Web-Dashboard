import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKS  = Array.from({ length: 52 }, (_, i) => `W${i + 1}`);

const MONTHLY_INFLOW      = [3200, 2850, 4100, 4680, 5120, 4870, 4320, 5640, 6100, 5480, 5920, 6350];
const MONTHLY_OUTFLOW     = [2800, 2400, 3600, 4100, 4500, 4200, 3900, 5100, 5600, 5000, 5400, 5900];
const MONTHLY_CONSUMPTION = [2600, 2200, 3400, 3900, 4200, 3950, 3700, 4800, 5200, 4700, 5100, 5600];

function genWeekly(monthly: number[]): number[] {
  const result: number[] = [];
  monthly.forEach(m => {
    const base = m / 4;
    for (let w = 0; w < 4; w++) {
      result.push(Math.round(base * (0.85 + Math.random() * 0.3)));
    }
  });
  return result.slice(0, 52);
}

const StockMovementTrendChart: React.FC = () => {
  const { filters } = useProcurementFilters();
  const isWeekly = filters.view_by === 'Weekly';

  const { labels, inflow, outflow, consumption } = useMemo(() => {
    if (isWeekly) {
      return {
        labels:      WEEKS,
        inflow:      genWeekly(MONTHLY_INFLOW),
        outflow:     genWeekly(MONTHLY_OUTFLOW),
        consumption: genWeekly(MONTHLY_CONSUMPTION),
      };
    }
    return {
      labels:      MONTHS,
      inflow:      MONTHLY_INFLOW,
      outflow:     MONTHLY_OUTFLOW,
      consumption: MONTHLY_CONSUMPTION,
    };
  }, [isWeekly]);

  const net = useMemo(() => inflow.map((v, i) => v - outflow[i]), [inflow, outflow]);

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
        const [inf, out, cons, n] = params as any[];
        const sign = (n?.value ?? 0) >= 0 ? '+' : '';
        return `<div style="font-weight:600;margin-bottom:6px">${inf?.axisValueLabel}</div>
          <div style="line-height:2">
            <span style="color:#10B981">●</span> Inflow: <span style="color:#10B981;font-weight:700">${inf?.value?.toLocaleString()}</span><br/>
            <span style="color:#EF4444">●</span> Outflow: <span style="color:#EF4444;font-weight:700">${out?.value?.toLocaleString()}</span><br/>
            <span style="color:#F59E0B">●</span> Consumption: <span style="color:#F59E0B;font-weight:700">${cons?.value?.toLocaleString()}</span><br/>
            <span style="color:#94A3B8">●</span> Net: <span style="color:#94A3B8;font-weight:700">${sign}${n?.value?.toLocaleString()}</span>
          </div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 16,
      icon: 'circle',
    },
    grid: { top: 16, right: 20, bottom: 48, left: 52 },
    dataZoom: isWeekly ? [
      { type: 'inside', start: 0, end: 40 },
      {
        type: 'slider', height: 18, bottom: 36,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        dataBackground: { areaStyle: { color: 'rgba(16,185,129,0.15)' } },
        selectedDataBackground: { areaStyle: { color: 'rgba(16,185,129,0.3)' } },
        handleStyle: { color: '#10B981' },
        moveHandleStyle: { color: '#10B981' },
        textStyle: { color: '#475569', fontSize: 9 },
      },
    ] : undefined,
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: {
        color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
        interval: isWeekly ? 3 : 0,
      },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick:  { show: false },
    },
    yAxis: {
      type: 'value',
      name: isWeekly ? 'Units / week' : 'Units / month',
      nameTextStyle: { color: '#475569', fontSize: 9, fontFamily: 'Inter, sans-serif' },
      axisLabel: {
        color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`,
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine:  { show: false }, axisTick: { show: false },
    },
    series: [
      {
        name: 'Inflow',
        type: 'line',
        data: inflow,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#10B981', width: 2.5 },
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16,185,129,0.18)' },
              { offset: 1, color: 'rgba(16,185,129,0.01)' },
            ],
          },
        },
      },
      {
        name: 'Outflow',
        type: 'line',
        data: outflow,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#EF4444', width: 2.5 },
        itemStyle: { color: '#EF4444' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239,68,68,0.12)' },
              { offset: 1, color: 'rgba(239,68,68,0.01)' },
            ],
          },
        },
      },
      {
        name: 'Consumption',
        type: 'line',
        data: consumption,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#F59E0B', width: 2, type: 'dashed' },
        itemStyle: { color: '#F59E0B' },
      },
      {
        name: 'Net Movement',
        type: 'line',
        data: net,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#94A3B8', width: 1.5, type: 'dotted' },
        itemStyle: { color: '#94A3B8' },
      },
    ],
  }), [labels, inflow, outflow, consumption, net, isWeekly]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default StockMovementTrendChart;
