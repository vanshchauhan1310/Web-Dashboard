import React from 'react';
import { Building2, Truck, Star, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

const KPIS = [
  { label: 'Total Suppliers',      value: '34',     delta: '+2',     up: true,  sub: 'active this period',    icon: Building2,    color: '#3B82F6' },
  { label: 'On-Time Delivery',     value: '87.3%',  delta: '+2.1%',  up: true,  sub: 'avg across suppliers',  icon: Truck,        color: '#10B981' },
  { label: 'Avg Quality Score',    value: '88/100', delta: '+3pts',   up: true,  sub: 'weighted avg',          icon: Star,         color: '#F59E0B' },
  { label: 'At-Risk Suppliers',    value: '3',      delta: '-1',     up: true,  sub: 'below threshold',       icon: AlertTriangle, color: '#EF4444' },
  { label: 'Contract Compliance',  value: '94.8%',  delta: '+1.4%',  up: true,  sub: 'terms adhered',         icon: ShieldCheck,  color: '#10B981' },
  { label: 'Avg Lead Time',        value: '8.4d',   delta: '-0.6d',  up: true,  sub: 'days to deliver',       icon: Clock,        color: '#06B6D4' },
];

const SupplierKPIs: React.FC = () => (
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

export default SupplierKPIs;
