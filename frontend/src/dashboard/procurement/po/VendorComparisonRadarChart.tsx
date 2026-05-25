import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const ALL_VENDORS = [
  { name: 'SupplyCo Ltd', color: '#10B981', values: [88, 92, 85, 91, 76] },
  { name: 'TechVend Inc', color: '#3B82F6', values: [76, 88, 94, 79, 83] },
  { name: 'LogiPro',      color: '#8B5CF6', values: [81, 95, 78, 84, 91] },
  { name: 'ConsultPro',   color: '#F59E0B', values: [93, 80, 82, 87, 68] },
  { name: 'OfficeBase',   color: '#06B6D4', values: [85, 87, 90, 93, 72] },
];

const DIMENSIONS = [
  'Cost',
  'Delivery\nSpeed',
  'Quality',
  'Low\nDelay %',
  'PO\nVolume',
];

const VendorComparisonRadarChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const vendors = useMemo(() => {
    if (filters.supplier !== 'All Suppliers') {
      const match = ALL_VENDORS.find(v => v.name === filters.supplier);
      return match ? [match] : ALL_VENDORS;
    }
    return ALL_VENDORS;
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
        const v = params.value as number[];
        return `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>
          <div style="color:#94A3B8;line-height:2">
            Cost Score: <span style="color:#10B981;font-weight:700">${v[0]}</span><br/>
            Delivery Speed: <span style="color:#10B981;font-weight:700">${v[1]}</span><br/>
            Quality: <span style="color:#10B981;font-weight:700">${v[2]}</span><br/>
            Low Delay %: <span style="color:#10B981;font-weight:700">${v[3]}</span><br/>
            PO Volume: <span style="color:#10B981;font-weight:700">${v[4]}</span>
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
      radius: '60%',
      center: ['50%', '46%'],
      shape: 'polygon',
      axisName: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter, sans-serif' },
      splitLine:  { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      splitArea:  { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)'] } },
      axisLine:   { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    series: [{
      type: 'radar',
      data: vendors.map(v => ({
        name: v.name,
        value: v.values,
        lineStyle: { color: v.color, width: 2 },
        itemStyle: { color: v.color },
        areaStyle: { color: v.color + '22' },
        symbol: 'circle',
        symbolSize: 5,
      })),
    }],
  }), [vendors]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default VendorComparisonRadarChart;
