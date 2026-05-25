import React from 'react';
import { DollarSign, Clock, CheckCircle, Package, Zap, TrendingUp } from 'lucide-react';
import { useShippingKPIs, type ShippingFilters } from '../../hooks/useAnalytics';

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, sub, icon: Icon, gradient, glow }) => (
  <div
    className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3 cursor-default"
    style={{ background: '#0E1C30', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
  >
    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: gradient }} />
    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: gradient, boxShadow: `0 4px 14px ${glow}` }}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <p className="text-[26px] font-bold text-textMain leading-none tracking-tight">{value}</p>
      <p className="text-[12px] font-semibold text-textSub mt-2">{label}</p>
      <p className="text-[11px] text-textMuted mt-0.5">{sub}</p>
    </div>
  </div>
);

const Skeleton: React.FC = () => (
  <div className="rounded-2xl p-5 animate-pulse" style={{ background: '#0E1C30', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="w-9 h-9 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
    <div className="h-7 w-24 rounded mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
    <div className="h-3 w-20 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
  </div>
);

const fmtMoney = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};

const fmtCount = (n: number) => n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : n.toLocaleString();

interface Props { filters: ShippingFilters }

const ShippingKPIs: React.FC<Props> = ({ filters }) => {
  const { data, isLoading } = useShippingKPIs(filters);

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
    </div>
  );

  if (!data) return null;

  const onTime: number = data.on_time_rate ?? 0;
  const onTimeGrad = onTime >= 85 ? 'linear-gradient(135deg,#10B981,#059669)' : onTime >= 70 ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#F43F5E,#E11D48)';
  const onTimeGlow = onTime >= 85 ? 'rgba(16,185,129,0.35)' : onTime >= 70 ? 'rgba(245,158,11,0.35)' : 'rgba(244,63,94,0.35)';
  const onTimeSub = onTime >= 85 ? 'Excellent delivery' : onTime >= 70 ? 'Room to improve' : 'High delay rate';

  const cards: KPICardProps[] = [
    {
      label: 'Total Shipping Cost',
      value: fmtMoney(data.total_shipping_cost),
      sub: 'Logistics spend in period',
      icon: DollarSign,
      gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)',
      glow: 'rgba(245,158,11,0.35)',
    },
    {
      label: 'Avg Delivery Days',
      value: `${(data.avg_delivery_days ?? 0).toFixed(1)}d`,
      sub: 'Mean door-to-door time',
      icon: Clock,
      gradient: 'linear-gradient(135deg,#8B5CF6,#A855F7)',
      glow: 'rgba(139,92,246,0.35)',
    },
    {
      label: 'On-Time Rate',
      value: `${onTime.toFixed(1)}%`,
      sub: onTimeSub,
      icon: CheckCircle,
      gradient: onTimeGrad,
      glow: onTimeGlow,
    },
    {
      label: 'Total Shipments',
      value: fmtCount(data.total_shipments),
      sub: 'Unique orders dispatched',
      icon: Package,
      gradient: 'linear-gradient(135deg,#3B82F6,#6366F1)',
      glow: 'rgba(59,130,246,0.35)',
    },
    {
      label: 'Express Shipping',
      value: `${(data.express_pct ?? 0).toFixed(1)}%`,
      sub: 'First Class + Same Day share',
      icon: Zap,
      gradient: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
      glow: 'rgba(6,182,212,0.35)',
    },
    {
      label: 'Avg Cost / Shipment',
      value: fmtMoney(data.avg_cost_per_shipment),
      sub: 'Logistics cost efficiency',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg,#10B981,#059669)',
      glow: 'rgba(16,185,129,0.35)',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => <KPICard key={c.label} {...c} />)}
    </div>
  );
};

export default ShippingKPIs;
