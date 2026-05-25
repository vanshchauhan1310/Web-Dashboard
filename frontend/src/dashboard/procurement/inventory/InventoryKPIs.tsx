import React from 'react';
import {
  Package, AlertTriangle, TrendingUp, Layers,
  RefreshCcw, DollarSign, Clock, BarChart2,
} from 'lucide-react';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';

const BASE_KPIS = [
  {
    label: 'Total SKUs',
    value: '2,847',
    delta: '+64',
    up: true,
    sub: 'active stock items',
    icon: Package,
    color: '#3B82F6',
  },
  {
    label: 'Low Stock Alerts',
    value: '143',
    delta: '+18',
    up: false,
    sub: '5.0% of SKUs at risk',
    icon: AlertTriangle,
    color: '#EF4444',
  },
  {
    label: 'Inventory Value',
    value: '$8.4M',
    delta: '+6.2%',
    up: true,
    sub: 'total stock on hand',
    icon: DollarSign,
    color: '#10B981',
  },
  {
    label: 'Turnover Rate',
    value: '6.2×',
    delta: '+0.4×',
    up: true,
    sub: 'inventory turns / yr',
    icon: TrendingUp,
    color: '#8B5CF6',
  },
  {
    label: 'Days of Supply',
    value: '28d',
    delta: '-2d',
    up: true,
    sub: 'avg stock runway',
    icon: Clock,
    color: '#F59E0B',
  },
  {
    label: 'Reorder Points Hit',
    value: '87',
    delta: '+11',
    up: false,
    sub: 'items below ROP',
    icon: RefreshCcw,
    color: '#EF4444',
  },
  {
    label: 'Fill Rate',
    value: '94.7%',
    delta: '+1.3pp',
    up: true,
    sub: 'order line fill rate',
    icon: BarChart2,
    color: '#06B6D4',
  },
  {
    label: 'Stock Categories',
    value: '8',
    delta: '+1',
    up: true,
    sub: 'product categories',
    icon: Layers,
    color: '#EC4899',
  },
];

const CLASS_SCALE: Record<string, number> = {
  'Class A — High Value':   0.2,
  'Class B — Medium Value': 0.35,
  'Class C — Low Value':    0.45,
};

const InventoryKPIs: React.FC = () => {
  const { filters } = useProcurementFilters();
  const scale = CLASS_SCALE[filters.abc_class];

  const kpis = BASE_KPIS.map(k => {
    if (!scale) return k;
    if (k.label === 'Total SKUs') {
      const v = Math.round(2847 * scale);
      return { ...k, value: v.toLocaleString(), sub: 'items in this class' };
    }
    if (k.label === 'Inventory Value') {
      const v = (8.4 * scale).toFixed(1);
      return { ...k, value: `$${v}M` };
    }
    return k;
  });

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

export default InventoryKPIs;
