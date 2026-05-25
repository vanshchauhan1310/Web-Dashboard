import React from 'react';
import { TrendingUp, Percent, Box, Package, Tag, AlertTriangle } from 'lucide-react';
import { useProductKPIs } from '../hooks/useAnalytics';

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

const ProductKPIs: React.FC = () => {
  const { data, isLoading } = useProductKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!data) return null;

  const margin: number = data.profit_margin ?? 0;
  const marginGradient =
    margin >= 15 ? 'linear-gradient(135deg, #10B981, #059669)'
    : margin >= 5  ? 'linear-gradient(135deg, #F59E0B, #D97706)'
    :                'linear-gradient(135deg, #F43F5E, #E11D48)';
  const marginGlow =
    margin >= 15 ? 'rgba(16,185,129,0.35)' : margin >= 5 ? 'rgba(245,158,11,0.35)' : 'rgba(244,63,94,0.35)';
  const marginSub = margin >= 15 ? 'Healthy margin' : margin >= 5 ? 'Average margin' : 'Below target';

  const lossPct: number = data.loss_orders_pct ?? 0;
  const lossGradient =
    lossPct <= 15 ? 'linear-gradient(135deg, #10B981, #059669)'
    : lossPct <= 30 ? 'linear-gradient(135deg, #F59E0B, #D97706)'
    :                 'linear-gradient(135deg, #F43F5E, #E11D48)';
  const lossGlow =
    lossPct <= 15 ? 'rgba(16,185,129,0.35)' : lossPct <= 30 ? 'rgba(245,158,11,0.35)' : 'rgba(244,63,94,0.35)';
  const lossSub = lossPct <= 15 ? 'Low risk exposure' : lossPct <= 30 ? 'Moderate loss rate' : 'High loss rate — review';

  const cards: KPICardProps[] = [
    {
      label: 'Total Profit',
      value: fmtMoney(data.profit),
      sub: 'Net earnings across products',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      glow: 'rgba(16,185,129,0.35)',
    },
    {
      label: 'Profit Margin',
      value: `${margin.toFixed(1)}%`,
      sub: marginSub,
      icon: Percent,
      gradient: marginGradient,
      glow: marginGlow,
    },
    {
      label: 'Units Sold',
      value: fmtCount(data.total_units),
      sub: 'Total quantity dispatched',
      icon: Box,
      gradient: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
      glow: 'rgba(139,92,246,0.35)',
    },
    {
      label: 'Unique SKUs',
      value: fmtCount(data.unique_products),
      sub: 'Distinct products sold',
      icon: Package,
      gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
      glow: 'rgba(59,130,246,0.35)',
    },
    {
      label: 'Avg Discount Given',
      value: `${(data.avg_discount ?? 0).toFixed(1)}%`,
      sub: 'Mean discount per order line',
      icon: Tag,
      gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      glow: 'rgba(245,158,11,0.35)',
    },
    {
      label: 'Loss-Making Lines',
      value: `${lossPct.toFixed(1)}%`,
      sub: lossSub,
      icon: AlertTriangle,
      gradient: lossGradient,
      glow: lossGlow,
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

export default ProductKPIs;
