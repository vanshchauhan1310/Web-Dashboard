import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

// 20 SKUs sorted by annual value desc — mirrors a real Pareto distribution
const ALL_SKUS = [
  { sku: 'Steel Rods',      value: 420, cat: 'Raw Materials'  },
  { sku: 'Circuit Boards',  value: 385, cat: 'Electronics'    },
  { sku: 'Server Racks',    value: 340, cat: 'IT & Software'  },
  { sku: 'Copper Wire',     value: 310, cat: 'Raw Materials'  },
  { sku: 'Diesel Fuel',     value: 280, cat: 'Consumables'    },
  { sku: 'LCD Displays',    value: 245, cat: 'Electronics'    },
  { sku: 'Hydraulic Pump',  value: 210, cat: 'Raw Materials'  },
  { sku: 'Network Switch',  value: 185, cat: 'IT & Software'  },
  { sku: 'Office Chairs',   value: 148, cat: 'Furniture'      },
  { sku: 'Safety Gloves',   value: 120, cat: 'Consumables'    },
  { sku: 'Packing Tape',    value: 95,  cat: 'Logistics'      },
  { sku: 'Printer Ink',     value: 82,  cat: 'Office Supplies'},
  { sku: 'A4 Paper Reams',  value: 74,  cat: 'Office Supplies'},
  { sku: 'USB-C Cables',    value: 65,  cat: 'Electronics'    },
  { sku: 'Desk Lamps',      value: 58,  cat: 'Furniture'      },
  { sku: 'Cleaning Fluid',  value: 48,  cat: 'Consumables'    },
  { sku: 'Zip Ties',        value: 38,  cat: 'Logistics'      },
  { sku: 'Ballpoint Pens',  value: 29,  cat: 'Office Supplies'},
  { sku: 'Paper Clips',     value: 18,  cat: 'Office Supplies'},
  { sku: 'Sticky Notes',    value: 12,  cat: 'Office Supplies'},
];

const TOTAL = ALL_SKUS.reduce((s, d) => s + d.value, 0);

// Assign ABC classes: A = cumulative 0–80%, B = 80–95%, C = 95–100%
function assignClass(cumPct: number): 'A' | 'B' | 'C' {
  if (cumPct <= 80) return 'A';
  if (cumPct <= 95) return 'B';
  return 'C';
}

const CLASS_COLOR = { A: '#10B981', B: '#3B82F6', C: '#F59E0B' };
const CLASS_LABEL = { A: 'Class A — High Value', B: 'Class B — Medium Value', C: 'Class C — Low Value' };

const ABCInventoryChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const { names, values, classes, cumulative } = useMemo(() => {
    let skus = ALL_SKUS;
    if (filters.category !== 'All Categories') {
      skus = skus.filter(s => s.cat === filters.category);
    }

    // Cumulative % calculated against the visible set's total for a proper Pareto
    const setTotal = skus.reduce((s, d) => s + d.value, 0) || 1;
    let cumSum = 0;
    const processed = skus.map(s => {
      cumSum += s.value;
      const cumPct = parseFloat(((cumSum / setTotal) * 100).toFixed(1));
      return { ...s, cumPct, class: assignClass(cumPct) as 'A' | 'B' | 'C' };
    });

    // Only filter by class when a specific class is chosen (not 'All Classes')
    const classLetter =
      filters.abc_class !== 'All Classes'
        ? (filters.abc_class.split(' ')[1] as 'A' | 'B' | 'C')
        : null;
    const filtered = classLetter
      ? processed.filter(s => s.class === classLetter)
      : processed;

    return {
      names:      filtered.map(s => s.sku),
      values:     filtered.map(s => s.value),
      classes:    filtered.map(s => s.class),
      cumulative: filtered.map(s => s.cumPct),
    };
  }, [filters.category, filters.abc_class]);

  const option = useMemo<EChartsCoreOption>(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: 'rgba(255,255,255,0.1)' } },
      backgroundColor: '#0A1525',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: [10, 14] as [number, number],
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
      formatter: (params: any) => {
        const arr = params as any[];
        const barP  = arr.find((p: any) => p.seriesName === 'Annual Value');
        const lineP = arr.find((p: any) => p.seriesName === 'Cumulative %');
        if (!barP) return '';
        const cls = classes[barP.dataIndex] ?? 'A';
        const clsColor = CLASS_COLOR[cls];
        return `<div style="font-weight:600;margin-bottom:6px">${barP.axisValueLabel}</div>
          <div style="line-height:2">
            <span style="color:${clsColor}">●</span> Class <b>${cls}</b>: <span style="color:${clsColor};font-weight:700">$${barP.value}K</span><br/>
            <span style="color:#94A3B8">◆</span> Cumulative: <span style="color:#94A3B8;font-weight:700">${lineP?.value ?? '—'}%</span>
          </div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 16,
      data: [
        { name: 'Class A — High Value',   icon: 'circle', itemStyle: { color: CLASS_COLOR.A } },
        { name: 'Class B — Medium Value', icon: 'circle', itemStyle: { color: CLASS_COLOR.B } },
        { name: 'Class C — Low Value',    icon: 'circle', itemStyle: { color: CLASS_COLOR.C } },
        { name: 'Cumulative %',           icon: 'circle', itemStyle: { color: '#94A3B8' } },
      ],
    },
    grid: { top: 12, right: 56, bottom: 52, left: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: '#64748B', fontSize: 9, fontFamily: 'Inter, sans-serif',
        rotate: 35, interval: 0,
        formatter: (v: string) => v.length > 10 ? v.slice(0, 10) + '…' : v,
      },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick:  { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Annual Value ($K)',
        nameTextStyle: { color: '#475569', fontSize: 9, fontFamily: 'Inter, sans-serif' },
        axisLabel: {
          color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
          formatter: (v: number) => `$${v}K`,
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false }, axisTick: { show: false },
      },
      {
        type: 'value',
        name: 'Cumulative %',
        min: 0, max: 100,
        nameTextStyle: { color: '#475569', fontSize: 9, fontFamily: 'Inter, sans-serif' },
        axisLabel: {
          color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
          formatter: (v: number) => `${v}%`,
        },
        splitLine: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
      },
    ],
    // Background bands: A=0-80%, B=80-95%, C=95-100% (visual only via markArea on bar series)
    series: [
      {
        name: 'Annual Value',
        type: 'bar',
        yAxisIndex: 0,
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: CLASS_COLOR[classes[i]],
            borderRadius: [3, 3, 0, 0],
            opacity: 0.88,
          },
          // legend association
          seriesName: CLASS_LABEL[classes[i]],
        })),
        barMaxWidth: 28,
        emphasis: { itemStyle: { opacity: 1, shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.4)' } },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              yAxis: 0,
              lineStyle: { color: 'rgba(255,255,255,0.0)', width: 0 },
            },
          ],
        },
      },
      // Invisible series just for legend items
      { name: 'Class A — High Value',   type: 'bar', data: [], itemStyle: { color: CLASS_COLOR.A } },
      { name: 'Class B — Medium Value', type: 'bar', data: [], itemStyle: { color: CLASS_COLOR.B } },
      { name: 'Class C — Low Value',    type: 'bar', data: [], itemStyle: { color: CLASS_COLOR.C } },
      {
        name: 'Cumulative %',
        type: 'line',
        yAxisIndex: 1,
        data: cumulative,
        smooth: false,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#94A3B8', width: 2 },
        itemStyle: { color: '#94A3B8', borderColor: '#0E1C30', borderWidth: 2 },
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.12)', width: 1 },
          data: [
            { yAxis: 80,  label: { formatter: '80%', color: '#10B981', fontSize: 9 } },
            { yAxis: 95,  label: { formatter: '95%', color: '#3B82F6', fontSize: 9 } },
          ],
        },
      },
    ],
  }), [names, values, classes, cumulative]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default ABCInventoryChart;
