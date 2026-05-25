import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import type { EChartsCoreOption } from 'echarts';

function generateDailyPOData(): [string, number][] {
  const data: [string, number][] = [];
  const start = new Date('2025-01-01');
  const end   = new Date('2025-12-31');

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow   = d.getDay();
    const month = d.getMonth();
    if (dow === 0 || dow === 6) {
      // weekends rarely have POs
      if (Math.random() < 0.12) data.push([d.toISOString().slice(0, 10), 1]);
      continue;
    }
    // mid-week gets more activity; Q2-Q3 are busier procurement periods
    let base = Math.floor(Math.random() * 12) + 2;
    if (dow === 3 || dow === 4) base = Math.floor(base * 1.4);
    if (month >= 2 && month <= 8) base = Math.floor(base * 1.25);
    // spikes: month-end and quarter-end
    const dayOfMonth = d.getDate();
    const daysInMonth = new Date(d.getFullYear(), month + 1, 0).getDate();
    if (dayOfMonth >= daysInMonth - 2) base = Math.floor(base * 1.7);
    data.push([d.toISOString().slice(0, 10), Math.min(base, 35)]);
  }

  return data;
}

const DAILY_DATA = generateDailyPOData();

const POCalendarHeatmap: React.FC = () => {
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
        const [date, count] = params.value as [string, number];
        return `<div style="font-weight:600;margin-bottom:4px">${date}</div>
          POs placed: <span style="color:#10B981;font-weight:700">${count}</span>`;
      },
    },
    visualMap: {
      min: 0,
      max: 35,
      show: false,
      inRange: {
        color: ['#0E1C30', '#064E3B', '#065F46', '#059669', '#10B981', '#34D399'],
      },
    },
    calendar: {
      top: 30,
      left: 40,
      right: 20,
      bottom: 10,
      range: '2025',
      cellSize: ['auto', 13],
      splitLine: { show: false },
      itemStyle: {
        borderColor: 'rgba(255,255,255,0.04)',
        borderWidth: 2,
        borderRadius: 2,
        color: '#0E1C30',
      },
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 1,
        nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        color: '#475569',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      monthLabel: {
        color: '#64748B',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: DAILY_DATA,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(16,185,129,0.5)',
        },
      },
    }],
  }), []);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default POCalendarHeatmap;
