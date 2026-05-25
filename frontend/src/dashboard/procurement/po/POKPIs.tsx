import React from 'react';
import {
  ClipboardList, Clock, CheckCircle2, XCircle,
  Truck, DollarSign, Timer, TrendingUp,
} from 'lucide-react';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';

const BASE_KPIS = [
  {
    label: 'Total POs',
    value: '1,247',
    delta: '+18',
    up: true,
    sub: 'orders this period',
    icon: ClipboardList,
    color: '#3B82F6',
  },
  {
    label: 'Pending Approval',
    value: '234',
    delta: '+12',
    up: false,
    sub: '18.8% of total',
    icon: Clock,
    color: '#F59E0B',
  },
  {
    label: 'Approved',
    value: '687',
    delta: '+8.4%',
    up: true,
    sub: '55.1% approval rate',
    icon: CheckCircle2,
    color: '#10B981',
  },
  {
    label: 'Rejected',
    value: '89',
    delta: '-3.2%',
    up: true,
    sub: '7.1% rejection rate',
    icon: XCircle,
    color: '#EF4444',
  },
  {
    label: 'Delivered',
    value: '181',
    delta: '+21%',
    up: true,
    sub: 'fulfilled orders',
    icon: Truck,
    color: '#8B5CF6',
  },
  {
    label: 'Total PO Value',
    value: '$22.8M',
    delta: '+12.3%',
    up: true,
    sub: 'vs prior period',
    icon: DollarSign,
    color: '#06B6D4',
  },
  {
    label: 'Avg Cycle Time',
    value: '4.2d',
    delta: '-0.8d',
    up: true,
    sub: 'req → approval',
    icon: Timer,
    color: '#EC4899',
  },
  {
    label: 'On-Time Rate',
    value: '87.3%',
    delta: '+3.2pp',
    up: true,
    sub: 'vs 84.1% target',
    icon: TrendingUp,
    color: '#10B981',
  },
];

const STATUS_KPI_MAP: Record<string, typeof BASE_KPIS[number][]> = {
  Pending:   BASE_KPIS.map((k, i) => i === 0 ? { ...k, value: '234', delta: '+12', sub: 'pending orders' } : k),
  Approved:  BASE_KPIS.map((k, i) => i === 0 ? { ...k, value: '687', delta: '+8.4%', sub: 'approved orders' } : k),
  Rejected:  BASE_KPIS.map((k, i) => i === 0 ? { ...k, value: '89',  delta: '-3.2%', sub: 'rejected orders' } : k),
  Closed:    BASE_KPIS.map((k, i) => i === 0 ? { ...k, value: '56',  delta: '+5',    sub: 'closed orders'   } : k),
  Delivered: BASE_KPIS.map((k, i) => i === 0 ? { ...k, value: '181', delta: '+21%',  sub: 'delivered orders'} : k),
};

const POKPIs: React.FC = () => {
  const { filters } = useProcurementFilters();
  const kpis = STATUS_KPI_MAP[filters.status] ?? BASE_KPIS;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {kpis.map(({ label, value, delta, up, sub, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-2xl px-4 py-4 flex flex-col gap-2.5 transition-all duration-200 cursor-default"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}18`, color }}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color:      up ? '#10B981'              : '#EF4444',
              }}
            >
              {delta}
            </span>
          </div>
          <div>
            <p className="text-[19px] font-bold text-textMain leading-none tracking-tight">{value}</p>
            <p className="text-[11px] text-textMuted mt-1.5 font-medium leading-tight">{label}</p>
            <p className="text-[10px] mt-0.5 leading-tight" style={{ color: '#334155' }}>{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default POKPIs;
