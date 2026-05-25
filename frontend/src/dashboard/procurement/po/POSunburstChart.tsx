import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const STATUS_COLORS: Record<string, string> = {
  Approved:  '#10B981',
  Pending:   '#F59E0B',
  Delivered: '#3B82F6',
  Closed:    '#8B5CF6',
  Rejected:  '#EF4444',
};

const ALL_DATA = [
  {
    name: 'Approved',
    itemStyle: { color: '#10B981' },
    children: [
      {
        name: 'Raw Materials',
        itemStyle: { color: '#10B981bb' },
        children: [
          { name: 'SupplyCo Ltd', value: 180, itemStyle: { color: '#10B98188' } },
          { name: 'GlobalMat',    value: 120, itemStyle: { color: '#10B98166' } },
          { name: 'OreGroup',     value: 85,  itemStyle: { color: '#10B98155' } },
        ],
      },
      {
        name: 'IT & Software',
        itemStyle: { color: '#059669bb' },
        children: [
          { name: 'TechVend Inc', value: 145, itemStyle: { color: '#05966988' } },
          { name: 'CloudSys',     value: 80,  itemStyle: { color: '#05966966' } },
        ],
      },
      {
        name: 'Logistics',
        itemStyle: { color: '#047857bb' },
        children: [
          { name: 'LogiPro',      value: 77,  itemStyle: { color: '#04785788' } },
        ],
      },
    ],
  },
  {
    name: 'Pending',
    itemStyle: { color: '#F59E0B' },
    children: [
      {
        name: 'Prof. Services',
        itemStyle: { color: '#F59E0Bbb' },
        children: [
          { name: 'ConsultPro', value: 68, itemStyle: { color: '#F59E0B88' } },
          { name: 'AdviseCo',   value: 42, itemStyle: { color: '#F59E0B66' } },
        ],
      },
      {
        name: 'Office Supplies',
        itemStyle: { color: '#D97706bb' },
        children: [
          { name: 'OfficeBase', value: 55, itemStyle: { color: '#D9770688' } },
        ],
      },
      {
        name: 'Marketing',
        itemStyle: { color: '#B45309bb' },
        children: [
          { name: 'MarkMedia', value: 38, itemStyle: { color: '#B4530988' } },
          { name: 'AdCraft',   value: 31, itemStyle: { color: '#B4530966' } },
        ],
      },
    ],
  },
  {
    name: 'Delivered',
    itemStyle: { color: '#3B82F6' },
    children: [
      {
        name: 'Raw Materials',
        itemStyle: { color: '#3B82F6bb' },
        children: [
          { name: 'SupplyCo Ltd', value: 72, itemStyle: { color: '#3B82F688' } },
          { name: 'OreGroup',     value: 48, itemStyle: { color: '#3B82F666' } },
        ],
      },
      {
        name: 'Utilities',
        itemStyle: { color: '#2563EBbb' },
        children: [
          { name: 'PowerGrid Co', value: 61, itemStyle: { color: '#2563EB88' } },
        ],
      },
    ],
  },
  {
    name: 'Rejected',
    itemStyle: { color: '#EF4444' },
    children: [
      {
        name: 'IT & Software',
        itemStyle: { color: '#EF4444bb' },
        children: [
          { name: 'TechVend Inc', value: 31, itemStyle: { color: '#EF444488' } },
          { name: 'CloudSys',     value: 18, itemStyle: { color: '#EF444466' } },
        ],
      },
      {
        name: 'Marketing',
        itemStyle: { color: '#DC2626bb' },
        children: [
          { name: 'AdCraft',   value: 24, itemStyle: { color: '#DC262688' } },
          { name: 'MarkMedia', value: 16, itemStyle: { color: '#DC262666' } },
        ],
      },
    ],
  },
  {
    name: 'Closed',
    itemStyle: { color: '#8B5CF6' },
    children: [
      {
        name: 'Prof. Services',
        itemStyle: { color: '#8B5CF6bb' },
        children: [
          { name: 'ConsultPro', value: 30, itemStyle: { color: '#8B5CF688' } },
          { name: 'AdviseCo',   value: 16, itemStyle: { color: '#8B5CF666' } },
        ],
      },
      {
        name: 'Logistics',
        itemStyle: { color: '#7C3AEDbb' },
        children: [
          { name: 'LogiPro', value: 10, itemStyle: { color: '#7C3AED88' } },
        ],
      },
    ],
  },
];

const POSunburstChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const sunData = useMemo(() => {
    if (filters.status !== 'All Statuses') {
      return ALL_DATA.filter(d => d.name === filters.status);
    }
    return ALL_DATA;
  }, [filters.status]);

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
        const path = params.treePathInfo?.map((p: any) => p.name).join(' → ') ?? params.name;
        const color = STATUS_COLORS[params.treePathInfo?.[1]?.name] ?? '#10B981';
        return `<div style="font-weight:600;margin-bottom:4px;color:${color}">${params.name}</div>
          <div style="color:#94A3B8;font-size:11px">${path}</div>
          ${params.value ? `<div style="margin-top:4px">POs: <span style="color:${color};font-weight:700">${params.value}</span></div>` : ''}`;
      },
    },
    series: [{
      type: 'sunburst',
      data: sunData,
      radius: ['18%', '88%'],
      center: ['50%', '50%'],
      sort: undefined,
      emphasis: {
        focus: 'ancestor',
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0,0,0,0.6)',
        },
      },
      label: {
        show: true,
        fontFamily: 'Inter, sans-serif',
        color: '#E2E8F0',
        fontSize: 10,
        minAngle: 8,
        overflow: 'truncate',
      },
      levels: [
        {},
        {
          r0: '18%', r: '42%',
          label: { fontSize: 12, fontWeight: 700, rotate: 'tangential', minAngle: 15 },
          itemStyle: { borderWidth: 2, borderColor: '#0E1C30' },
        },
        {
          r0: '42%', r: '65%',
          label: { fontSize: 10, rotate: 'tangential', minAngle: 10 },
          itemStyle: { borderWidth: 1.5, borderColor: '#0E1C30' },
        },
        {
          r0: '65%', r: '88%',
          label: { fontSize: 9, position: 'outside', minAngle: 8, silent: false },
          itemStyle: { borderWidth: 1, borderColor: '#0E1C30' },
        },
      ],
    }],
  }), [sunData]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default POSunburstChart;
