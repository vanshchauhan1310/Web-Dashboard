import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const ALL_SUPPLIERS = [
  { name: 'SupplyCo Ltd', color: '#10B981', values: [94, 92, 88, 90, 85] },
  { name: 'TechVend Inc', color: '#3B82F6', values: [88, 95, 72, 85, 80] },
  { name: 'LogiPro',      color: '#8B5CF6', values: [79, 81, 91, 75, 88] },
  { name: 'ConsultPro',   color: '#F59E0B', values: [91, 89, 78, 94, 70] },
  { name: 'OfficeBase',   color: '#06B6D4', values: [87, 84, 96, 82, 91] },
];

const DIMENSIONS = [
  'On-Time\nDelivery',
  'Quality\nScore',
  'Cost\nEfficiency',
  'Responsive-\nness',
  'Flexibility',
];

const SupplierRadarChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const suppliers = useMemo(() => {
    if (filters.supplier !== 'All Suppliers') {
      return ALL_SUPPLIERS.filter(s => s.name === filters.supplier);
    }
    return ALL_SUPPLIERS;
  }, [filters.supplier]);

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
        const vals = params.value as number[];
        return `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>
          <div style="color:#94A3B8;line-height:2">
            On-Time Delivery: <span style="color:#10B981;font-weight:700">${vals[0]}%</span><br/>
            Quality Score: <span style="color:#10B981;font-weight:700">${vals[1]}%</span><br/>
            Cost Efficiency: <span style="color:#10B981;font-weight:700">${vals[2]}%</span><br/>
            Responsiveness: <span style="color:#10B981;font-weight:700">${vals[3]}%</span><br/>
            Flexibility: <span style="color:#10B981;font-weight:700">${vals[4]}%</span>
          </div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      itemWidth: 8, itemHeight: 8, itemGap: 12,
      icon: 'circle',
    },
    radar: {
      indicator: DIMENSIONS.map(name => ({ name, max: 100 })),
      radius: '62%',
      center: ['50%', '46%'],
      shape: 'polygon',
      axisName: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      splitLine:  { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      splitArea:  { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)'] } },
      axisLine:   { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    series: [{
      type: 'radar',
      data: suppliers.map(s => ({
        name:  s.name,
        value: s.values,
        lineStyle:  { color: s.color, width: 2 },
        itemStyle:  { color: s.color },
        areaStyle:  { color: s.color + '22' },
        symbol: 'circle',
        symbolSize: 5,
      })),
    }],
  }), [suppliers]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default SupplierRadarChart;
