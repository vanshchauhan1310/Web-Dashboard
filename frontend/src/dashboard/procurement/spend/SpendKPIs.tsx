import React from 'react';
import { DollarSign, Percent, TrendingUp, Building2, Wallet, ClipboardList } from 'lucide-react';

const KPIS = [
  { label: 'Total Spend',         value: '$2.71M',  delta: '+12.3%', up: true,  sub: 'vs prior period',      icon: DollarSign,    color: '#3B82F6' },
  { label: 'Budget Utilisation',  value: '83.2%',   delta: '-4.1pp', up: true,  sub: 'under budget',         icon: Percent,       color: '#10B981' },
  { label: 'Avg Order Value',     value: '$12,450',  delta: '+3.8%',  up: true,  sub: 'per purchase order',   icon: TrendingUp,    color: '#8B5CF6' },
  { label: 'Active Vendors',      value: '34',       delta: '+2',     up: true,  sub: 'this period',          icon: Building2,     color: '#F59E0B' },
  { label: 'Cost Savings',        value: '$180K',    delta: '+22%',   up: true,  sub: 'vs allocated budget',  icon: Wallet,        color: '#10B981' },
  { label: 'Purchase Orders',     value: '218',      delta: '+18',    up: true,  sub: 'orders placed',        icon: ClipboardList, color: '#06B6D4' },
];

const SpendKPIs: React.FC = () => (
  <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
    {KPIS.map(({ label, value, delta, up, sub, icon: Icon, color }) => (
      <div key={label} className="rounded-2xl px-4 py-4 flex flex-col gap-2.5 transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}18`, color }}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color:      up ? '#10B981' : '#EF4444',
            }}>
            {delta}
          </span>
        </div>
        <div>
          <p className="text-[20px] font-bold text-textMain leading-none tracking-tight">{value}</p>
          <p className="text-[11px] text-textMuted mt-1.5 font-medium leading-tight">{label}</p>
          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: '#334155' }}>{sub}</p>
        </div>
      </div>
    ))}
  </div>
);

export default SpendKPIs;
