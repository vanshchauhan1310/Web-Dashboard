import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

// Stages: 0=PO Issued, 1=In Transit, 2=Warehouse Arrival, 3=Shelf Available
const STAGE_LABELS  = ['PO Issued', 'In Transit', 'Warehouse Arrival', 'Shelf Available'];
const STAGE_COLORS  = ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981'];
const STAGE_LIGHT   = ['#3B82F640', '#F59E0B40', '#8B5CF640', '#10B98140'];

// Items: [name, category, [stageStart, stageEnd][] for each of 4 stages]
// Day offsets from May 1, 2025
const ALL_ITEMS: Array<{
  name: string;
  cat:  string;
  stages: [number, number][];
}> = [
  { name: 'Steel Rods',      cat: 'Raw Materials',  stages: [[0,3],[3,13],[13,15],[15,18]] },
  { name: 'Circuit Boards',  cat: 'Electronics',    stages: [[1,3],[3,17],[17,19],[19,23]] },
  { name: 'Office Chairs',   cat: 'Furniture',      stages: [[2,4],[4,11],[11,13],[13,16]] },
  { name: 'Paper Reams',     cat: 'Office Supplies', stages: [[0,2],[2,7],[7,8],[8,10]] },
  { name: 'Copper Wire',     cat: 'Raw Materials',  stages: [[3,5],[5,16],[16,18],[18,22]] },
  { name: 'Server Racks',    cat: 'IT & Software',  stages: [[1,4],[4,19],[19,22],[22,26]] },
  { name: 'Safety Gloves',   cat: 'Consumables',    stages: [[4,6],[6,12],[12,14],[14,16]] },
  { name: 'Packing Film',    cat: 'Logistics',      stages: [[2,3],[3,9],[9,11],[11,13]] },
  { name: 'LCD Displays',    cat: 'Electronics',    stages: [[5,7],[7,21],[21,24],[24,28]] },
  { name: 'Cleaning Fluid',  cat: 'Consumables',    stages: [[0,2],[2,6],[6,7],[7,9]] },
];

const InventoryReplenishmentGantt: React.FC = () => {
  const { filters } = useProcurementFilters();

  const items = useMemo(() => {
    if (filters.category !== 'All Categories') {
      return ALL_ITEMS.filter(it => it.cat === filters.category);
    }
    return ALL_ITEMS;
  }, [filters.category]);

  // Build custom series data: each row = [stageIdx, itemIdx, start, end]
  const ganttData = useMemo(() => {
    const data: { value: [number, number, number, number]; itemStyle: { color: string } }[] = [];
    items.forEach((item, itemIdx) => {
      item.stages.forEach((stage, stageIdx) => {
        data.push({
          value: [stageIdx, itemIdx, stage[0], stage[1]],
          itemStyle: { color: STAGE_COLORS[stageIdx] },
        });
      });
    });
    return data;
  }, [items]);

  const maxDay = useMemo(() =>
    items.reduce((m, it) => Math.max(m, it.stages[3]?.[1] ?? 0), 0) + 2,
  [items]);

  const option = useMemo<EChartsCoreOption>(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0A1525',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: [10, 14] as [number, number],
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
      formatter: (params: any) => {
        const [stageIdx, itemIdx, start, end] = params.value as [number, number, number, number];
        const item = items[itemIdx];
        const color = STAGE_COLORS[stageIdx];
        return `<div style="font-weight:600;margin-bottom:4px">${item?.name ?? ''}</div>
          <span style="color:${color};font-weight:700">${STAGE_LABELS[stageIdx]}</span><br/>
          <span style="color:#64748B">Day ${start} → Day ${end} &nbsp;(${end - start}d)</span>`;
      },
    },
    legend: {
      bottom: 0,
      data: STAGE_LABELS.map((name, i) => ({
        name,
        icon: 'roundRect',
        itemStyle: { color: STAGE_COLORS[i] },
      })),
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 10, itemHeight: 8, itemGap: 14,
    },
    grid: { top: 8, right: 16, bottom: 52, left: 16, containLabel: true },
    xAxis: {
      type: 'value',
      min: 0,
      max: maxDay,
      name: 'Days from PO Issue',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: '#475569', fontSize: 9, fontFamily: 'Inter, sans-serif' },
      axisLabel: {
        color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif',
        formatter: (v: number) => `D${v}`,
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick:  { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map(it => it.name),
      axisLabel: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick:  { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
    },
    series: [{
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const stageIdx = api.value(0) as number;
        const itemIdx  = api.value(1) as number;
        const start    = api.coord([api.value(2), itemIdx]);
        const end      = api.coord([api.value(3), itemIdx]);
        const barHeight = (api.size([0, 1]) as number[])[1] * 0.52;
        const x = start[0];
        const y = start[1] - barHeight / 2;
        const width = end[0] - start[0];
        const color = STAGE_COLORS[stageIdx];
        const lightColor = STAGE_LIGHT[stageIdx];

        return {
          type: 'group',
          children: [
            {
              type: 'rect',
              shape: { x, y, width: Math.max(width, 2), height: barHeight, r: 4 },
              style: {
                fill: color,
                opacity: 0.88,
                shadowBlur: params.context.hover ? 8 : 0,
                shadowColor: color,
              },
              emphasis: {
                style: { fill: color, opacity: 1, shadowBlur: 14, shadowColor: color },
              },
              focus: 'self',
            },
            // Background track for this stage (subtle)
            ...(stageIdx === 0 ? [{
              type: 'rect',
              shape: { x: start[0], y: y - barHeight * 0.08, width: end[0] - start[0], height: barHeight * 1.16, r: 4 },
              style: { fill: lightColor },
              z: -1,
            }] : []),
          ],
        };
      },
      data: ganttData,
      encode: {
        x: [2, 3],
        y: 1,
        tooltip: [0, 1, 2, 3],
      },
      clip: true,
    }],
  }), [items, ganttData, maxDay]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default InventoryReplenishmentGantt;
