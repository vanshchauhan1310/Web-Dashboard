import React from 'react';
import { DollarSign, ShoppingCart, Users, Globe, MapPin, Tag } from 'lucide-react';
import { useExecutiveKPIs, type ExecutiveFilters } from '../../hooks/useAnalytics';

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
    style={{
      background: '#0E1C30',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}
  >
    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: gradient }} />
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: gradient, boxShadow: `0 4px 14px ${glow}` }}
    >
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <p className="text-[26px] font-bold text-textMain leading-none tracking-tight">{value}</p>
      <p className="text-[12px] font-semibold text-textSub mt-2">{label}</p>
      <p className="text-[11px] text-textMuted mt-0.5">{sub}</p>
    </div>
  </div>
);

const SkeletonCard: React.FC = () => (
  <div
    className="rounded-2xl p-5 animate-pulse"
    style={{ background: '#0E1C30', border: '1px solid rgba(255,255,255,0.07)' }}
  >
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

const fmtCount = (n: number) =>
  n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : n.toLocaleString();

const ExecutiveKPIs: React.FC<{ filters: ExecutiveFilters }> = ({ filters }) => {
  const { data, isLoading } = useExecutiveKPIs(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!data) return null;

  const discount: number = data.avg_discount ?? 0;
  const discountGradient =
    discount <= 10
      ? 'linear-gradient(135deg, #10B981, #059669)'
      : discount <= 20
      ? 'linear-gradient(135deg, #F59E0B, #D97706)'
      : 'linear-gradient(135deg, #F43F5E, #E11D48)';
  const discountGlow =
    discount <= 10 ? 'rgba(16,185,129,0.35)' : discount <= 20 ? 'rgba(245,158,11,0.35)' : 'rgba(244,63,94,0.35)';
  const discountSub =
    discount <= 10 ? 'Healthy pricing' : discount <= 20 ? 'Moderate discounting' : 'High discount pressure';

  const cards: KPICardProps[] = [
    {
      label: 'Total Revenue',
      value: fmtMoney(data.revenue),
      sub: 'Gross sales across all markets',
      icon: DollarSign,
      gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)',
      glow: 'rgba(59,130,246,0.35)',
    },
    {
      label: 'Total Orders',
      value: fmtCount(data.total_orders),
      sub: 'Unique order IDs processed',
      icon: ShoppingCart,
      gradient: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
      glow: 'rgba(139,92,246,0.35)',
    },
    {
      label: 'Active Customers',
      value: fmtCount(data.active_customers),
      sub: 'Distinct buyers in period',
      icon: Users,
      gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
      glow: 'rgba(6,182,212,0.35)',
    },
    {
      label: 'Markets Active',
      value: String(data.active_markets),
      sub: 'Distinct sales markets',
      icon: Globe,
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      glow: 'rgba(16,185,129,0.35)',
    },
    {
      label: 'Countries Reached',
      value: String(data.active_countries),
      sub: 'Geographic footprint',
      icon: MapPin,
      gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      glow: 'rgba(245,158,11,0.35)',
    },
    {
      label: 'Avg Discount Rate',
      value: `${discount.toFixed(1)}%`,
      sub: discountSub,
      icon: Tag,
      gradient: discountGradient,
      glow: discountGlow,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
};

export default ExecutiveKPIs;
